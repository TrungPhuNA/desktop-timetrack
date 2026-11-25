use chrono::Local;
use rusqlite::{params, OptionalExtension, Result, Row};

use crate::db::Database;
use crate::seo::models::{
    SaveSeoAiConfigInput, SaveSeoSiteInput, SaveSeoTemplateInput, SeoAiConfig, SeoInternalLink,
    SeoSite, SeoTemplate,
};

/// Map dòng SQL sang struct SeoAiConfig
fn map_ai_config(row: &Row) -> Result<SeoAiConfig> {
    Ok(SeoAiConfig {
        id: row.get(0)?,
        provider: row.get(1)?,
        label: row.get(2)?,
        api_key: row.get(3)?,
        base_url: row.get(4)?,
        default_model: row.get(5)?,
        is_active: row.get::<_, i64>(6)? != 0,
        is_default: row.get::<_, i64>(7)? != 0,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

/// Map dòng SQL sang struct SeoSite
fn map_site(row: &Row) -> Result<SeoSite> {
    Ok(SeoSite {
        id: row.get(0)?,
        name: row.get(1)?,
        domain: row.get(2)?,
        niche: row.get(3)?,
        brand_voice: row.get(4)?,
        target_audience: row.get(5)?,
        cta_template: row.get(6)?,
        sitemap_url: row.get(7)?,
        wp_api_url: row.get(8)?,
        wp_username: row.get(9)?,
        wp_app_password: row.get(10)?,
        color: row.get(11)?,
        internal_link_count: row.get(12)?,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
    })
}

/// Map dòng SQL sang struct SeoTemplate
fn map_template(row: &Row) -> Result<SeoTemplate> {
    Ok(SeoTemplate {
        id: row.get(0)?,
        name: row.get(1)?,
        article_type: row.get(2)?,
        system_prompt: row.get(3)?,
        outline_prompt: row.get(4)?,
        write_prompt: row.get(5)?,
        target_word_count: row.get(6)?,
        is_system: row.get::<_, i64>(7)? != 0,
        created_at: row.get(8)?,
        updated_at: row.get(9)?,
    })
}

impl Database {
    /// Lấy danh sách cấu hình API Claude & Gemini
    pub fn get_seo_ai_configs(&self) -> Result<Vec<SeoAiConfig>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, provider, label, api_key, base_url, default_model, is_active, is_default, created_at, updated_at
             FROM seo_ai_configs
             ORDER BY provider ASC, is_default DESC, id DESC;",
        )?;
        let rows = stmt.query_map([], map_ai_config)?;
        rows.collect()
    }

    /// Lấy API Config đang hoạt động của một provider (ưu tiên bản ghi is_default = 1)
    pub fn get_active_ai_config_by_provider(&self, provider: &str) -> Result<Option<SeoAiConfig>> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, provider, label, api_key, base_url, default_model, is_active, is_default, created_at, updated_at
             FROM seo_ai_configs
             WHERE provider = ?1 AND is_active = 1
             ORDER BY is_default DESC, id DESC
             LIMIT 1;",
            params![provider],
            map_ai_config,
        )
        .optional()
    }

    /// Tạo mới hoặc cập nhật cấu hình API Key AI (giữ duy nhất 1 default trên mỗi provider)
    pub fn save_seo_ai_config(&self, input: SaveSeoAiConfigInput) -> Result<SeoAiConfig> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let base_url = input.base_url.unwrap_or_default().trim().to_string();
        let is_active_int = if input.is_active { 1 } else { 0 };
        let is_default_int = if input.is_default { 1 } else { 0 };

        if input.is_default {
            tx.execute(
                "UPDATE seo_ai_configs SET is_default = 0 WHERE provider = ?1;",
                params![input.provider],
            )?;
        }

        let target_id = if let Some(id) = input.id {
            tx.execute(
                "UPDATE seo_ai_configs
                 SET provider = ?1, label = ?2, api_key = ?3, base_url = ?4, default_model = ?5,
                     is_active = ?6, is_default = ?7, updated_at = ?8
                 WHERE id = ?9;",
                params![
                    input.provider,
                    input.label.trim(),
                    input.api_key.trim(),
                    base_url,
                    input.default_model.trim(),
                    is_active_int,
                    is_default_int,
                    now,
                    id
                ],
            )?;
            id
        } else {
            tx.execute(
                "INSERT INTO seo_ai_configs (
                    provider, label, api_key, base_url, default_model,
                    is_active, is_default, created_at, updated_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9);",
                params![
                    input.provider,
                    input.label.trim(),
                    input.api_key.trim(),
                    base_url,
                    input.default_model.trim(),
                    is_active_int,
                    is_default_int,
                    now,
                    now
                ],
            )?;
            tx.last_insert_rowid()
        };

        tx.commit()?;
        conn.query_row(
            "SELECT id, provider, label, api_key, base_url, default_model, is_active, is_default, created_at, updated_at
             FROM seo_ai_configs WHERE id = ?1;",
            params![target_id],
            map_ai_config,
        )
    }

    /// Xóa cấu hình API Key AI
    pub fn delete_seo_ai_config(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM seo_ai_configs WHERE id = ?1;", params![id])?;
        Ok(())
    }

    /// Lấy danh sách hồ sơ Website kèm số lượng Internal Link đã đồng bộ
    pub fn get_seo_sites(&self) -> Result<Vec<SeoSite>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT s.id, s.name, s.domain, s.niche, s.brand_voice, s.target_audience,
                    s.cta_template, s.sitemap_url, s.wp_api_url, s.wp_username,
                    s.wp_app_password, s.color,
                    (SELECT COUNT(*) FROM seo_internal_links l WHERE l.site_id = s.id) AS link_count,
                    s.created_at, s.updated_at
             FROM seo_sites s
             ORDER BY s.name ASC;",
        )?;
        let rows = stmt.query_map([], map_site)?;
        rows.collect()
    }

    /// Lấy chi tiết 1 Website theo ID
    pub fn get_seo_site_by_id(&self, site_id: i64) -> Result<Option<SeoSite>> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT s.id, s.name, s.domain, s.niche, s.brand_voice, s.target_audience,
                    s.cta_template, s.sitemap_url, s.wp_api_url, s.wp_username,
                    s.wp_app_password, s.color,
                    (SELECT COUNT(*) FROM seo_internal_links l WHERE l.site_id = s.id) AS link_count,
                    s.created_at, s.updated_at
             FROM seo_sites s WHERE s.id = ?1;",
            params![site_id],
            map_site,
        )
        .optional()
    }

    /// Tạo hoặc cập nhật Website Profile
    pub fn save_seo_site(&self, input: SaveSeoSiteInput) -> Result<SeoSite> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let color = input.color.unwrap_or_else(|| "#4f46e5".to_string());
        let wp_api = input.wp_api_url.unwrap_or_default();
        let wp_user = input.wp_username.unwrap_or_default();
        let wp_pass = input.wp_app_password.unwrap_or_default();

        let target_id = if let Some(id) = input.id {
            conn.execute(
                "UPDATE seo_sites
                 SET name = ?1, domain = ?2, niche = ?3, brand_voice = ?4, target_audience = ?5,
                     cta_template = ?6, sitemap_url = ?7, wp_api_url = ?8, wp_username = ?9,
                     wp_app_password = ?10, color = ?11, updated_at = ?12
                 WHERE id = ?13;",
                params![
                    input.name.trim(),
                    input.domain.trim(),
                    input.niche.trim(),
                    input.brand_voice,
                    input.target_audience,
                    input.cta_template,
                    input.sitemap_url.trim(),
                    wp_api,
                    wp_user,
                    wp_pass,
                    color,
                    now,
                    id
                ],
            )?;
            id
        } else {
            conn.execute(
                "INSERT INTO seo_sites (
                    name, domain, niche, brand_voice, target_audience, cta_template,
                    sitemap_url, wp_api_url, wp_username, wp_app_password, color, created_at, updated_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13);",
                params![
                    input.name.trim(),
                    input.domain.trim(),
                    input.niche.trim(),
                    input.brand_voice,
                    input.target_audience,
                    input.cta_template,
                    input.sitemap_url.trim(),
                    wp_api,
                    wp_user,
                    wp_pass,
                    color,
                    now,
                    now
                ],
            )?;
            conn.last_insert_rowid()
        };

        drop(conn);
        self.get_seo_site_by_id(target_id)
            .map(|opt| opt.expect("Vừa lưu Website nhưng không tìm thấy bản ghi"))
    }

    /// Xóa hồ sơ Website
    pub fn delete_seo_site(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM seo_sites WHERE id = ?1;", params![id])?;
        Ok(())
    }

    /// Lấy danh sách Internal Links của 1 Website
    pub fn get_seo_internal_links(&self, site_id: i64) -> Result<Vec<SeoInternalLink>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, site_id, url, title, keywords, synced_at
             FROM seo_internal_links
             WHERE site_id = ?1
             ORDER BY id ASC;",
        )?;

        let rows = stmt.query_map(params![site_id], |row| {
            Ok(SeoInternalLink {
                id: row.get(0)?,
                site_id: row.get(1)?,
                url: row.get(2)?,
                title: row.get(3)?,
                keywords: row.get(4)?,
                synced_at: row.get(5)?,
            })
        })?;

        rows.collect()
    }

    /// Thay thế toàn bộ Internal Links của Site sau khi đồng bộ Sitemap.xml
    pub fn replace_seo_internal_links(
        &self,
        site_id: i64,
        links: Vec<(String, String)>,
    ) -> Result<usize> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        tx.execute(
            "DELETE FROM seo_internal_links WHERE site_id = ?1;",
            params![site_id],
        )?;

        let mut inserted = 0usize;
        for (url, title) in links {
            let changed = tx.execute(
                "INSERT OR IGNORE INTO seo_internal_links (site_id, url, title, keywords, synced_at)
                 VALUES (?1, ?2, ?3, '', ?4);",
                params![site_id, url, title, now],
            )?;
            inserted += changed;
        }

        tx.commit()?;
        Ok(inserted)
    }

    /// Lấy danh sách Prompt Templates chuẩn SEO
    pub fn get_seo_templates(&self) -> Result<Vec<SeoTemplate>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, article_type, system_prompt, outline_prompt, write_prompt,
                    target_word_count, is_system, created_at, updated_at
             FROM seo_templates
             ORDER BY is_system DESC, id ASC;",
        )?;
        let rows = stmt.query_map([], map_template)?;
        rows.collect()
    }

    /// Lấy chi tiết 1 Template theo ID
    pub fn get_seo_template_by_id(&self, template_id: i64) -> Result<Option<SeoTemplate>> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, name, article_type, system_prompt, outline_prompt, write_prompt,
                    target_word_count, is_system, created_at, updated_at
             FROM seo_templates WHERE id = ?1;",
            params![template_id],
            map_template,
        )
        .optional()
    }

    /// Tạo hoặc cập nhật Prompt Template
    pub fn save_seo_template(&self, input: SaveSeoTemplateInput) -> Result<SeoTemplate> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let target_id = if let Some(id) = input.id {
            conn.execute(
                "UPDATE seo_templates
                 SET name = ?1, article_type = ?2, system_prompt = ?3, outline_prompt = ?4,
                     write_prompt = ?5, target_word_count = ?6, updated_at = ?7
                 WHERE id = ?8;",
                params![
                    input.name.trim(),
                    input.article_type,
                    input.system_prompt,
                    input.outline_prompt,
                    input.write_prompt,
                    input.target_word_count,
                    now,
                    id
                ],
            )?;
            id
        } else {
            conn.execute(
                "INSERT INTO seo_templates (
                    name, article_type, system_prompt, outline_prompt, write_prompt,
                    target_word_count, is_system, created_at, updated_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7, ?8);",
                params![
                    input.name.trim(),
                    input.article_type,
                    input.system_prompt,
                    input.outline_prompt,
                    input.write_prompt,
                    input.target_word_count,
                    now,
                    now
                ],
            )?;
            conn.last_insert_rowid()
        };

        drop(conn);
        self.get_seo_template_by_id(target_id)
            .map(|opt| opt.expect("Vừa lưu Template nhưng không tìm thấy bản ghi"))
    }

    /// Xóa Template tùy chỉnh (không xóa mẫu hệ thống)
    pub fn delete_seo_template(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM seo_templates WHERE id = ?1 AND is_system = 0;",
            params![id],
        )?;
        Ok(())
    }
}
