use std::time::Instant;

use serde_json::Value;
use tauri::{AppHandle, Emitter};
use tokio_util::sync::CancellationToken;

use crate::db::Database;
use crate::seo::ai_claude::{stream_claude, AiStreamResult};
use crate::seo::ai_gemini::stream_gemini;
use crate::seo::models::{
    CompetitorAnalysis, GenerateArticleInput, GenerateMetaFaqInput, GenerateOutlineInput,
    OutlineNode, RewriteSelectionInput, SeoArticle, SeoInternalLink, SeoSite, SeoStreamChunkEvent,
    SeoTemplate,
};
use crate::seo::prompts::{
    build_full_article_prompts, build_meta_faq_prompts, build_outline_prompts,
    build_rewrite_prompts, build_section_article_prompts, estimate_cost_usd, extract_json_block,
};
use crate::seo::SeoStreamState;

const SEO_STREAM_EVENT: &str = "seo-ai-stream-chunk";

/// Dữ liệu ngữ cảnh đã đọc xong từ SQLite để tránh giữ MutexGuard qua .await
struct ArticleContext {
    api_key: String,
    base_url: String,
    model: String,
    article: SeoArticle,
    site: Option<SeoSite>,
    template: Option<SeoTemplate>,
    links: Vec<SeoInternalLink>,
}

/// Đọc API Key hoạt động của provider
fn load_provider_credentials(
    db: &Database,
    provider: &str,
    model_override: &str,
) -> Result<(String, String, String), String> {
    let cfg = db
        .get_active_ai_config_by_provider(provider)
        .map_err(|e| format!("Lỗi đọc cấu hình AI {}: {}", provider, e))?
        .ok_or_else(|| {
            format!(
                "Chưa cấu hình hoặc chưa bật API Key cho {}. Hãy bấm 'API Claude & Gemini' để nhập Key.",
                provider.to_uppercase()
            )
        })?;
    if cfg.api_key.trim().is_empty() {
        return Err(format!("API Key của {} đang trống.", provider.to_uppercase()));
    }
    let model = if model_override.trim().is_empty() {
        cfg.default_model
    } else {
        model_override.trim().to_string()
    };
    Ok((cfg.api_key, cfg.base_url, model))
}

/// Đọc trọn bộ ngữ cảnh bài viết, site, template và credentials trước khi gọi AI async
fn load_article_context(
    db: &Database,
    article_id: i64,
    provider: &str,
    model_override: &str,
) -> Result<ArticleContext, String> {
    let article = db
        .get_seo_article_by_id(article_id)
        .map_err(|e| format!("Lỗi đọc bài viết: {}", e))?
        .ok_or_else(|| "Không tìm thấy bài viết SEO".to_string())?;
    let (api_key, base_url, model) = load_provider_credentials(db, provider, model_override)?;
    let site = article
        .site_id
        .and_then(|sid| db.get_seo_site_by_id(sid).ok().flatten());
    let template = article
        .template_id
        .and_then(|tid| db.get_seo_template_by_id(tid).ok().flatten());
    let links = article
        .site_id
        .and_then(|sid| db.get_seo_internal_links(sid).ok())
        .unwrap_or_default();
    Ok(ArticleContext { api_key, base_url, model, article, site, template, links })
}

/// Phát một chunk text hoặc tín hiệu kết thúc qua Tauri Event
fn emit_stream_event(
    app: &AppHandle,
    stream_id: &str,
    action: &str,
    chunk: &str,
    section_label: Option<String>,
    done: bool,
    error: Option<String>,
    input_tokens: i64,
    output_tokens: i64,
    cost_usd: f64,
) {
    let _ = app.emit(
        SEO_STREAM_EVENT,
        SeoStreamChunkEvent {
            stream_id: stream_id.to_string(),
            action: action.to_string(),
            chunk: chunk.to_string(),
            section_label,
            done,
            error,
            input_tokens,
            output_tokens,
            cost_usd,
        },
    );
}

/// Gọi chung Claude hoặc Gemini Streaming
async fn run_ai_stream(
    app: &AppHandle,
    stream_id: &str,
    action: &str,
    section_label: Option<String>,
    provider: &str,
    api_key: &str,
    base_url: &str,
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    max_tokens: i64,
    use_search_grounding: bool,
    cancel_token: CancellationToken,
) -> Result<AiStreamResult, String> {
    let app_clone = app.clone();
    let sid = stream_id.to_string();
    let act = action.to_string();
    let sec = section_label.clone();

    let emit_chunk = move |chunk: &str| {
        emit_stream_event(&app_clone, &sid, &act, chunk, sec.clone(), false, None, 0, 0, 0.0);
    };

    if provider == "claude" {
        stream_claude(api_key, base_url, model, system_prompt, user_prompt, max_tokens, cancel_token, emit_chunk).await
    } else {
        stream_gemini(api_key, base_url, model, system_prompt, user_prompt, max_tokens, use_search_grounding, cancel_token, emit_chunk).await
    }
}

