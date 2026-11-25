use chrono::Local;
use rusqlite::{params, Connection, Result};

/// Khởi tạo 6 bảng và Indexes cho phân hệ SEO Content Studio trong timetrack.db
/// Mục đích: Tách riêng schema SEO để đảm bảo an toàn 100% với dữ liệu Chấm công & Task hiện tại
pub fn init_seo_tables(conn: &Connection) -> Result<()> {
    // 1. Cấu hình API Key & Model (Claude / Gemini)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS seo_ai_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider TEXT NOT NULL CHECK (provider IN ('claude', 'gemini')),
            label TEXT NOT NULL DEFAULT '',
            api_key TEXT NOT NULL,
            base_url TEXT NOT NULL DEFAULT '',
            default_model TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );",
        [],
    )?;

    // 2. Hồ sơ từng Website / Brand Voice (Multi-site SEO)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS seo_sites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            domain TEXT NOT NULL DEFAULT '',
            niche TEXT NOT NULL DEFAULT '',
            brand_voice TEXT NOT NULL DEFAULT '',
            target_audience TEXT NOT NULL DEFAULT '',
            cta_template TEXT NOT NULL DEFAULT '',
            sitemap_url TEXT NOT NULL DEFAULT '',
            wp_api_url TEXT NOT NULL DEFAULT '',
            wp_username TEXT NOT NULL DEFAULT '',
            wp_app_password TEXT NOT NULL DEFAULT '',
            color TEXT NOT NULL DEFAULT '#4f46e5',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );",
        [],
    )?;

    // 3. Kho Internal Link đồng bộ từ Sitemap.xml của từng Site
    conn.execute(
        "CREATE TABLE IF NOT EXISTS seo_internal_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site_id INTEGER NOT NULL,
            url TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT '',
            keywords TEXT NOT NULL DEFAULT '',
            synced_at TEXT NOT NULL,
            UNIQUE(site_id, url),
            FOREIGN KEY (site_id) REFERENCES seo_sites(id) ON DELETE CASCADE
        );",
        [],
    )?;

    // 4. Bộ Prompt Template theo loại bài SEO
    conn.execute(
        "CREATE TABLE IF NOT EXISTS seo_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            article_type TEXT NOT NULL DEFAULT 'informational',
            system_prompt TEXT NOT NULL,
            outline_prompt TEXT NOT NULL,
            write_prompt TEXT NOT NULL,
            target_word_count INTEGER NOT NULL DEFAULT 1800,
            is_system INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );",
        [],
    )?;

    // 5. Bài viết SEO (Brief -> Outline -> Content -> Audit)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS seo_articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site_id INTEGER,
            template_id INTEGER,
            primary_keyword TEXT NOT NULL,
            secondary_keywords TEXT NOT NULL DEFAULT '[]',
            search_intent TEXT NOT NULL DEFAULT 'informational',
            competitor_urls TEXT NOT NULL DEFAULT '[]',
            outline_json TEXT NOT NULL DEFAULT '[]',
            title TEXT NOT NULL DEFAULT '',
            slug TEXT NOT NULL DEFAULT '',
            meta_title TEXT NOT NULL DEFAULT '',
            meta_description TEXT NOT NULL DEFAULT '',
            content_markdown TEXT NOT NULL DEFAULT '',
            faq_json TEXT NOT NULL DEFAULT '[]',
            image_prompts_json TEXT NOT NULL DEFAULT '[]',
            word_count INTEGER NOT NULL DEFAULT 0,
            seo_score INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'draft',
            outline_provider TEXT NOT NULL DEFAULT 'gemini',
            outline_model TEXT NOT NULL DEFAULT '',
            write_provider TEXT NOT NULL DEFAULT 'claude',
            write_model TEXT NOT NULL DEFAULT '',
            wp_post_id INTEGER,
            wp_post_url TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (site_id) REFERENCES seo_sites(id) ON DELETE SET NULL,
            FOREIGN KEY (template_id) REFERENCES seo_templates(id) ON DELETE SET NULL
        );",
        [],
    )?;

    // 6. Nhật ký tiêu thụ Token & Chi phí AI
    conn.execute(
        "CREATE TABLE IF NOT EXISTS seo_ai_usage_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
            action_type TEXT NOT NULL,
            input_tokens INTEGER NOT NULL DEFAULT 0,
            output_tokens INTEGER NOT NULL DEFAULT 0,
            estimated_cost_usd REAL NOT NULL DEFAULT 0.0,
            duration_ms INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (article_id) REFERENCES seo_articles(id) ON DELETE SET NULL
        );",
        [],
    )?;

    // Indexes tối ưu tốc độ lọc và thống kê
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_seo_articles_site_status ON seo_articles(site_id, status);",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_seo_articles_updated ON seo_articles(updated_at DESC);",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_seo_internal_links_site ON seo_internal_links(site_id);",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_seo_usage_created ON seo_ai_usage_logs(created_at DESC);",
        [],
    )?;

    Ok(())
}

