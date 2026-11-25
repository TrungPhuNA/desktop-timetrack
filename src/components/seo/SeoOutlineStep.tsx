import React, { useMemo } from "react";
import Select from "react-select";
import { ArrowDown, ArrowUp, PenLine, Plus, Square, Trash2 } from "lucide-react";
import { cleanSelectStyles, SelectOption, tableSelectStyles } from "../selectStyles";
import {
    AiProvider,
    CLAUDE_MODELS,
    GEMINI_MODELS,
    OutlineNode,
    WriteMode,
} from "../../types/seo";

interface SeoOutlineStepProps {
    title: string;
    outline: OutlineNode[];
    writeProvider: AiProvider;
    writeModel: string;
    writeMode: WriteMode;
    isGenerating: boolean;
    onChangeTitle: (val: string) => void;
    onChangeOutline: (nodes: OutlineNode[]) => void;
    onChangeWriteProvider: (val: AiProvider) => void;
    onChangeWriteModel: (val: string) => void;
    onChangeWriteMode: (val: WriteMode) => void;
    onGenerateArticle: () => void;
    onStopGeneration: () => void;
}

const LEVEL_OPTIONS: SelectOption[] = [
    { value: "h2", label: "H2" },
    { value: "h3", label: "H3" },
    { value: "faq", label: "FAQ" },
];

const PROVIDER_OPTIONS: SelectOption[] = [
    { value: "claude", label: "Anthropic Claude (Khuyên dùng viết)" },
    { value: "gemini", label: "Google Gemini" },
];

const WRITE_MODE_OPTIONS: SelectOption[] = [
    { value: "section_by_section", label: "Cuốn chiếu từng H2 (Bài sâu 2.000+ từ)" },
    { value: "full", label: "Viết 1 lượt toàn bài (Nhanh, < 1.800 từ)" },
];

/**
 * Bước 2: Trình chỉnh sửa cây Dàn ý (H1 / H2 / H3 / FAQ) trực quan trước khi cho AI viết bài
 */
