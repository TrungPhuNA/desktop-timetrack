use chrono::Local;
use rusqlite::{params, OptionalExtension, Result, Row};

use crate::db::Database;
use crate::seo::models::{
    CreateSeoArticleInput, SeoArticle, SeoUsageSummary, UpdateSeoArticleInput,
};

/// Map một dòng SQL JOIN seo_articles + seo_sites sang struct SeoArticle
fn map_article_row(row: &Row) -> Result<SeoArticle> {
    Ok(SeoArticle {
        id: row.get(0)?,
        site_id: row.get(1)?,
        site_name: row.get::<_, Option<String>>(2)?.unwrap_or_else(|| "Chung".to_string()),
        site_color: row.get::<_, Option<String>>(3)?.unwrap_or_else(|| "#64748b".to_string()),
        template_id: row.get(4)?,
        primary_keyword: row.get(5)?,
        secondary_keywords: row.get(6)?,
        search_intent: row.get(7)?,
        competitor_urls: row.get(8)?,
        outline_json: row.get(9)?,
        title: row.get(10)?,
        slug: row.get(11)?,
        meta_title: row.get(12)?,
        meta_description: row.get(13)?,
        content_markdown: row.get(14)?,
        faq_json: row.get(15)?,
        image_prompts_json: row.get(16)?,
        word_count: row.get(17)?,
        seo_score: row.get(18)?,
        status: row.get(19)?,
        outline_provider: row.get(20)?,
        outline_model: row.get(21)?,
        write_provider: row.get(22)?,
        write_model: row.get(23)?,
        wp_post_id: row.get(24)?,
        wp_post_url: row.get(25)?,
        created_at: row.get(26)?,
        updated_at: row.get(27)?,
    })
}

const ARTICLE_SELECT_SQL: &str = "
    SELECT a.id, a.site_id, s.name, s.color, a.template_id,
           a.primary_keyword, a.secondary_keywords, a.search_intent,
           a.competitor_urls, a.outline_json, a.title, a.slug,
           a.meta_title, a.meta_description, a.content_markdown,
           a.faq_json, a.image_prompts_json, a.word_count, a.seo_score,
           a.status, a.outline_provider, a.outline_model,
           a.write_provider, a.write_model, a.wp_post_id, a.wp_post_url,
           a.created_at, a.updated_at
    FROM seo_articles a
    LEFT JOIN seo_sites s ON a.site_id = s.id
";

impl Database {
    /// Lấy danh sách bài viết SEO có hỗ trợ lọc theo Site, Trạng thái và Từ khóa tìm kiếm
    pub fn get_seo_articles(
        &self,
        site_id: Option<i64>,
        status: Option<String>,
        search: Option<String>,
    ) -> Result<Vec<SeoArticle>> {
        let conn = self.conn.lock().unwrap();
        let search_pattern = search
            .map(|s| s.trim().to_lowercase())
            .filter(|s| !s.is_empty())
            .map(|s| format!("%{}%", s));
        let status_filter = status.filter(|s| !s.trim().is_empty());

        let sql = format!(
            "{}
             WHERE (?1 IS NULL OR a.site_id = ?1)
               AND (?2 IS NULL OR a.status = ?2)
               AND (?3 IS NULL OR LOWER(a.primary_keyword) LIKE ?3 OR LOWER(a.title) LIKE ?3)
             ORDER BY a.updated_at DESC, a.id DESC;",
            ARTICLE_SELECT_SQL
        );

        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(
            params![site_id, status_filter, search_pattern],
            map_article_row,
        )?;

        rows.collect()
    }

    /// Lấy chi tiết 1 bài viết SEO theo ID
    pub fn get_seo_article_by_id(&self, id: i64) -> Result<Option<SeoArticle>> {
        let conn = self.conn.lock().unwrap();
        let sql = format!("{} WHERE a.id = ?1;", ARTICLE_SELECT_SQL);
        conn.query_row(&sql, params![id], map_article_row)
            .optional()
    }

    /// Tạo mới một bài viết SEO nháp từ từ khóa chính
    pub fn create_seo_article(&self, input: CreateSeoArticleInput) -> Result<SeoArticle> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let secondary = input
            .secondary_keywords
            .unwrap_or_else(|| "[]".to_string());
        let intent = input
            .search_intent
            .unwrap_or_else(|| "informational".to_string());

