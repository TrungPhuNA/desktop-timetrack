import React, { useState } from "react";
import { Globe, KeyRound, Plus, Save } from "lucide-react";
import { seoApi } from "../../services/seoApi";
import { SeoArticle } from "../../types/seo";
import { ConfirmModal } from "../ConfirmModal";
import { SeoAiConfigModal } from "./SeoAiConfigModal";
import { SeoArticleSidebar } from "./SeoArticleSidebar";
import { SeoAuditPanel } from "./SeoAuditPanel";
import { SeoBriefStep } from "./SeoBriefStep";
import { SeoEditorStep } from "./SeoEditorStep";
import { SeoOutlineStep } from "./SeoOutlineStep";
import { SeoSiteModal } from "./SeoSiteModal";
import { SeoStudioSkeleton } from "./SeoStudioSkeleton";
import { StudioStep, useSeoStudio } from "./useSeoStudio";

/**
 * Giao diện chính của Phân hệ SEO Content Studio (Tab 3: SEO Writer Studio)
 * Bố cục 3 cột: Danh sách bài | Pipeline 3 bước | SEO Audit & Xuất bản
 */
export const SeoStudioView: React.FC = () => {
    const s = useSeoStudio();
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SeoArticle | null>(null);

    if (s.loading) {
        return <SeoStudioSkeleton />;
    }

    const hasClaudeKey = s.aiConfigs.some((c) => c.provider === "claude" && c.is_active);
    const hasGeminiKey = s.aiConfigs.some((c) => c.provider === "gemini" && c.is_active);

    return (
        <div className="space-y-4">
            {/* Sub-toolbar SEO Studio */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                        <span className={`h-2 w-2 rounded-full ${hasGeminiKey ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className="font-bold text-slate-800">Gemini</span>
                        <span className="text-slate-500">➔</span>
                        <span className={`h-2 w-2 rounded-full ${hasClaudeKey ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className="font-bold text-slate-800">Claude</span>
                    </div>

                    {s.usageSummary && (
                        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 font-medium">
                            Chi phí T{s.currentMonth.split("-")[1]}:{" "}
                            <strong className="text-slate-900">
                                ${s.usageSummary.total_cost_usd.toFixed(3)} (~
                                {Math.round(s.usageSummary.total_cost_usd * 25500).toLocaleString("vi-VN")} đ)
                            </strong>
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsSiteModalOpen(true)}
                        aria-label="Quản lý danh sách Website và Brand Voice"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                        <Globe className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Website ({s.sites.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsAiModalOpen(true)}
                        aria-label="Cấu hình API Key Claude và Gemini"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 text-xs font-bold text-amber-900 cursor-pointer"
                    >
                        <KeyRound className="h-3.5 w-3.5 text-amber-700" />
                        <span>API Claude & Gemini</span>
                    </button>

                    <button
                        type="button"
                        onClick={s.handleSaveManual}
                        disabled={s.isSaving || !s.primaryKeyword.trim()}
                        aria-label="Lưu bài viết SEO hiện tại"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 px-3 text-xs font-bold text-emerald-800 cursor-pointer"
                    >
                        <Save className="h-3.5 w-3.5" />
                        <span>{s.isSaving ? "Đang lưu..." : "Lưu bài"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => s.resetNewArticleForm(s.templates[0]?.id ?? null)}
                        aria-label="Tạo bài viết SEO mới"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Viết Bài Mới</span>
                    </button>
                </div>
            </div>

            {s.bannerError && (
                <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800">
                    <span>{s.bannerError}</span>
                    <button
                        type="button"
                        onClick={() => s.setBannerError(null)}
                        aria-label="Đóng thông báo lỗi"
                        className="ml-3 font-bold underline cursor-pointer"
                    >
                        Đóng
                    </button>
                </div>
            )}

            {s.bannerOk && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
                    {s.bannerOk}
                </div>
            )}

            {/* Studio 3 cột */}
            <div className="grid grid-cols-12 gap-4 items-start">
                <SeoArticleSidebar
                    articles={s.articles}
                    sites={s.sites}
                    selectedArticleId={s.activeArticleId}
                    filterSiteId={s.filterSiteId}
                    filterStatus={s.filterStatus}
                    searchQuery={s.searchQuery}
                    onSearchChange={s.setSearchQuery}
                    onFilterSiteChange={s.setFilterSiteId}
                    onFilterStatusChange={s.setFilterStatus}
                    onSelectArticle={s.hydrateArticle}
                    onCreateNew={() => s.resetNewArticleForm(s.templates[0]?.id ?? null)}
                    onDeleteArticle={(art) => setDeleteTarget(art)}
                />

                <section className="col-span-12 lg:col-span-6 space-y-3">
                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs text-xs font-bold">
                        {[
                            { step: 1 as StudioStep, label: "1. Brief & Đối Thủ" },
                            { step: 2 as StudioStep, label: `2. Dàn Ý (${s.outline.length})` },
                            { step: 3 as StudioStep, label: "3. Viết & Xuất Bài" },
                        ].map((item) => (
                            <button
                                key={item.step}
                                type="button"
                                onClick={() => s.setActiveStep(item.step)}
                                aria-label={`Chuyển sang bước ${item.label}`}
                                className={`rounded-lg border px-3 py-2 text-center transition-colors cursor-pointer ${
                                    s.activeStep === item.step
                                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                        : "border-transparent text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {s.activeStep === 1 && (
                        <SeoBriefStep
                            sites={s.sites}
                            templates={s.templates}
                            siteId={s.siteId}
                            templateId={s.templateId}
                            primaryKeyword={s.primaryKeyword}
                            secondaryKeywordsText={s.secondaryKeywordsText}
                            searchIntent={s.searchIntent}
                            competitorUrlsText={s.competitorUrlsText}
                            competitors={s.competitors}
                            outlineProvider={s.outlineProvider}
                            outlineModel={s.outlineModel}
                            useSearchGrounding={s.useSearchGrounding}
                            isCrawling={s.isCrawling}
                            isGenerating={s.isGenerating}
                            streamPreview={s.streamPreview}
                            onChangeSiteId={s.setSiteId}
                            onChangeTemplateId={s.setTemplateId}
                            onChangePrimaryKeyword={s.setPrimaryKeyword}
                            onChangeSecondaryKeywordsText={s.setSecondaryKeywordsText}
                            onChangeSearchIntent={s.setSearchIntent}
                            onChangeCompetitorUrlsText={s.setCompetitorUrlsText}
                            onChangeOutlineProvider={s.setOutlineProvider}
                            onChangeOutlineModel={s.setOutlineModel}
                            onChangeUseSearchGrounding={s.setUseSearchGrounding}
                            onCrawlCompetitors={s.handleCrawlCompetitors}
                            onGenerateOutline={s.handleGenerateOutline}
                            onStopGeneration={s.handleStopGeneration}
                        />
                    )}

                    {s.activeStep === 2 && (
                        <SeoOutlineStep
                            title={s.title}
                            outline={s.outline}
                            writeProvider={s.writeProvider}
                            writeModel={s.writeModel}
                            writeMode={s.writeMode}
                            isGenerating={s.isGenerating}
                            onChangeTitle={s.setTitle}
                            onChangeOutline={s.setOutline}
                            onChangeWriteProvider={s.setWriteProvider}
                            onChangeWriteModel={s.setWriteModel}
                            onChangeWriteMode={s.setWriteMode}
                            onGenerateArticle={s.handleGenerateArticle}
                            onStopGeneration={s.handleStopGeneration}
                        />
                    )}

                    {s.activeStep === 3 && (
                        <SeoEditorStep
                            contentMarkdown={s.contentMarkdown}
                            audit={s.auditResult}
                            isGenerating={s.isGenerating}
                            streamStatusLabel={s.streamStatusLabel}
                            lastTokenCostText={s.lastTokenCostText}
                            onChangeContent={s.setContentMarkdown}
                            onStopGeneration={s.handleStopGeneration}
                            onRewriteSelection={s.handleRewriteSelection}
                        />
                    )}
                </section>

                <SeoAuditPanel
                    domain={s.activeSite?.domain || ""}
                    primaryKeyword={s.primaryKeyword}
                    slug={s.slug}
                    metaTitle={s.metaTitle}
                    metaDescription={s.metaDescription}
                    contentMarkdown={s.contentMarkdown}
                    faqs={s.faqs}
                    imagePrompts={s.imagePrompts}
                    audit={s.auditResult}
                    isGeneratingMeta={s.isGeneratingMeta}
                    onChangeSlug={s.setSlug}
                    onChangeMetaTitle={s.setMetaTitle}
                    onChangeMetaDescription={s.setMetaDescription}
                    onGenerateMetaFaq={s.handleGenerateMetaFaq}
                />
            </div>

            <SeoAiConfigModal
                isOpen={isAiModalOpen}
                configs={s.aiConfigs}
                usageSummary={s.usageSummary}
                onClose={() => setIsAiModalOpen(false)}
                onSaved={async () => {
                    await s.loadAllMetadata();
                }}
            />

            <SeoSiteModal
                isOpen={isSiteModalOpen}
                sites={s.sites}
                onClose={() => setIsSiteModalOpen(false)}
                onSaved={async () => {
                    await s.loadAllMetadata();
                    await s.loadArticles();
                }}
            />

            <ConfirmModal
                isOpen={deleteTarget !== null}
                title="Xác nhận xóa bài viết SEO"
                message={`Anh có chắc muốn xóa bài viết "${deleteTarget?.title || deleteTarget?.primary_keyword || ""}" không?`}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={async () => {
                    if (!deleteTarget) return;
                    const idToDelete = deleteTarget.id;
                    await seoApi.deleteArticle(idToDelete);
                    setDeleteTarget(null);
                    const nextList = await s.loadArticles();
                    if (s.activeArticleId === idToDelete) {
                        if (nextList.length > 0) s.hydrateArticle(nextList[0]);
                        else s.resetNewArticleForm(s.templates[0]?.id ?? null);
                    }
                }}
            />
        </div>
    );
};
