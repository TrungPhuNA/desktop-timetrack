import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import {
    AiProvider,
    CompetitorAnalysis,
    CreateSeoArticleInput,
    MetaFaqResponse,
    SaveSeoAiConfigInput,
    SaveSeoSiteInput,
    SaveSeoTemplateInput,
    SeoAiConfig,
    SeoArticle,
    SeoInternalLink,
    SeoSite,
    SeoStreamChunkEvent,
    SeoTemplate,
    SeoUsageSummary,
    TestAiConnectionInput,
    TestAiConnectionResult,
    UpdateSeoArticleInput,
    WriteMode,
} from "../types/seo";

/**
 * Service API giao tiếp với Rust Backend cho phân hệ SEO Content Studio
 */
export const seoApi = {
    // 1. Cấu hình API Key Claude & Gemini
    getAiConfigs: (): Promise<SeoAiConfig[]> =>
        invoke<SeoAiConfig[]>("cmd_seo_get_ai_configs"),

    saveAiConfig: (input: SaveSeoAiConfigInput): Promise<SeoAiConfig> =>
        invoke<SeoAiConfig>("cmd_seo_save_ai_config", { input }),

    deleteAiConfig: (id: number): Promise<void> =>
        invoke<void>("cmd_seo_delete_ai_config", { id }),

    testAiConnection: (input: TestAiConnectionInput): Promise<TestAiConnectionResult> =>
        invoke<TestAiConnectionResult>("cmd_seo_test_ai_connection", { input }),

    // 2. Quản lý Website & Sitemap Internal Links
    getSites: (): Promise<SeoSite[]> =>
        invoke<SeoSite[]>("cmd_seo_get_sites"),

    saveSite: (input: SaveSeoSiteInput): Promise<SeoSite> =>
        invoke<SeoSite>("cmd_seo_save_site", { input }),

    deleteSite: (id: number): Promise<void> =>
        invoke<void>("cmd_seo_delete_site", { id }),

    getInternalLinks: (siteId: number): Promise<SeoInternalLink[]> =>
        invoke<SeoInternalLink[]>("cmd_seo_get_internal_links", { siteId }),

    syncSitemap: (siteId: number, sitemapUrl: string): Promise<number> =>
        invoke<number>("cmd_seo_sync_sitemap", { siteId, sitemapUrl }),

    // 3. Quản lý Prompt Templates
    getTemplates: (): Promise<SeoTemplate[]> =>
        invoke<SeoTemplate[]>("cmd_seo_get_templates"),

    saveTemplate: (input: SaveSeoTemplateInput): Promise<SeoTemplate> =>
        invoke<SeoTemplate>("cmd_seo_save_template", { input }),

    deleteTemplate: (id: number): Promise<void> =>
        invoke<void>("cmd_seo_delete_template", { id }),

    // 4. Quản lý Bài viết SEO
    getArticles: (siteId?: number | null, status?: string | null, search?: string | null): Promise<SeoArticle[]> =>
        invoke<SeoArticle[]>("cmd_seo_get_articles", {
            siteId: siteId ?? null,
            status: status || null,
            search: search || null,
        }),

    getArticleDetail: (id: number): Promise<SeoArticle | null> =>
        invoke<SeoArticle | null>("cmd_seo_get_article_detail", { id }),

    createArticle: (input: CreateSeoArticleInput): Promise<SeoArticle> =>
        invoke<SeoArticle>("cmd_seo_create_article", { input }),

    updateArticle: (input: UpdateSeoArticleInput): Promise<void> =>
        invoke<void>("cmd_seo_update_article", { input }),

    deleteArticle: (id: number): Promise<void> =>
        invoke<void>("cmd_seo_delete_article", { id }),

    // 5. Cào đối thủ & AI Streaming Pipeline
    crawlCompetitors: (urls: string[]): Promise<CompetitorAnalysis[]> =>
        invoke<CompetitorAnalysis[]>("cmd_seo_crawl_competitors", { urls }),

    stopGeneration: (): Promise<boolean> =>
        invoke<boolean>("cmd_seo_stop_generation"),

    generateOutline: (
        articleId: number,
        provider: AiProvider,
        model: string,
        useSearchGrounding: boolean
    ): Promise<string> =>
        invoke<string>("cmd_seo_generate_outline", {
            input: {
                article_id: articleId,
                provider,
                model,
                use_search_grounding: useSearchGrounding,
            },
        }),

    generateArticle: (
        articleId: number,
        provider: AiProvider,
        model: string,
        mode: WriteMode
    ): Promise<string> =>
        invoke<string>("cmd_seo_generate_article", {
            input: {
                article_id: articleId,
                provider,
                model,
                mode,
            },
        }),

    rewriteSelection: (
        articleId: number | null,
        provider: AiProvider,
        model: string,
        selectedText: string,
        instruction: string,
        contextKeyword: string
    ): Promise<string> =>
        invoke<string>("cmd_seo_rewrite_selection", {
            input: {
                article_id: articleId,
                provider,
                model,
                selected_text: selectedText,
                instruction,
                context_keyword: contextKeyword,
            },
        }),

    generateMetaFaq: (
        articleId: number,
        provider: AiProvider,
        model: string
    ): Promise<MetaFaqResponse> =>
        invoke<MetaFaqResponse>("cmd_seo_generate_meta_faq", {
            input: {
                article_id: articleId,
                provider,
                model,
            },
        }),

    getUsageSummary: (month: string): Promise<SeoUsageSummary> =>
        invoke<SeoUsageSummary>("cmd_seo_get_usage_summary", { month }),

    /** Đăng ký lắng nghe sự kiện stream chunk realtime từ Rust backend */
    listenStream: (callback: (event: SeoStreamChunkEvent) => void): Promise<UnlistenFn> =>
        listen<SeoStreamChunkEvent>("seo-ai-stream-chunk", (evt) => callback(evt.payload)),
};
