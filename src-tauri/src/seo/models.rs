use serde::{Deserialize, Serialize};

/// Cấu hình API Key và Model mặc định cho nhà cung cấp AI (Claude / Gemini)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeoAiConfig {
    pub id: i64,
    pub provider: String, // "claude" | "gemini"
    pub label: String,
    pub api_key: String,
    pub base_url: String,
    pub default_model: String,
    pub is_active: bool,
    pub is_default: bool,
    pub created_at: String,
    pub updated_at: String,
}

/// DTO Input khi tạo mới hoặc cập nhật cấu hình API Key AI
#[derive(Debug, Deserialize)]
pub struct SaveSeoAiConfigInput {
    pub id: Option<i64>,
    pub provider: String,
    pub label: String,
    pub api_key: String,
    pub base_url: Option<String>,
    pub default_model: String,
    pub is_active: bool,
    pub is_default: bool,
}

/// DTO Input khi kiểm tra kết nối thử tới API Claude hoặc Gemini
#[derive(Debug, Deserialize)]
pub struct TestAiConnectionInput {
    pub provider: String,
    pub api_key: String,
    pub base_url: Option<String>,
    pub model: String,
}

/// Kết quả kiểm tra kết nối API kèm độ trễ đo được
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestAiConnectionResult {
    pub success: bool,
    pub message: String,
    pub latency_ms: u64,
    pub model: String,
}

/// Hồ sơ Website / Thương hiệu (Brand Voice & Sitemap) phục vụ viết bài chuẩn riêng từng site
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeoSite {
    pub id: i64,
    pub name: String,
    pub domain: String,
    pub niche: String,
    pub brand_voice: String,
    pub target_audience: String,
    pub cta_template: String,
    pub sitemap_url: String,
    pub wp_api_url: String,
    pub wp_username: String,
    pub wp_app_password: String,
    pub color: String,
    pub internal_link_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

/// DTO Input lưu thông tin Website Profile
#[derive(Debug, Deserialize)]
pub struct SaveSeoSiteInput {
    pub id: Option<i64>,
    pub name: String,
    pub domain: String,
    pub niche: String,
    pub brand_voice: String,
    pub target_audience: String,
    pub cta_template: String,
    pub sitemap_url: String,
    pub wp_api_url: Option<String>,
    pub wp_username: Option<String>,
    pub wp_app_password: Option<String>,
    pub color: Option<String>,
}

/// Bản ghi Internal Link đồng bộ từ Sitemap.xml của Website
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeoInternalLink {
    pub id: i64,
    pub site_id: i64,
    pub url: String,
    pub title: String,
    pub keywords: String,
    pub synced_at: String,
}

/// Mẫu Prompt chuẩn SEO theo từng thể loại bài viết
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeoTemplate {
    pub id: i64,
    pub name: String,
    pub article_type: String,
    pub system_prompt: String,
    pub outline_prompt: String,
    pub write_prompt: String,
    pub target_word_count: i64,
    pub is_system: bool,
    pub created_at: String,
    pub updated_at: String,
}

/// DTO Input tạo hoặc cập nhật mẫu Prompt Template
#[derive(Debug, Deserialize)]
pub struct SaveSeoTemplateInput {
    pub id: Option<i64>,
    pub name: String,
    pub article_type: String,
    pub system_prompt: String,
    pub outline_prompt: String,
    pub write_prompt: String,
    pub target_word_count: i64,
}

/// Thẻ Heading bóc tách được từ bài viết đối thủ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompetitorHeading {
    pub level: String, // "h1" | "h2" | "h3"
    pub text: String,
}

/// Kết quả phân tích cấu trúc 1 URL đối thủ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompetitorAnalysis {
    pub url: String,
    pub title: String,
    pub word_count: usize,
    pub headings: Vec<CompetitorHeading>,
    pub error: Option<String>,
}

/// Một mục trong cây Dàn ý (Outline) để người dùng thêm/sửa/xóa trước khi viết
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutlineNode {
    pub id: String,
    pub level: String, // "h2" | "h3" | "faq"
    pub title: String,
    pub notes: String,
    pub target_words: i64,
}

/// Câu hỏi thường gặp (FAQ Schema)
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaqItem {
    pub question: String,
    pub answer: String,
}

/// Gợi ý ảnh minh họa & Alt Text chuẩn SEO theo từng mục H2
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImagePromptItem {
    pub section: String,
    pub prompt: String,
    pub alt_text: String,
    pub caption: String,
}