/// Điều phối sinh Dàn ý (Outline) chuẩn SEO
pub async fn orchestrate_generate_outline(
    app: &AppHandle,
    db: &Database,
    stream_state: &SeoStreamState,
    input: GenerateOutlineInput,
) -> Result<String, String> {
    let started = Instant::now();
    let stream_id = format!("outline-{}", input.article_id);
    let ctx = load_article_context(db, input.article_id, &input.provider, &input.model)?;
    let secondary: Vec<String> = serde_json::from_str(&ctx.article.secondary_keywords).unwrap_or_default();
    let competitors: Vec<CompetitorAnalysis> = serde_json::from_str(&ctx.article.competitor_urls).unwrap_or_default();
    let (sp, up) = build_outline_prompts(
        &ctx.article.primary_keyword,
        &secondary,
        &ctx.article.search_intent,
        ctx.site.as_ref(),
        ctx.template.as_ref(),
        &competitors,
    );

    let token = stream_state.reset_and_create_token();
    let res = run_ai_stream(
        app, &stream_id, "outline", Some("Đang phân tích & tạo dàn ý chuẩn SEO...".to_string()),
        &input.provider, &ctx.api_key, &ctx.base_url, &ctx.model, &sp, &up, 4096, input.use_search_grounding, token,
    ).await;
    stream_state.clear_if_done();

    match res {
        Ok(r) => {
            let cost = estimate_cost_usd(&input.provider, &ctx.model, r.input_tokens, r.output_tokens);
            let _ = db.log_seo_ai_usage(Some(input.article_id), &input.provider, &ctx.model, "outline", r.input_tokens, r.output_tokens, cost, started.elapsed().as_millis() as i64);
            emit_stream_event(app, &stream_id, "outline", "", None, true, None, r.input_tokens, r.output_tokens, cost);
            Ok(extract_json_block(&r.full_text).unwrap_or(r.full_text))
        }
        Err(err) => {
            emit_stream_event(app, &stream_id, "outline", "", None, true, Some(err.clone()), 0, 0, 0.0);
            Err(err)
        }
    }
}

/// Gom các mục H3 vào H2 cha gần nhất để viết cuốn chiếu liền mạch
fn group_outline_sections(outline: &[OutlineNode]) -> Vec<OutlineNode> {
    let mut sections: Vec<OutlineNode> = Vec::new();
    for node in outline {
        if node.level == "h3" && !sections.is_empty() {
            if let Some(last) = sections.last_mut() {
                last.notes.push_str(&format!("\n  - Mục con H3: {} ({})", node.title, node.notes));
                last.target_words += node.target_words.max(150);
            }
        } else {
            sections.push(node.clone());
        }
    }
    sections
}

/// Điều phối viết bài (1 lượt hoặc cuốn chiếu từng H2)
pub async fn orchestrate_generate_article(
    app: &AppHandle,
    db: &Database,
    stream_state: &SeoStreamState,
    input: GenerateArticleInput,
) -> Result<String, String> {
    let started = Instant::now();
    let stream_id = format!("article-{}", input.article_id);
    let ctx = load_article_context(db, input.article_id, &input.provider, &input.model)?;
    let outline: Vec<OutlineNode> = serde_json::from_str(&ctx.article.outline_json).unwrap_or_default();
    if outline.is_empty() {
        return Err("Dàn ý (Outline) đang trống. Hãy tạo hoặc thêm mục H2 trước khi viết bài.".to_string());
    }
    let secondary: Vec<String> = serde_json::from_str(&ctx.article.secondary_keywords).unwrap_or_default();
    let title = if ctx.article.title.trim().is_empty() {
        ctx.article.primary_keyword.clone()
    } else {
        ctx.article.title.clone()
    };

    let token = stream_state.reset_and_create_token();
    let mut total_in = 0i64;
    let mut total_out = 0i64;
    let mut accumulated_md = String::new();

    if input.mode == "section_by_section" {
        let sections = group_outline_sections(&outline);
        let total_sec = sections.len();
        for (idx, sec) in sections.iter().enumerate() {
            if token.is_cancelled() {
                break;
            }
            let tail: String = accumulated_md.chars().rev().take(450).collect::<String>().chars().rev().collect();
            let label = format!("Mục {}/{}: {}", idx + 1, total_sec, sec.title);
            if idx > 0 {
                accumulated_md.push_str("\n\n");
                emit_stream_event(app, &stream_id, "article", "\n\n", Some(label.clone()), false, None, 0, 0, 0.0);
            }
            let (sp, up) = build_section_article_prompts(
                &ctx.article.primary_keyword, &secondary, &title, &outline, sec, idx, total_sec,
                &tail, ctx.site.as_ref(), ctx.template.as_ref(), &ctx.links,
            );
            match run_ai_stream(
                app, &stream_id, "article", Some(label), &input.provider,
                &ctx.api_key, &ctx.base_url, &ctx.model, &sp, &up, 3072, false, token.clone(),
            ).await {
                Ok(r) => {
                    total_in += r.input_tokens;
                    total_out += r.output_tokens;
                    accumulated_md.push_str(&r.full_text);
                    if r.cancelled { break; }
                }
                Err(err) => {
                    stream_state.clear_if_done();
                    emit_stream_event(app, &stream_id, "article", "", None, true, Some(err.clone()), total_in, total_out, 0.0);
                    return Err(err);
                }
            }
        }
    } else {
        let (sp, up) = build_full_article_prompts(
            &ctx.article.primary_keyword, &secondary, &title, &outline,
            ctx.site.as_ref(), ctx.template.as_ref(), &ctx.links,
        );
        match run_ai_stream(
            app, &stream_id, "article", Some("Đang viết toàn bài SEO...".to_string()),
            &input.provider, &ctx.api_key, &ctx.base_url, &ctx.model, &sp, &up, 8192, false, token,
        ).await {
            Ok(r) => { total_in = r.input_tokens; total_out = r.output_tokens; accumulated_md = r.full_text; }
            Err(err) => {
                stream_state.clear_if_done();
                emit_stream_event(app, &stream_id, "article", "", None, true, Some(err.clone()), 0, 0, 0.0);
                return Err(err);
            }
        }
    }

    stream_state.clear_if_done();
    let cost = estimate_cost_usd(&input.provider, &ctx.model, total_in, total_out);
    let _ = db.log_seo_ai_usage(Some(input.article_id), &input.provider, &ctx.model, "write", total_in, total_out, cost, started.elapsed().as_millis() as i64);
    emit_stream_event(app, &stream_id, "article", "", None, true, None, total_in, total_out, cost);
    Ok(accumulated_md)
}

