use serde_json::Value;
use tauri::{AppHandle, State};

use crate::db::Database;
use crate::seo::ai_claude::test_claude_connection;
use crate::seo::ai_gemini::test_gemini_connection;
use crate::seo::ai_orchestrator::{
    orchestrate_generate_article, orchestrate_generate_meta_faq, orchestrate_generate_outline,
    orchestrate_rewrite_selection,
};
use crate::seo::crawler::{crawl_competitor_urls, fetch_sitemap_links};
use crate::seo::models::{
    CompetitorAnalysis, CreateSeoArticleInput, GenerateArticleInput, GenerateMetaFaqInput,
    GenerateOutlineInput, RewriteSelectionInput, SaveSeoAiConfigInput, SaveSeoSiteInput,
    SaveSeoTemplateInput, SeoAiConfig, SeoArticle, SeoInternalLink, SeoSite, SeoTemplate,
    SeoUsageSummary, TestAiConnectionInput, TestAiConnectionResult, UpdateSeoArticleInput,
};
use crate::seo::SeoStreamState;

// ==========================================
// 1. IPC COMMANDS CẤU HÌNH API & TEST KẾT NỐI
// ==========================================

#[tauri::command]
pub fn cmd_seo_get_ai_configs(db: State<'_, Database>) -> Result<Vec<SeoAiConfig>, String> {
    db.get_seo_ai_configs()
        .map_err(|e| format!("Lỗi tải danh sách API Key AI: {}", e))
}

#[tauri::command]
pub fn cmd_seo_save_ai_config(
    db: State<'_, Database>,
    input: SaveSeoAiConfigInput,
) -> Result<SeoAiConfig, String> {
    db.save_seo_ai_config(input)
        .map_err(|e| format!("Lỗi lưu cấu hình API AI: {}", e))
}

#[tauri::command]
pub fn cmd_seo_delete_ai_config(db: State<'_, Database>, id: i64) -> Result<(), String> {
    db.delete_seo_ai_config(id)
        .map_err(|e| format!("Lỗi xóa cấu hình API AI: {}", e))
}

#[tauri::command]
pub async fn cmd_seo_test_ai_connection(
    input: TestAiConnectionInput,
) -> Result<TestAiConnectionResult, String> {
    let base = input.base_url.unwrap_or_default();
    if input.provider == "claude" {
        Ok(test_claude_connection(&input.api_key, &base, &input.model).await)
    } else {
        Ok(test_gemini_connection(&input.api_key, &base, &input.model).await)
    }
}

// ==========================================
// 2. IPC COMMANDS QUẢN LÝ WEBSITE & SITEMAP
// ==========================================

#[tauri::command]
pub fn cmd_seo_get_sites(db: State<'_, Database>) -> Result<Vec<SeoSite>, String> {
    db.get_seo_sites()
        .map_err(|e| format!("Lỗi tải danh sách Website: {}", e))
}

#[tauri::command]
pub fn cmd_seo_save_site(
    db: State<'_, Database>,
    input: SaveSeoSiteInput,
) -> Result<SeoSite, String> {
    db.save_seo_site(input)
        .map_err(|e| format!("Lỗi lưu thông tin Website: {}", e))
}

#[tauri::command]
pub fn cmd_seo_delete_site(db: State<'_, Database>, id: i64) -> Result<(), String> {
    db.delete_seo_site(id)
        .map_err(|e| format!("Lỗi xóa Website: {}", e))
}

#[tauri::command]
pub fn cmd_seo_get_internal_links(
    db: State<'_, Database>,
    site_id: i64,
) -> Result<Vec<SeoInternalLink>, String> {
    db.get_seo_internal_links(site_id)
        .map_err(|e| format!("Lỗi tải danh sách Internal Link: {}", e))
}

#[tauri::command]
pub async fn cmd_seo_sync_sitemap(
    db: State<'_, Database>,
    site_id: i64,
    sitemap_url: String,
) -> Result<usize, String> {
    let links = fetch_sitemap_links(&sitemap_url).await?;
    db.replace_seo_internal_links(site_id, links)
        .map_err(|e| format!("Lỗi lưu Internal Link vào SQLite: {}", e))
}

// ==========================================
// 3. IPC COMMANDS PROMPT TEMPLATES & ARTICLES
// ==========================================

#[tauri::command]
pub fn cmd_seo_get_templates(db: State<'_, Database>) -> Result<Vec<SeoTemplate>, String> {
    db.get_seo_templates()
        .map_err(|e| format!("Lỗi tải danh sách mẫu bài SEO: {}", e))
}