/// Bài viết SEO hoàn chỉnh lưu trong SQLite
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeoArticle {
    pub id: i64,
    pub site_id: Option<i64>,
    pub site_name: String,
    pub site_color: String,
    pub template_id: Option<i64>,
    pub primary_keyword: String,
    pub secondary_keywords: String, // JSON array string
    pub search_intent: String,
    pub competitor_urls: String, // JSON array CompetitorAnalysis
    pub outline_json: String,    // JSON array OutlineNode
    pub title: String,
    pub slug: String,
    pub meta_title: String,
    pub meta_description: String,
    pub content_markdown: String,
    pub faq_json: String,           // JSON array FaqItem
    pub image_prompts_json: String, // JSON array ImagePromptItem
    pub word_count: i64,
    pub seo_score: i64,
    pub status: String, // "draft" | "outlined" | "writing" | "review" | "published"
    pub outline_provider: String,
    pub outline_model: String,
    pub write_provider: String,
    pub write_model: String,
    pub wp_post_id: Option<i64>,
    pub wp_post_url: String,
    pub created_at: String,
    pub updated_at: String,
}

/// DTO Input tạo mới bài viết SEO từ từ khóa chính
#[derive(Debug, Deserialize)]
pub struct CreateSeoArticleInput {
    pub site_id: Option<i64>,
    pub template_id: Option<i64>,
    pub primary_keyword: String,
    pub secondary_keywords: Option<String>,
    pub search_intent: Option<String>,
}

/// DTO Input cập nhật toàn bộ dữ liệu bài viết SEO
#[derive(Debug, Deserialize)]
pub struct UpdateSeoArticleInput {
    pub id: i64,
    pub site_id: Option<i64>,
    pub template_id: Option<i64>,
    pub primary_keyword: String,
    pub secondary_keywords: String,
    pub search_intent: String,
    pub competitor_urls: String,
    pub outline_json: String,
    pub title: String,
    pub slug: String,
    pub meta_title: String,
    pub meta_description: String,
    pub content_markdown: String,
    pub faq_json: String,
    pub image_prompts_json: String,
    pub word_count: i64,
    pub seo_score: i64,
    pub status: String,
    pub outline_provider: String,
    pub outline_model: String,
    pub write_provider: String,
    pub write_model: String,
}

/// Bản ghi nhật ký tiêu thụ Token và chi phí
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeoUsageLog {
    pub id: i64,
    pub article_id: Option<i64>,
    pub provider: String,
    pub model: String,
    pub action_type: String,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub estimated_cost_usd: f64,
    pub duration_ms: i64,
    pub created_at: String,
}

/// Tổng hợp chi phí Token AI theo tháng
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeoUsageSummary {
    pub month: String,
    pub total_requests: i64,
    pub total_input_tokens: i64,
    pub total_output_tokens: i64,
    pub total_cost_usd: f64,
    pub claude_cost_usd: f64,
    pub gemini_cost_usd: f64,
}

/// Input yêu cầu AI tạo Dàn ý (Outline)
#[derive(Debug, Deserialize)]
pub struct GenerateOutlineInput {
    pub article_id: i64,
    pub provider: String,
    pub model: String,
    pub use_search_grounding: bool,
}

/// Input yêu cầu AI viết bài (Toàn bài hoặc cuốn chiếu từng H2)
#[derive(Debug, Deserialize)]
pub struct GenerateArticleInput {
    pub article_id: i64,
    pub provider: String,
    pub model: String,
    pub mode: String, // "full" | "section_by_section"
}

/// Input yêu cầu AI viết lại đoạn văn bản bôi đen
#[derive(Debug, Deserialize)]
pub struct RewriteSelectionInput {
    pub article_id: Option<i64>,
    pub provider: String,
    pub model: String,
    pub selected_text: String,
    pub instruction: String,
    pub context_keyword: String,
}

/// Input yêu cầu AI sinh Meta Title, Description, Slug, FAQ và Alt ảnh
#[derive(Debug, Deserialize)]
pub struct GenerateMetaFaqInput {
    pub article_id: i64,
    pub provider: String,
    pub model: String,
}

/// Payload sự kiện phát realtime qua Tauri Event khi AI stream chunk chữ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SeoStreamChunkEvent {
    pub stream_id: String,
    pub action: String, // "outline" | "article" | "rewrite"
    pub chunk: String,
    pub section_label: Option<String>,
    pub done: bool,
    pub error: Option<String>,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cost_usd: f64,
}
