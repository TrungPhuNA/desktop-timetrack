import React, { useState } from "react";
import { Check, Copy, FileCode2, Loader2, Sparkles } from "lucide-react";
import { SeoAuditResult, toSeoSlug } from "../../services/seoAudit";
import { buildFaqJsonLd, markdownToCleanHtml } from "../../services/seoExport";
import { FaqItem, ImagePromptItem } from "../../types/seo";

interface SeoAuditPanelProps {
    domain: string;
    primaryKeyword: string;
    slug: string;
    metaTitle: string;
    metaDescription: string;
    contentMarkdown: string;
    faqs: FaqItem[];
    imagePrompts: ImagePromptItem[];
    audit: SeoAuditResult;
    isGeneratingMeta: boolean;
    onChangeSlug: (val: string) => void;
    onChangeMetaTitle: (val: string) => void;
    onChangeMetaDescription: (val: string) => void;
    onGenerateMetaFaq: () => void;
}

/**
 * Cột phải SEO Studio: Chấm điểm SEO On-Page, Google SERP Preview, Meta Editor và Export 1-Click
 */
export const SeoAuditPanel: React.FC<SeoAuditPanelProps> = ({
    domain,
    primaryKeyword,
    slug,
    metaTitle,
    metaDescription,
    contentMarkdown,
    faqs,
    imagePrompts,
    audit,
    isGeneratingMeta,
    onChangeSlug,
    onChangeMetaTitle,
    onChangeMetaDescription,
    onGenerateMetaFaq,
}) => {
    const [copiedType, setCopiedType] = useState<string | null>(null);

    const copyText = async (type: string, text: string) => {
        if (!text.trim()) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedType(type);
            setTimeout(() => setCopiedType(null), 2000);
        } catch (err) {
            console.error("Lỗi copy clipboard:", err);
        }
    };

    const scoreBorder =
        audit.score >= 80
            ? "border-emerald-500 text-emerald-700 bg-emerald-50/60"
            : audit.score >= 50
            ? "border-amber-500 text-amber-800 bg-amber-50/60"
            : "border-rose-400 text-rose-700 bg-rose-50/60";

    const cleanHost = (domain || "website-cua-ban.vn").replace(/^https?:\/\//, "").replace(/\/$/, "");
    const displaySlug = slug || toSeoSlug(primaryKeyword) || "duong-dan-bai-viet";

    return (
        <aside className="col-span-12 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-4 lg:max-h-[calc(100vh-220px)] overflow-y-auto">
            {/* Vòng tròn điểm SEO On-Page */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                        Điểm SEO On-Page
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                        Mật độ KW: <strong>{audit.keywordDensity}%</strong> ({audit.keywordCount} lần)
                    </div>
                </div>
                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-4 bg-white text-sm font-extrabold shrink-0 ${scoreBorder}`}
                >
                    {audit.score}
                </div>
            </div>

            {/* Checklist 8 tiêu chí On-Page */}
            <div className="space-y-1.5">
                {audit.checks.map((item) => {
                    const dotColor =
                        item.status === "pass"
                            ? "text-emerald-700"
                            : item.status === "warn"
                            ? "text-amber-700"
                            : "text-rose-700";
                    const icon = item.status === "pass" ? "✓" : item.status === "warn" ? "⚠" : "✕";

                    return (
                        <div
                            key={item.id}
                            className="flex items-start justify-between gap-2 text-[11px] leading-snug"
                        >
                            <span className={`font-medium ${dotColor}`}>
                                {icon} {item.label}
                            </span>
                            <span className="text-slate-600 font-semibold shrink-0">{item.detail}</span>
                        </div>
                    );
                })}
            </div>

            {/* Google SERP Preview & Meta Editor */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Thẻ Meta & Google Preview</span>
                    <button
                        type="button"
                        onClick={onGenerateMetaFaq}
                        disabled={isGeneratingMeta || !contentMarkdown.trim()}
                        aria-label="Dùng AI tự động sinh Meta Title, Meta Description, Slug và FAQ"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 disabled:opacity-40 cursor-pointer"
                    >
                        {isGeneratingMeta ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Sparkles className="h-3 w-3" />
                        )}
                        <span>{isGeneratingMeta ? "Đang tạo..." : "AI tạo Meta & FAQ"}</span>
                    </button>
                </div>

                {/* Google SERP Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1">
                    <div className="text-[10px] text-slate-600 truncate">
                        {cleanHost} › {displaySlug}
                    </div>
                    <div className="text-xs font-bold text-blue-700 leading-snug line-clamp-2">
                        {metaTitle || primaryKeyword || "Tiêu đề hiển thị trên Google Search"}
                    </div>
                    <div className="text-[11px] text-slate-700 line-clamp-2 leading-snug">
                        {metaDescription ||
                            "Đoạn mô tả Meta Description chuẩn 140-160 ký tự giúp tăng tỷ lệ click (CTR) trên trang kết quả tìm kiếm."}
                    </div>
                </div>

                <div className="space-y-2">
                    <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                            <label className="font-bold text-slate-700">Meta Title</label>
                            <span className={metaTitle.length > 65 ? "text-rose-700 font-bold" : "text-slate-600"}>
                                {metaTitle.length}/60
                            </span>
                        </div>
                        <input
                            type="text"
                            value={metaTitle}
                            onChange={(e) => onChangeMetaTitle(e.target.value)}
                            placeholder="Tiêu đề SEO 50-60 ký tự..."
                            aria-label="Nhập Meta Title SEO"
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                            <label className="font-bold text-slate-700">Meta Description</label>
                            <span className={metaDescription.length > 165 ? "text-rose-700 font-bold" : "text-slate-600"}>
                                {metaDescription.length}/160
                            </span>
                        </div>
                        <textarea
                            rows={2}
                            value={metaDescription}
                            onChange={(e) => onChangeMetaDescription(e.target.value)}
                            placeholder="Mô tả SEO 140-160 ký tự..."
                            aria-label="Nhập Meta Description SEO"
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                            URL Slug
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => onChangeSlug(e.target.value)}
                            placeholder="tu-bep-inox-canh-kinh"
                            aria-label="Nhập URL Slug chuẩn SEO"
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* FAQ Schema & Image Alt tóm tắt nếu có */}
            {(faqs.length > 0 || imagePrompts.length > 0) && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-2.5 space-y-1.5 text-[11px]">
                    {faqs.length > 0 && (
                        <div className="text-indigo-900 font-semibold">
                            ✓ Đã tạo {faqs.length} câu hỏi chuẩn FAQ Schema
                        </div>
                    )}
                    {imagePrompts.length > 0 && (
                        <div className="text-slate-700">
                            ✓ {imagePrompts.length} gợi ý ảnh & Alt text chuẩn SEO
                        </div>
                    )}
                </div>
            )}

            {/* Xuất bản 1-Click */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => copyText("html", markdownToCleanHtml(contentMarkdown))}
                        disabled={!contentMarkdown.trim()}
                        aria-label="Sao chép mã HTML sạch không CSS rác"
                        className="inline-flex items-center justify-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 py-2 px-2 text-xs font-bold text-white cursor-pointer"
                    >
                        {copiedType === "html" ? (
                            <Check className="h-3.5 w-3.5" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{copiedType === "html" ? "Đã Copy!" : "Copy HTML"}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => copyText("md", contentMarkdown)}
                        disabled={!contentMarkdown.trim()}
                        aria-label="Sao chép nội dung Markdown"
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 py-2 px-2 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                        {copiedType === "md" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{copiedType === "md" ? "Đã Copy!" : "Copy MD"}</span>
                    </button>
                </div>

                {faqs.length > 0 && (
                    <button
                        type="button"
                        onClick={() => copyText("faq", buildFaqJsonLd(faqs))}
                        aria-label="Sao chép mã JSON-LD FAQ Schema"
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 py-1.5 text-xs font-bold text-amber-800 cursor-pointer"
                    >
                        <FileCode2 className="h-3.5 w-3.5" />
                        <span>
                            {copiedType === "faq"
                                ? "Đã Copy JSON-LD FAQ!"
                                : "Copy Schema FAQ (JSON-LD)"}
                        </span>
                    </button>
                )}
            </div>
        </aside>
    );
};
