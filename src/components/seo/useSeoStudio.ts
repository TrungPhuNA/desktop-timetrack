import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { seoApi } from "../../services/seoApi";
import { analyzeSeoOnPage, toSeoSlug } from "../../services/seoAudit";
import {
    AiProvider,
    CLAUDE_MODELS,
    CompetitorAnalysis,
    FaqItem,
    GEMINI_MODELS,
    ImagePromptItem,
    OutlineNode,
    SearchIntent,
    SeoAiConfig,
    SeoArticle,
    SeoArticleStatus,
    SeoSite,
    SeoTemplate,
    SeoUsageSummary,
    WriteMode,
} from "../../types/seo";

export type StudioStep = 1 | 2 | 3;

const safeParseJson = <T,>(raw: string, fallback: T): T => {
    try {
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
};

/**
 * Custom Hook quản lý toàn bộ State, CRUD SQLite và AI Streaming cho SEO Content Studio
 */
export function useSeoStudio() {
    const [loading, setLoading] = useState(true);
    const [aiConfigs, setAiConfigs] = useState<SeoAiConfig[]>([]);
    const [sites, setSites] = useState<SeoSite[]>([]);
    const [templates, setTemplates] = useState<SeoTemplate[]>([]);
    const [articles, setArticles] = useState<SeoArticle[]>([]);
    const [usageSummary, setUsageSummary] = useState<SeoUsageSummary | null>(null);

    const [filterSiteId, setFilterSiteId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
    const [activeStep, setActiveStep] = useState<StudioStep>(1);
    const [siteId, setSiteId] = useState<number | null>(null);
    const [templateId, setTemplateId] = useState<number | null>(null);
    const [primaryKeyword, setPrimaryKeyword] = useState("");
    const [secondaryKeywordsText, setSecondaryKeywordsText] = useState("");
    const [searchIntent, setSearchIntent] = useState<SearchIntent>("informational");
    const [competitorUrlsText, setCompetitorUrlsText] = useState("");
    const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
    const [outline, setOutline] = useState<OutlineNode[]>([]);
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [contentMarkdown, setContentMarkdown] = useState("");
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [imagePrompts, setImagePrompts] = useState<ImagePromptItem[]>([]);
    const [status, setStatus] = useState<SeoArticleStatus>("draft");

    const [outlineProvider, setOutlineProvider] = useState<AiProvider>("gemini");
    const [outlineModel, setOutlineModel] = useState(GEMINI_MODELS[0].value);
    const [useSearchGrounding, setUseSearchGrounding] = useState(true);
    const [writeProvider, setWriteProvider] = useState<AiProvider>("claude");
    const [writeModel, setWriteModel] = useState(CLAUDE_MODELS[0].value);
    const [writeMode, setWriteMode] = useState<WriteMode>("section_by_section");

    const [isCrawling, setIsCrawling] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [streamPreview, setStreamPreview] = useState("");
    const [streamStatusLabel, setStreamStatusLabel] = useState("");
    const [lastTokenCostText, setLastTokenCostText] = useState("");
    const [bannerError, setBannerError] = useState<string | null>(null);
    const [bannerOk, setBannerOk] = useState<string | null>(null);

    const streamActionRef = useRef<"outline" | "article" | "rewrite" | null>(null);
    const currentMonth = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }, []);

    const hydrateArticle = useCallback((art: SeoArticle) => {
        setActiveArticleId(art.id);
        setSiteId(art.site_id);
        setTemplateId(art.template_id);
        setPrimaryKeyword(art.primary_keyword);
        setSecondaryKeywordsText(safeParseJson<string[]>(art.secondary_keywords, []).join(", "));
        setSearchIntent((art.search_intent as SearchIntent) || "informational");
        const compArr = safeParseJson<CompetitorAnalysis[]>(art.competitor_urls, []);
        setCompetitors(compArr);
        setCompetitorUrlsText(compArr.map((c) => c.url).filter(Boolean).join("\n"));
        const outArr = safeParseJson<OutlineNode[]>(art.outline_json, []);
        setOutline(outArr);
        setTitle(art.title);
        setSlug(art.slug);
        setMetaTitle(art.meta_title);
        setMetaDescription(art.meta_description);
        setContentMarkdown(art.content_markdown);
        setFaqs(safeParseJson<FaqItem[]>(art.faq_json, []));
        setImagePrompts(safeParseJson<ImagePromptItem[]>(art.image_prompts_json, []));
        setStatus(art.status || "draft");
        setOutlineProvider(art.outline_provider || "gemini");
        if (art.outline_model) setOutlineModel(art.outline_model);
        setWriteProvider(art.write_provider || "claude");
        if (art.write_model) setWriteModel(art.write_model);
        setActiveStep(art.content_markdown.trim() ? 3 : outArr.length > 0 ? 2 : 1);
    }, []);

    const resetNewArticleForm = useCallback((defaultTplId?: number | null) => {
        setActiveArticleId(null);
        setActiveStep(1);
        setTemplateId(defaultTplId ?? templates[0]?.id ?? null);
        setPrimaryKeyword("");
        setSecondaryKeywordsText("");
        setSearchIntent("informational");
        setCompetitorUrlsText("");
        setCompetitors([]);
        setOutline([]);
        setTitle("");
        setSlug("");
        setMetaTitle("");
        setMetaDescription("");
        setContentMarkdown("");
        setFaqs([]);
        setImagePrompts([]);
        setStatus("draft");
        setBannerError(null);
    }, [templates]);

    const loadAllMetadata = useCallback(async () => {
        const [cfgs, siteList, tplList, usage] = await Promise.all([
            seoApi.getAiConfigs(),
            seoApi.getSites(),
            seoApi.getTemplates(),
            seoApi.getUsageSummary(currentMonth),
        ]);
        setAiConfigs(cfgs);
        setSites(siteList);
        setTemplates(tplList);
        setUsageSummary(usage);

        const gDef = cfgs.find((c) => c.provider === "gemini" && c.is_active);
        const cDef = cfgs.find((c) => c.provider === "claude" && c.is_active);
        if (gDef) setOutlineModel(gDef.default_model);
        if (cDef) setWriteModel(cDef.default_model);
        return { tplList };
    }, [currentMonth]);

    const loadArticles = useCallback(async () => {
        const list = await seoApi.getArticles(filterSiteId, filterStatus, searchQuery);
        setArticles(list);
        return list;
    }, [filterSiteId, filterStatus, searchQuery]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const [{ tplList }, artList] = await Promise.all([loadAllMetadata(), loadArticles()]);
                if (!mounted) return;
                if (artList.length > 0) hydrateArticle(artList[0]);
                else setTemplateId(tplList[0]?.id ?? null);
            } catch (err) {
                if (mounted) setBannerError(String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!loading) loadArticles().catch((err) => setBannerError(String(err)));
    }, [filterSiteId, filterStatus, searchQuery]);

    useEffect(() => {
        let unlisten: (() => void) | undefined;
        seoApi.listenStream((evt) => {
            if (evt.section_label) setStreamStatusLabel(evt.section_label);
            if (evt.action === "outline" && !evt.done) setStreamPreview((p) => p + evt.chunk);
            if (evt.action === "article" && !evt.done && streamActionRef.current === "article") {
                setContentMarkdown((p) => p + evt.chunk);
            }
            if (evt.done) {
                if (evt.cost_usd > 0 || evt.output_tokens > 0) {
                    setLastTokenCostText(
                        `Lượt vừa rồi: ${evt.input_tokens.toLocaleString("vi-VN")} in / ${evt.output_tokens.toLocaleString("vi-VN")} out (~$${evt.cost_usd.toFixed(4)})`
                    );
                }
                if (evt.error) setBannerError(evt.error);
            }
        }).then((fn) => { unlisten = fn; });
        return () => { if (unlisten) unlisten(); };
    }, []);

    const activeTemplate = templates.find((t) => t.id === templateId);
    const activeSite = sites.find((s) => s.id === siteId);

    const auditResult = useMemo(
        () =>
            analyzeSeoOnPage({
                primaryKeyword,
                title,
                slug,
                metaTitle,
                metaDescription,
                contentMarkdown,
                targetWordCount: activeTemplate?.target_word_count || 1800,
            }),
        [primaryKeyword, title, slug, metaTitle, metaDescription, contentMarkdown, activeTemplate]
    );

    const ensureArticlePersisted = async (override?: Partial<{
        outlineJson: string;
        titleVal: string;
        slugVal: string;
        metaTitleVal: string;
        metaDescVal: string;
        faqJson: string;
        imgJson: string;
        secondaryList: string[];
        compList: CompetitorAnalysis[];
        contentVal: string;
        nextStatus: SeoArticleStatus;
    }>): Promise<number> => {
        const kw = primaryKeyword.trim();
        if (!kw) throw new Error("Vui lòng nhập Từ khóa chính trước.");

        const secondaryArr =
            override?.secondaryList ??
            secondaryKeywordsText.split(",").map((s) => s.trim()).filter(Boolean);

        let targetId = activeArticleId;
        if (!targetId) {
            const created = await seoApi.createArticle({
                site_id: siteId,
                template_id: templateId,
                primary_keyword: kw,
                secondary_keywords: JSON.stringify(secondaryArr),
                search_intent: searchIntent,
            });
            targetId = created.id;
            setActiveArticleId(created.id);
        }

        const nextTitle = override?.titleVal ?? title;
        const nextSlug = override?.slugVal ?? (slug || toSeoSlug(nextTitle || kw));

        await seoApi.updateArticle({
            id: targetId,
            site_id: siteId,
            template_id: templateId,
            primary_keyword: kw,
            secondary_keywords: JSON.stringify(secondaryArr),
            search_intent: searchIntent,
            competitor_urls: JSON.stringify(override?.compList ?? competitors),
            outline_json: override?.outlineJson ?? JSON.stringify(outline),
            title: nextTitle,
            slug: nextSlug,
            meta_title: override?.metaTitleVal ?? metaTitle,
            meta_description: override?.metaDescVal ?? metaDescription,
            content_markdown: override?.contentVal ?? contentMarkdown,
            faq_json: override?.faqJson ?? JSON.stringify(faqs),
            image_prompts_json: override?.imgJson ?? JSON.stringify(imagePrompts),
            word_count: auditResult.wordCount,
            seo_score: auditResult.score,
            status: override?.nextStatus ?? status,
            outline_provider: outlineProvider,
            outline_model: outlineModel,
            write_provider: writeProvider,
            write_model: writeModel,
        });

        await loadArticles();
        return targetId;
    };

    const handleSaveManual = async () => {
        setIsSaving(true);
        setBannerError(null);
        try {
            await ensureArticlePersisted();
            setBannerOk("Đã lưu bài viết vào SQLite.");
            setTimeout(() => setBannerOk(null), 2500);
        } catch (err) {
            setBannerError(String(err));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCrawlCompetitors = async () => {
        const urls = competitorUrlsText.split(/\r?\n/).map((u) => u.trim()).filter(Boolean);
        if (urls.length === 0) return;
        setIsCrawling(true);
        setBannerError(null);
        try {
            const res = await seoApi.crawlCompetitors(urls);
            setCompetitors(res);
            if (primaryKeyword.trim()) await ensureArticlePersisted({ compList: res });
        } catch (err) {
            setBannerError(String(err));
        } finally {
            setIsCrawling(false);
        }
    };

    const handleGenerateOutline = async () => {
        setBannerError(null);
        setStreamPreview("");
        setIsGenerating(true);
        streamActionRef.current = "outline";
        try {
            const id = await ensureArticlePersisted();
            const rawJson = await seoApi.generateOutline(id, outlineProvider, outlineModel, useSearchGrounding);
            const parsed = JSON.parse(rawJson) as { title?: string; secondary_keywords?: string[]; outline?: OutlineNode[] };
            const nextTitle = parsed.title || title || primaryKeyword;
            const nextOutline = Array.isArray(parsed.outline) ? parsed.outline : [];
            const nextSec = Array.isArray(parsed.secondary_keywords)
                ? parsed.secondary_keywords
                : secondaryKeywordsText.split(",").map((s) => s.trim()).filter(Boolean);
            const nextSlug = slug || toSeoSlug(nextTitle);

            setTitle(nextTitle);
            setSlug(nextSlug);
            setOutline(nextOutline);
            setSecondaryKeywordsText(nextSec.join(", "));
            setStatus("outlined");

            await ensureArticlePersisted({
                outlineJson: JSON.stringify(nextOutline),
                titleVal: nextTitle,
                slugVal: nextSlug,
                secondaryList: nextSec,
                nextStatus: "outlined",
            });
            setActiveStep(2);
            setUsageSummary(await seoApi.getUsageSummary(currentMonth));
        } catch (err) {
            setBannerError(`Lỗi tạo dàn ý: ${String(err)}`);
        } finally {
            setIsGenerating(false);
            streamActionRef.current = null;
        }
    };

    const handleGenerateArticle = async () => {
        setBannerError(null);
        setContentMarkdown("");
        setIsGenerating(true);
        streamActionRef.current = "article";
        setActiveStep(3);
        try {
            const id = await ensureArticlePersisted({ nextStatus: "writing" });
            const fullMd = await seoApi.generateArticle(id, writeProvider, writeModel, writeMode);
            setContentMarkdown(fullMd);
            setStatus("review");
            await ensureArticlePersisted({ contentVal: fullMd, nextStatus: "review" });
            setUsageSummary(await seoApi.getUsageSummary(currentMonth));
        } catch (err) {
            setBannerError(`Lỗi viết bài: ${String(err)}`);
        } finally {
            setIsGenerating(false);
            streamActionRef.current = null;
        }
    };

    const handleRewriteSelection = async (selectedText: string, instruction: string, start: number, end: number) => {
        setBannerError(null);
        setIsGenerating(true);
        streamActionRef.current = "rewrite";
        setStreamStatusLabel("Đang viết lại đoạn đã chọn...");
        try {
            const rewritten = await seoApi.rewriteSelection(activeArticleId, writeProvider, writeModel, selectedText, instruction, primaryKeyword);
            const updated = contentMarkdown.slice(0, start) + rewritten.trim() + contentMarkdown.slice(end);
            setContentMarkdown(updated);
            if (activeArticleId) await ensureArticlePersisted({ contentVal: updated });
        } catch (err) {
            setBannerError(`Lỗi biên tập lại: ${String(err)}`);
        } finally {
            setIsGenerating(false);
            streamActionRef.current = null;
        }
    };

    const handleGenerateMetaFaq = async () => {
        if (!contentMarkdown.trim()) return;
        setIsGeneratingMeta(true);
        setBannerError(null);
        try {
            const id = await ensureArticlePersisted();
            const res = await seoApi.generateMetaFaq(id, outlineProvider, outlineModel);
            setMetaTitle(res.meta_title || "");
            setMetaDescription(res.meta_description || "");
            if (res.slug) setSlug(res.slug);
            if (Array.isArray(res.faqs)) setFaqs(res.faqs);
            if (Array.isArray(res.image_prompts)) setImagePrompts(res.image_prompts);
            await ensureArticlePersisted({
                slugVal: res.slug || slug,
                metaTitleVal: res.meta_title || metaTitle,
                metaDescVal: res.meta_description || metaDescription,
                faqJson: JSON.stringify(res.faqs || []),
                imgJson: JSON.stringify(res.image_prompts || []),
            });
            setUsageSummary(await seoApi.getUsageSummary(currentMonth));
        } catch (err) {
            setBannerError(`Lỗi tạo Meta & FAQ: ${String(err)}`);
        } finally {
            setIsGeneratingMeta(false);
        }
    };

    const handleStopGeneration = async () => {
        await seoApi.stopGeneration();
        setIsGenerating(false);
    };

    return {
        loading, aiConfigs, sites, templates, articles, usageSummary, currentMonth,
        filterSiteId, setFilterSiteId, filterStatus, setFilterStatus, searchQuery, setSearchQuery,
        activeArticleId, activeStep, setActiveStep, siteId, setSiteId, templateId, setTemplateId,
        primaryKeyword, setPrimaryKeyword, secondaryKeywordsText, setSecondaryKeywordsText,
        searchIntent, setSearchIntent, competitorUrlsText, setCompetitorUrlsText, competitors,
        outline, setOutline, title, setTitle, slug, setSlug, metaTitle, setMetaTitle,
        metaDescription, setMetaDescription, contentMarkdown, setContentMarkdown, faqs, imagePrompts,
        outlineProvider, setOutlineProvider, outlineModel, setOutlineModel,
        useSearchGrounding, setUseSearchGrounding, writeProvider, setWriteProvider,
        writeModel, setWriteModel, writeMode, setWriteMode,
        isCrawling, isGenerating, isGeneratingMeta, isSaving, streamPreview, streamStatusLabel,
        lastTokenCostText, bannerError, setBannerError, bannerOk, activeSite, auditResult,
        hydrateArticle, resetNewArticleForm, loadAllMetadata, loadArticles,
        handleSaveManual, handleCrawlCompetitors, handleGenerateOutline,
        handleGenerateArticle, handleRewriteSelection, handleGenerateMetaFaq, handleStopGeneration,
    };
}