        conn.execute(
            "INSERT INTO seo_articles (
                site_id, template_id, primary_keyword, secondary_keywords, search_intent,
                status, outline_provider, write_provider, created_at, updated_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, 'draft', 'gemini', 'claude', ?6, ?7);",
            params![
                input.site_id,
                input.template_id,
                input.primary_keyword.trim(),
                secondary,
                intent,
                now,
                now
            ],
        )?;

        let new_id = conn.last_insert_rowid();
        drop(conn);
        self.get_seo_article_by_id(new_id)
            .map(|opt| opt.expect("Vừa tạo bài viết SEO nhưng không tìm thấy bản ghi"))
    }

    /// Cập nhật toàn bộ nội dung, dàn ý, meta và điểm SEO của bài viết
    pub fn update_seo_article(&self, input: UpdateSeoArticleInput) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        conn.execute(
            "UPDATE seo_articles
             SET site_id = ?1, template_id = ?2, primary_keyword = ?3,
                 secondary_keywords = ?4, search_intent = ?5, competitor_urls = ?6,
                 outline_json = ?7, title = ?8, slug = ?9, meta_title = ?10,
                 meta_description = ?11, content_markdown = ?12, faq_json = ?13,
                 image_prompts_json = ?14, word_count = ?15, seo_score = ?16,
                 status = ?17, outline_provider = ?18, outline_model = ?19,
                 write_provider = ?20, write_model = ?21, updated_at = ?22
             WHERE id = ?23;",
            params![
                input.site_id,
                input.template_id,
                input.primary_keyword.trim(),
                input.secondary_keywords,
                input.search_intent,
                input.competitor_urls,
                input.outline_json,
                input.title,
                input.slug,
                input.meta_title,
                input.meta_description,
                input.content_markdown,
                input.faq_json,
                input.image_prompts_json,
                input.word_count,
                input.seo_score,
                input.status,
                input.outline_provider,
                input.outline_model,
                input.write_provider,
                input.write_model,
                now,
                input.id
            ],
        )?;

        Ok(())
    }

    /// Xóa bài viết SEO theo ID
    pub fn delete_seo_article(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM seo_articles WHERE id = ?1;", params![id])?;
        Ok(())
    }

    /// Ghi nhận nhật ký tiêu thụ Token & chi phí ước tính cho mỗi lượt gọi Claude/Gemini
    pub fn log_seo_ai_usage(
        &self,
        article_id: Option<i64>,
        provider: &str,
        model: &str,
        action_type: &str,
        input_tokens: i64,
        output_tokens: i64,
        estimated_cost_usd: f64,
        duration_ms: i64,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        conn.execute(
            "INSERT INTO seo_ai_usage_logs (
                article_id, provider, model, action_type, input_tokens,
                output_tokens, estimated_cost_usd, duration_ms, created_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9);",
            params![
                article_id,
                provider,
                model,
                action_type,
                input_tokens,
                output_tokens,
                estimated_cost_usd,
                duration_ms,
                now
            ],
        )?;

        Ok(())
    }

    /// Tổng hợp chi phí Token AI theo tháng (định dạng YYYY-MM)
    pub fn get_seo_usage_summary(&self, month: &str) -> Result<SeoUsageSummary> {
        let conn = self.conn.lock().unwrap();
        let month_prefix = format!("{}%", month);

        let (total_requests, total_input, total_output, total_cost, claude_cost, gemini_cost): (
            i64,
            i64,
            i64,
            f64,
            f64,
            f64,
        ) = conn.query_row(
            "SELECT
                COUNT(*),
                COALESCE(SUM(input_tokens), 0),
                COALESCE(SUM(output_tokens), 0),
                COALESCE(SUM(estimated_cost_usd), 0.0),
                COALESCE(SUM(CASE WHEN provider = 'claude' THEN estimated_cost_usd ELSE 0.0 END), 0.0),
                COALESCE(SUM(CASE WHEN provider = 'gemini' THEN estimated_cost_usd ELSE 0.0 END), 0.0)
             FROM seo_ai_usage_logs
             WHERE created_at LIKE ?1;",
            params![month_prefix],
            |row| {
                Ok((
                    row.get(0)?,
                    row.get(1)?,
                    row.get(2)?,
                    row.get(3)?,
                    row.get(4)?,
                    row.get(5)?,
                ))
            },
        )?;

        Ok(SeoUsageSummary {
            month: month.to_string(),
            total_requests,
            total_input_tokens: total_input,
            total_output_tokens: total_output,
            total_cost_usd: total_cost,
            claude_cost_usd: claude_cost,
            gemini_cost_usd: gemini_cost,
        })
    }
}
