import React, { useMemo, useRef, useState } from "react";
import { Eye, FileEdit, Sparkles, Square, Table2, Wand2 } from "lucide-react";
import { markdownToCleanHtml } from "../../services/seoExport";
import { SeoAuditResult } from "../../services/seoAudit";

interface SeoEditorStepProps {
    contentMarkdown: string;
    audit: SeoAuditResult;
    isGenerating: boolean;
    streamStatusLabel: string;
    lastTokenCostText: string;
    onChangeContent: (val: string) => void;
    onStopGeneration: () => void;
    onRewriteSelection: (
        selectedText: string,
        instruction: string,
        start: number,
        end: number
    ) => void;
}

/**
 * Bước 3: Trình biên tập Markdown + Xem trước HTML sạch + Stream Realtime + Quick Rewrite đoạn bôi đen
 */
export const SeoEditorStep: React.FC<SeoEditorStepProps> = ({
    contentMarkdown,
    audit,
    isGenerating,
    streamStatusLabel,
    lastTokenCostText,
    onChangeContent,
    onStopGeneration,
    onRewriteSelection,
}) => {
    const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const cleanHtmlPreview = useMemo(
        () => markdownToCleanHtml(contentMarkdown),
        [contentMarkdown]
    );

    const triggerQuickRewrite = (instruction: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = contentMarkdown.slice(start, end).trim();
        if (!selected) {
            alert("Anh hãy bôi đen đoạn văn bản muốn biên tập trong ô soạn thảo trước nhé.");
            return;
        }
        onRewriteSelection(selected, instruction, start, end);
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
            {/* Toolbar trình soạn thảo & Quick Rewrite */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setViewMode("edit")}
                        aria-label="Chuyển sang chế độ soạn thảo Markdown"
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                            viewMode === "edit"
                                ? "bg-white border border-indigo-200 text-indigo-700 shadow-2xs"
                                : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                    >
                        <FileEdit className="h-3.5 w-3.5" />
                        <span>Soạn thảo</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode("preview")}
                        aria-label="Chuyển sang chế độ xem trước HTML"
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                            viewMode === "preview"
                                ? "bg-white border border-indigo-200 text-indigo-700 shadow-2xs"
                                : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                    >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Xem trước HTML</span>
                    </button>

                    {viewMode === "edit" && (
                        <>
                            <span className="mx-1 h-4 w-px bg-slate-300" />
                            <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() =>
                                    triggerQuickRewrite(
                                        "Viết lại tự nhiên như người thật chia sẻ kinh nghiệm, bỏ văn mẫu AI, giữ nguyên ý chính."
                                    )
                                }
                                aria-label="Viết lại đoạn bôi đen tự nhiên hơn"
                                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
                            >
                                <Wand2 className="h-3 w-3" />
                                <span>Tự nhiên hơn</span>
                            </button>
                            <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() =>
                                    triggerQuickRewrite(
                                        "Mở rộng sâu sắc hơn, bổ sung ví dụ thực tế tại Việt Nam và số liệu minh họa."
                                    )
                                }
                                aria-label="Mở rộng chi tiết đoạn bôi đen"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                            >
                                <Sparkles className="h-3 w-3 text-indigo-600" />
                                <span>Mở rộng ý</span>
                            </button>
                            <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() =>
                                    triggerQuickRewrite(
                                        "Chuyển nội dung đoạn này thành một bảng so sánh Markdown (Table) rõ ràng, dễ quét mắt."
                                    )
                                }
                                aria-label="Chuyển đoạn bôi đen thành bảng so sánh Markdown"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                            >
                                <Table2 className="h-3 w-3 text-emerald-600" />
                                <span>Thành bảng</span>
                            </button>
                        </>
                    )}
                </div>

                {isGenerating && (
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                            <span className="max-w-[180px] truncate">
                                {streamStatusLabel || "AI đang stream..."}
                            </span>
                        </span>
                        <button
                            type="button"
                            onClick={onStopGeneration}
                            aria-label="Dừng AI đang viết"
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                        >
                            <Square className="h-3 w-3 fill-current" />
                            <span>Dừng</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Vùng nội dung chính */}
            {viewMode === "edit" ? (
                <textarea
                    ref={textareaRef}
                    value={contentMarkdown}
                    onChange={(e) => onChangeContent(e.target.value)}
                    placeholder="Nội dung bài viết Markdown sẽ xuất hiện theo thời gian thực tại đây. Anh có thể chỉnh sửa trực tiếp hoặc bôi đen 1 đoạn để bấm nút AI viết lại..."
                    aria-label="Trình soạn thảo nội dung bài viết SEO Markdown"
                    className="w-full min-h-[450px] p-4 text-xs leading-relaxed text-slate-800 font-mono focus:outline-none resize-y"
                />
            ) : (
                <div
                    className="min-h-[450px] max-h-[560px] overflow-y-auto p-5 text-sm leading-relaxed text-slate-800 space-y-3 [&_h1]:text-xl [&_h1]:font-extrabold [&_h2]:text-base [&_h2]:font-bold [&_h2]:pt-2 [&_h3]:text-sm [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:bg-indigo-50/40 [&_blockquote]:px-3 [&_blockquote]:py-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_td]:border [&_td]:border-slate-200 [&_td]:px-2.5 [&_td]:py-1.5 [&_a]:text-indigo-700 [&_a]:underline"
                    dangerouslySetInnerHTML={{
                        __html:
                            cleanHtmlPreview ||
                            '<p class="text-slate-500">Chưa có nội dung để xem trước.</p>',
                    }}
                />
            )}

            {/* Thanh trạng thái đáy */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-700">
                <span>
                    Tổng: <strong>{audit.wordCount.toLocaleString("vi-VN")} từ</strong> •{" "}
                    {audit.h2Count} H2 • {audit.h3Count} H3 • {audit.internalLinkCount} Links
                </span>
                <span>{lastTokenCostText || "Chỉnh sửa tự do — bấm Lưu hoặc tự động lưu"}</span>
            </div>
        </div>
    );
};
