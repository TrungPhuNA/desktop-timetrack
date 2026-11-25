/**
 * Types & Interfaces cho phân hệ SEO Content Studio (Claude + Gemini)
 * Đồng bộ 1:1 với các structs trong src-tauri/src/seo/models.rs
 */

export type AiProvider = "claude" | "gemini";
export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";
export type SeoArticleStatus = "draft" | "outlined" | "writing" | "review" | "published";
export type WriteMode = "full" | "section_by_section";

export interface ModelOption {
    value: string;
    label: string;
    note: string;
}

/** Danh sách Model gợi ý cho Claude & Gemini (có thể chọn hoặc nhập ID tùy chỉnh) */
export const CLAUDE_MODELS: ModelOption[] = [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4 (Khuyên dùng viết bài)", note: "Tự nhiên, sâu sắc" },
    { value: "claude-3-7-sonnet-latest", label: "Claude 3.7 Sonnet", note: "Cân bằng tốc độ & chất lượng" },
    { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku", note: "Siêu nhanh, tiết kiệm" },
    { value: "claude-opus-4-20250514", label: "Claude Opus 4", note: "Chất lượng cao nhất" },
];

export const GEMINI_MODELS: ModelOption[] = [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Khuyên dùng dàn ý)", note: "Context dài, phân tích sâu" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", note: "Nhanh, chi phí cực rẻ" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", note: "Ổn định, hỗ trợ Search" },
];

export const ARTICLE_STATUS_META: Record<
    SeoArticleStatus,
    { label: string; bgClass: string; textClass: string }
> = {
    draft: { label: "Bản nháp", bgClass: "bg-slate-100", textClass: "text-slate-700" },
    outlined: { label: "Đã có Outline", bgClass: "bg-amber-100", textClass: "text-amber-800" },
    writing: { label: "Đang viết", bgClass: "bg-indigo-100", textClass: "text-indigo-800" },
    review: { label: "Đang duyệt", bgClass: "bg-sky-100", textClass: "text-sky-800" },
    published: { label: "Hoàn tất", bgClass: "bg-emerald-100", textClass: "text-emerald-800" },
};

export interface SeoAiConfig {
    id: number;
    provider: AiProvider;
    label: string;
    api_key: string;
    base_url: string;
    default_model: string;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface SaveSeoAiConfigInput {
    id?: number;
    provider: AiProvider;
    label: string;
    api_key: string;
    base_url?: string;
    default_model: string;
    is_active: boolean;
    is_default: boolean;
}

export interface TestAiConnectionInput {
    provider: AiProvider;
    api_key: string;
    base_url?: string;
    model: string;
}

export interface TestAiConnectionResult {
    success: boolean;
    message: string;
    latency_ms: number;
    model: string;
}

export interface SeoSite {
    id: number;
    name: string;
    domain: string;
    niche: string;
    brand_voice: string;
    target_audience: string;
    cta_template: string;
    sitemap_url: string;
    wp_api_url: string;
    wp_username: string;
    wp_app_password: string;
    color: string;
    internal_link_count: number;
    created_at: string;
    updated_at: string;
}

export interface SaveSeoSiteInput {
    id?: number;
    name: string;
    domain: string;
    niche: string;
    brand_voice: string;
    target_audience: string;
    cta_template: string;
    sitemap_url: string;
    wp_api_url?: string;
    wp_username?: string;
    wp_app_password?: string;
    color?: string;
}

export interface SeoInternalLink {
    id: number;
    site_id: number;
    url: string;
    title: string;
    keywords: string;
    synced_at: string;
}

export interface SeoTemplate {
    id: number;
    name: string;
    article_type: string;
    system_prompt: string;
    outline_prompt: string;
    write_prompt: string;
    target_word_count: number;
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

export interface SaveSeoTemplateInput {
    id?: number;
    name: string;
    article_type: string;
    system_prompt: string;
    outline_prompt: string;
    write_prompt: string;
    target_word_count: number;
}

export interface CompetitorHeading {
    level: string;
    text: string;
}

export interface CompetitorAnalysis {
    url: string;
    title: string;
    word_count: number;
    headings: CompetitorHeading[];
    error: string | null;
}

export interface OutlineNode {
    id: string;
    level: "h2" | "h3" | "faq";
    title: string;
    notes: string;
    target_words: number;
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface ImagePromptItem {
    section: string;
    prompt: string;
    alt_text: string;
    caption: string;
}

export interface SeoArticle {
    id: number;
    site_id: number | null;
    site_name: string;
    site_color: string;
    template_id: number | null;
    primary_keyword: string;
    secondary_keywords: string; // JSON string[]
    search_intent: SearchIntent;
    competitor_urls: string;    // JSON CompetitorAnalysis[]
    outline_json: string;       // JSON OutlineNode[]
    title: string;
    slug: string;
    meta_title: string;
    meta_description: string;
    content_markdown: string;
    faq_json: string;           // JSON FaqItem[]
    image_prompts_json: string; // JSON ImagePromptItem[]
    word_count: number;
    seo_score: number;
    status: SeoArticleStatus;
    outline_provider: AiProvider;
    outline_model: string;
    write_provider: AiProvider;
    write_model: string;
    wp_post_id: number | null;
    wp_post_url: string;
    created_at: string;
    updated_at: string;
}

export interface CreateSeoArticleInput {
    site_id?: number | null;
    template_id?: number | null;
    primary_keyword: string;
    secondary_keywords?: string;
    search_intent?: SearchIntent;
}

export interface UpdateSeoArticleInput {
    id: number;
    site_id: number | null;
    template_id: number | null;
    primary_keyword: string;
    secondary_keywords: string;
    search_intent: string;
    competitor_urls: string;
    outline_json: string;
    title: string;
    slug: string;
    meta_title: string;
    meta_description: string;
    content_markdown: string;
    faq_json: string;
    image_prompts_json: string;
    word_count: number;
    seo_score: number;
    status: string;
    outline_provider: string;
    outline_model: string;
    write_provider: string;
    write_model: string;
}

export interface SeoUsageSummary {
    month: string;
    total_requests: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost_usd: number;
    claude_cost_usd: number;
    gemini_cost_usd: number;
}

export interface SeoStreamChunkEvent {
    stream_id: string;
    action: "outline" | "article" | "rewrite" | "meta";
    chunk: string;
    section_label: string | null;
    done: boolean;
    error: string | null;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
}

export interface MetaFaqResponse {
    meta_title: string;
    meta_description: string;
    slug: string;
    faqs: FaqItem[];
    image_prompts: ImagePromptItem[];
}