/// Điều phối viết lại đoạn văn bản bôi đen
pub async fn orchestrate_rewrite_selection(
    app: &AppHandle,
    db: &Database,
    stream_state: &SeoStreamState,
    input: RewriteSelectionInput,
) -> Result<String, String> {
    let started = Instant::now();
    let stream_id = "rewrite-selection";
    let (api_key, base_url, model) = load_provider_credentials(db, &input.provider, &input.model)?;
    let (sp, up) = build_rewrite_prompts(&input.selected_text, &input.instruction, &input.context_keyword);

    let token = stream_state.reset_and_create_token();
    let res = run_ai_stream(
        app, stream_id, "rewrite", Some("Đang biên tập lại đoạn văn bản...".to_string()),
        &input.provider, &api_key, &base_url, &model, &sp, &up, 2048, false, token,
    ).await;
    stream_state.clear_if_done();

    match res {
        Ok(r) => {
            let cost = estimate_cost_usd(&input.provider, &model, r.input_tokens, r.output_tokens);
            let _ = db.log_seo_ai_usage(input.article_id, &input.provider, &model, "rewrite", r.input_tokens, r.output_tokens, cost, started.elapsed().as_millis() as i64);
            emit_stream_event(app, stream_id, "rewrite", "", None, true, None, r.input_tokens, r.output_tokens, cost);
            Ok(r.full_text)
        }
        Err(err) => {
            emit_stream_event(app, stream_id, "rewrite", "", None, true, Some(err.clone()), 0, 0, 0.0);
            Err(err)
        }
    }
}

/// Điều phối sinh bộ thẻ Meta Title, Description, Slug, FAQ Schema và Alt ảnh
pub async fn orchestrate_generate_meta_faq(
    app: &AppHandle,
    db: &Database,
    stream_state: &SeoStreamState,
    input: GenerateMetaFaqInput,
) -> Result<Value, String> {
    let started = Instant::now();
    let stream_id = format!("meta-{}", input.article_id);
    let ctx = load_article_context(db, input.article_id, &input.provider, &input.model)?;
    let (sp, up) = build_meta_faq_prompts(&ctx.article.primary_keyword, &ctx.article.title, &ctx.article.content_markdown);

    let token = stream_state.reset_and_create_token();
    let res = run_ai_stream(
        app, &stream_id, "meta", Some("Đang tối ưu Meta & FAQ Schema...".to_string()),
        &input.provider, &ctx.api_key, &ctx.base_url, &ctx.model, &sp, &up, 2048, false, token,
    ).await;
    stream_state.clear_if_done();

    match res {
        Ok(r) => {
            let cost = estimate_cost_usd(&input.provider, &ctx.model, r.input_tokens, r.output_tokens);
            let _ = db.log_seo_ai_usage(Some(input.article_id), &input.provider, &ctx.model, "meta", r.input_tokens, r.output_tokens, cost, started.elapsed().as_millis() as i64);
            emit_stream_event(app, &stream_id, "meta", "", None, true, None, r.input_tokens, r.output_tokens, cost);
            let clean_json = extract_json_block(&r.full_text)
                .ok_or_else(|| "AI không trả về đúng định dạng JSON cho Meta & FAQ".to_string())?;
            serde_json::from_str::<Value>(&clean_json)
                .map_err(|e| format!("Lỗi parse JSON Meta/FAQ: {}", e))
        }
        Err(err) => {
            emit_stream_event(app, &stream_id, "meta", "", None, true, Some(err.clone()), 0, 0, 0.0);
            Err(err)
        }
    }
}