/// Khởi tạo 5 Prompt Template chuẩn SEO tiếng Việt khi bảng seo_templates còn trống
pub fn seed_seo_defaults(conn: &Connection) -> Result<()> {
    let tpl_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM seo_templates", [], |row| row.get(0))?;
    if tpl_count > 0 {
        return Ok(());
    }

    let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let base_system = "Bạn là chuyên gia SEO & Content Strategist 10 năm kinh nghiệm tại Việt Nam. Viết tiếng Việt tự nhiên, sắc bén, giàu trải nghiệm thực tế chuẩn Google E-E-A-T. Tuyệt đối tránh văn mẫu AI sáo rỗng ('Trong thời đại 4.0', 'Không thể phủ nhận', 'Tóm lại một lần nữa').";

    let templates = vec![
        (
            "Bài Kiến Thức Chuyên Sâu (Informational)",
            "informational",
            base_system,
            "Xây dựng dàn ý H1/H2/H3 bao phủ trọn vẹn Search Intent thông tin, giải thích bản chất, cơ chế, sai lầm thường gặp và 3-4 câu FAQ thực tế.",
            "Viết sâu sắc, có dẫn chứng/con số cụ thể, dùng bảng biểu khi so sánh khái niệm, chia đoạn ngắn 3-4 dòng dễ đọc trên mobile.",
            2000_i64,
        ),
        (
            "Review & So Sánh Top Sản Phẩm",
            "review",
            base_system,
            "Thiết kế dàn ý gồm tiêu chí đánh giá, bảng so sánh nhanh Top lựa chọn, phân tích chi tiết ưu/nhược điểm từng phương án và lời khuyên chọn mua theo ngân sách.",
            "Đánh giá khách quan, nêu rõ ai nên mua và ai không nên mua, bắt buộc có bảng Markdown so sánh trực quan.",
            2200_i64,
        ),
        (
            "Hướng Dẫn Thực Hành Chi Tiết (How-to)",
            "howto",
            base_system,
            "Lập dàn ý theo trình tự bước 1 -> bước N, kèm phần chuẩn bị trước khi làm, lưu ý lỗi hay gặp và cách xử lý.",
            "Trình bày từng bước rõ ràng, mệnh lệnh thức dễ hiểu, kèm mẹo thực chiến và cảnh báo rủi ro.",
            1800_i64,
        ),
        (
            "Bài Bán Hàng / Dịch Vụ (Commercial)",
            "commercial",
            base_system,
            "Cấu trúc bài theo phễu AIDA/PAS: chạm đúng nỗi đau khách hàng, giải pháp chuyên môn, bảng giá minh bạch, quy trình làm việc, cam kết và CTA chuyển đổi.",
            "Thuyết phục tự nhiên dựa trên năng lực và lợi ích khách hàng nhận được, tránh giật tít phản cảm.",
            1600_i64,
        ),
        (
            "Tin Tức & Phân Tích Xu Hướng",
            "news",
            base_system,
            "Cấu trúc kim tự tháp ngược: tóm tắt sự kiện trọng tâm ngay đầu bài, bối cảnh, tác động thực tế đến người dùng Việt Nam và dự báo ngắn hạn.",
            "Văn phong báo chí súc tích, khách quan, cập nhật số liệu mới nhất.",
            1200_i64,
        ),
    ];

    for (name, art_type, sys_p, out_p, write_p, words) in templates {
        conn.execute(
            "INSERT INTO seo_templates (
                name, article_type, system_prompt, outline_prompt, write_prompt,
                target_word_count, is_system, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8);",
            params![name, art_type, sys_p, out_p, write_p, words, now, now],
        )?;
    }

    Ok(())
}