export const SeoOutlineStep: React.FC<SeoOutlineStepProps> = ({
    title,
    outline,
    writeProvider,
    writeModel,
    writeMode,
    isGenerating,
    onChangeTitle,
    onChangeOutline,
    onChangeWriteProvider,
    onChangeWriteModel,
    onChangeWriteMode,
    onGenerateArticle,
    onStopGeneration,
}) => {
    const totalTargetWords = useMemo(
        () => outline.reduce((sum, item) => sum + (Number(item.target_words) || 0), 0),
        [outline]
    );

    const modelOptions: SelectOption[] = useMemo(() => {
        const list = writeProvider === "claude" ? CLAUDE_MODELS : GEMINI_MODELS;
        const options = list.map((m) => ({ value: m.value, label: m.label }));
        if (writeModel && !options.some((o) => o.value === writeModel)) {
            options.unshift({ value: writeModel, label: writeModel });
        }
        return options;
    }, [writeProvider, writeModel]);

    const handleAddNode = (level: "h2" | "h3" | "faq") => {
        const newNode: OutlineNode = {
            id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            level,
            title: level === "faq" ? "Câu hỏi thường gặp" : "Tiêu đề mục mới",
            notes: "",
            target_words: level === "h3" ? 200 : 350,
        };
        onChangeOutline([...outline, newNode]);
    };

    const handleUpdateNode = (idx: number, patch: Partial<OutlineNode>) => {
        const next = outline.map((item, i) => (i === idx ? { ...item, ...patch } : item));
        onChangeOutline(next);
    };

    const handleMoveNode = (idx: number, direction: -1 | 1) => {
        const target = idx + direction;
        if (target < 0 || target >= outline.length) return;
        const next = [...outline];
        const [moved] = next.splice(idx, 1);
        next.splice(target, 0, moved);
        onChangeOutline(next);
    };

    const handleRemoveNode = (idx: number) => {
        onChangeOutline(outline.filter((_, i) => i !== idx));
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-xs font-bold text-slate-900">
                        Chỉnh Sửa Cây Dàn Ý Trước Khi Viết
                    </h3>
                    <p className="text-[11px] text-slate-600">
                        Tổng mục tiêu: <strong>~{totalTargetWords.toLocaleString("vi-VN")} từ</strong> •{" "}
                        {outline.length} mục
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => handleAddNode("h2")}
                        aria-label="Thêm mục H2 vào dàn ý"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>H2</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddNode("h3")}
                        aria-label="Thêm mục H3 vào dàn ý"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>H3</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleAddNode("faq")}
                        aria-label="Thêm mục FAQ vào dàn ý"
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>FAQ</span>
                    </button>
                </div>
            </div>

            {/* Tiêu đề H1 */}
            <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-2">
                <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
                    H1
                </span>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => onChangeTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết (H1)..."
                    aria-label="Tiêu đề H1 của bài viết"
                    className="flex-1 bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
                />
            </div>

            {/* Danh sách các node H2 / H3 / FAQ */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {outline.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-600">
                        Chưa có dàn ý. Anh hãy quay lại Bước 1 để AI tạo tự động, hoặc bấm <strong>+ H2</strong> để tự thêm mục.
                    </div>
                ) : (
                    outline.map((node, idx) => (
                        <div
                            key={node.id}
                            className={`rounded-xl border p-2.5 space-y-1.5 transition-colors ${
                                node.level === "h3"
                                    ? "ml-6 border-slate-200 bg-slate-50/70"
                                    : node.level === "faq"
                                    ? "border-amber-200 bg-amber-50/30"
                                    : "border-slate-200 bg-white"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-20 shrink-0">
                                    <Select<SelectOption, false>
                                        aria-label={`Chọn cấp độ Heading cho mục ${idx + 1}`}
                                        value={LEVEL_OPTIONS.find((o) => o.value === node.level)}
                                        options={LEVEL_OPTIONS}
                                        onChange={(opt) =>
                                            handleUpdateNode(idx, {
                                                level: (opt?.value as "h2" | "h3" | "faq") || "h2",
                                            })
                                        }
                                        styles={tableSelectStyles}
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                        isSearchable={false}
                                    />
                                </div>

                                <input
                                    type="text"
                                    value={node.title}
                                    onChange={(e) => handleUpdateNode(idx, { title: e.target.value })}
                                    aria-label={`Tiêu đề mục dàn ý ${idx + 1}`}
                                    className="flex-1 text-xs font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-indigo-400 focus:outline-none py-0.5"
                                />

                                <div className="flex items-center gap-1 shrink-0">
                                    <input
                                        type="number"
                                        min={50}
                                        step={50}
                                        value={node.target_words}
                                        onChange={(e) =>
                                            handleUpdateNode(idx, {
                                                target_words: Number(e.target.value) || 200,
                                            })
                                        }
                                        aria-label={`Số từ mục tiêu của mục ${idx + 1}`}
                                        className="w-16 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-right text-[11px] font-semibold text-slate-700"
                                    />
                                    <span className="text-[10px] text-slate-600">từ</span>
                                </div>

                                <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleMoveNode(idx, -1)}
                                        disabled={idx === 0}
                                        aria-label={`Di chuyển mục ${idx + 1} lên trên`}
                                        className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                    >
                                        <ArrowUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMoveNode(idx, 1)}
                                        disabled={idx === outline.length - 1}
                                        aria-label={`Di chuyển mục ${idx + 1} xuống dưới`}
                                        className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                    >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveNode(idx)}
                                        aria-label={`Xóa mục ${idx + 1}`}
                                        className="rounded p-1 text-slate-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            <input
                                type="text"
                                value={node.notes}
                                onChange={(e) => handleUpdateNode(idx, { notes: e.target.value })}
                                placeholder="Ghi chú ý chính, ví dụ thực tế hoặc bảng biểu cho AI viết..."
                                aria-label={`Ghi chú cho mục ${idx + 1}`}
                                className="w-full rounded-md bg-slate-50/80 px-2.5 py-1 text-[11px] text-slate-700 placeholder:text-slate-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-300"
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Thanh cấu hình AI viết bài */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            AI Viết Bài
                        </label>
                        <Select<SelectOption, false>
                            aria-label="Chọn nhà cung cấp AI viết bài"
                            value={PROVIDER_OPTIONS.find((o) => o.value === writeProvider)}
                            options={PROVIDER_OPTIONS}
                            onChange={(opt) => {
                                const nextProv = (opt?.value as AiProvider) || "claude";
                                onChangeWriteProvider(nextProv);
                                onChangeWriteModel(
                                    nextProv === "claude"
                                        ? CLAUDE_MODELS[0].value
                                        : GEMINI_MODELS[0].value
                                );
                            }}
                            styles={cleanSelectStyles}
                            isSearchable={false}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Model Viết
                        </label>
                        <Select<SelectOption, false>
                            aria-label="Chọn Model AI viết bài"
                            value={
                                modelOptions.find((o) => o.value === writeModel) ||
                                modelOptions[0]
                            }
                            options={modelOptions}
                            onChange={(opt) => onChangeWriteModel(String(opt?.value || ""))}
                            styles={cleanSelectStyles}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Chế Độ Viết
                        </label>
                        <Select<SelectOption, false>
                            aria-label="Chọn chế độ viết toàn bài hoặc cuốn chiếu từng H2"
                            value={WRITE_MODE_OPTIONS.find((o) => o.value === writeMode)}
                            options={WRITE_MODE_OPTIONS}
                            onChange={(opt) =>
                                onChangeWriteMode((opt?.value as WriteMode) || "section_by_section")
                            }
                            styles={cleanSelectStyles}
                            isSearchable={false}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    {isGenerating ? (
                        <button
                            type="button"
                            onClick={onStopGeneration}
                            aria-label="Dừng AI đang viết bài"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                        >
                            <Square className="h-3.5 w-3.5 fill-current" />
                            <span>Dừng Viết Bài</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onGenerateArticle}
                            disabled={outline.length === 0}
                            aria-label="Bắt đầu stream AI viết bài chuẩn SEO"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                        >
                            <PenLine className="h-4 w-4" />
                            <span>Bắt Đầu Viết Bài</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