#[tauri::command]
pub fn cmd_seo_save_template(
    db: State<'_, Database>,
    input: SaveSeoTemplateInput,
) -> Result<SeoTemplate, String> {
    db.save_seo_template(input)
        .map_err(|e| format!("Lỗi lưu mẫu bài SEO: {}", e))
}

#[tauri::command]
pub fn cmd_seo_delete_template(db: State<'_, Database>, id: i64) -> Result<(), String> {
    db.delete_seo_template(id)
        .map_err(|e| format!("Lỗi xóa mẫu bài SEO: {}", e))
}

#[tauri::command]
pub fn cmd_seo_get_articles(
    db: State<'_, Database>,
    site_id: Option<i64>,
    status: Option<String>,
    search: Option<String>,
) -> Result<Vec<SeoArticle>, String> {
    db.get_seo_articles(site_id, status, search)
        .map_err(|e| format!("Lỗi tải danh sách bài viết SEO: {}", e))
}

#[tauri::command]
pub fn cmd_seo_get_article_detail(
    db: State<'_, Database>,
    id: i64,
) -> Result<Option<SeoArticle>, String> {
    db.get_seo_article_by_id(id)
        .map_err(|e| format!("Lỗi tải chi tiết bài viết SEO: {}", e))
}

#[tauri::command]
pub fn cmd_seo_create_article(
    db: State<'_, Database>,
    input: CreateSeoArticleInput,
) -> Result<SeoArticle, String> {
    db.create_seo_article(input)
        .map_err(|e| format!("Lỗi tạo bài viết SEO mới: {}", e))
}

#[tauri::command]
pub fn cmd_seo_update_article(
    db: State<'_, Database>,
    input: UpdateSeoArticleInput,
) -> Result<(), String> {
    db.update_seo_article(input)
        .map_err(|e| format!("Lỗi cập nhật bài viết SEO: {}", e))
}

#[tauri::command]
pub fn cmd_seo_delete_article(db: State<'_, Database>, id: i64) -> Result<(), String> {
    db.delete_seo_article(id)
        .map_err(|e| format!("Lỗi xóa bài viết SEO: {}", e))
}

// ==========================================
// 4. IPC COMMANDS CRAWLER & AI STREAMING PIPELINE
// ==========================================

#[tauri::command]
pub async fn cmd_seo_crawl_competitors(urls: Vec<String>) -> Result<Vec<CompetitorAnalysis>, String> {
    Ok(crawl_competitor_urls(urls).await)
}

#[tauri::command]
pub fn cmd_seo_stop_generation(stream_state: State<'_, SeoStreamState>) -> Result<bool, String> {
    Ok(stream_state.cancel_active())
}

#[tauri::command]
pub async fn cmd_seo_generate_outline(
    app: AppHandle,
    db: State<'_, Database>,
    stream_state: State<'_, SeoStreamState>,
    input: GenerateOutlineInput,
) -> Result<String, String> {
    orchestrate_generate_outline(&app, &db, &stream_state, input).await
}

#[tauri::command]
pub async fn cmd_seo_generate_article(
    app: AppHandle,
    db: State<'_, Database>,
    stream_state: State<'_, SeoStreamState>,
    input: GenerateArticleInput,
) -> Result<String, String> {
    orchestrate_generate_article(&app, &db, &stream_state, input).await
}

#[tauri::command]
pub async fn cmd_seo_rewrite_selection(
    app: AppHandle,
    db: State<'_, Database>,
    stream_state: State<'_, SeoStreamState>,
    input: RewriteSelectionInput,
) -> Result<String, String> {
    orchestrate_rewrite_selection(&app, &db, &stream_state, input).await
}

#[tauri::command]
pub async fn cmd_seo_generate_meta_faq(
    app: AppHandle,
    db: State<'_, Database>,
    stream_state: State<'_, SeoStreamState>,
    input: GenerateMetaFaqInput,
) -> Result<Value, String> {
    orchestrate_generate_meta_faq(&app, &db, &stream_state, input).await
}

#[tauri::command]
pub fn cmd_seo_get_usage_summary(
    db: State<'_, Database>,
    month: String,
) -> Result<SeoUsageSummary, String> {
    db.get_seo_usage_summary(&month)
        .map_err(|e| format!("Lỗi tải thống kê chi phí Token AI: {}", e))
}
