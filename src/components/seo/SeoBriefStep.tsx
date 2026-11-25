import React, { useMemo, useState } from "react";
import Select from "react-select";
import { Globe, Loader2, SearchCheck, Sparkles, Square } from "lucide-react";
import { cleanSelectStyles, SelectOption } from "../selectStyles";
import {
    AiProvider,
    CLAUDE_MODELS,
    CompetitorAnalysis,
    GEMINI_MODELS,
    SearchIntent,
    SeoSite,
    SeoTemplate,
} from "../../types/seo";

interface SeoBriefStepProps {
    sites: SeoSite[];
    templates: SeoTemplate[];
    siteId: number | null;
    templateId: number | null;
    primaryKeyword: string;
    secondaryKeywordsText: string;
    searchIntent: SearchIntent;
    competitorUrlsText: string;
    competitors: CompetitorAnalysis[];
    outlineProvider: AiProvider;
    outlineModel: string;
    useSearchGrounding: boolean;
    isCrawling: boolean;
    isGenerating: boolean;
    streamPreview: string;
    onChangeSiteId: (id: number | null) => void;
    onChangeTemplateId: (id: number | null) => void;
    onChangePrimaryKeyword: (val: string) => void;
    onChangeSecondaryKeywordsText: (val: string) => void;
    onChangeSearchIntent: (val: SearchIntent) => void;
    onChangeCompetitorUrlsText: (val: string) => void;
    onChangeOutlineProvider: (val: AiProvider) => void;
    onChangeOutlineModel: (val: string) => void;
    onChangeUseSearchGrounding: (val: boolean) => void;
    onCrawlCompetitors: () => void;
    onGenerateOutline: () => void;
    onStopGeneration: () => void;
}

const INTENT_OPTIONS: SelectOption[] = [
    { value: "informational", label: "Informational (Kiến thức / Giải đáp)" },
    { value: "commercial", label: "Commercial (Đánh giá / So sánh)" },
    { value: "transactional", label: "Transactional (Mua hàng / Dịch vụ)" },
    { value: "navigational", label: "Navigational (Tìm thương hiệu)" },
];

const PROVIDER_OPTIONS: SelectOption[] = [
    { value: "gemini", label: "Google Gemini (Khuyên dùng)" },
    { value: "claude", label: "Anthropic Claude" },
];

/**
 * Bước 1: Nhập Brief từ khóa, chọn Brand Voice/Template, cào Heading đối thủ và gọi AI lập dàn ý
 */
export const SeoBriefStep: React.FC<SeoBriefStepProps> = ({
    sites,
    templates,
    siteId,
    templateId,
    primaryKeyword,
    secondaryKeywordsText,
    searchIntent,
    competitorUrlsText,
    competitors,
    outlineProvider,
    outlineModel,
    useSearchGrounding,
    isCrawling,
    isGenerating,
    streamPreview,
    onChangeSiteId,
    onChangeTemplateId,
    onChangePrimaryKeyword,
    onChangeSecondaryKeywordsText,
    onChangeSearchIntent,
    onChangeCompetitorUrlsText,
    onChangeOutlineProvider,
    onChangeOutlineModel,
    onChangeUseSearchGrounding,
    onCrawlCompetitors,
    onGenerateOutline,
    onStopGeneration,
}) => {
    const [expandedUrl, setExpandedUrl] = useState<string | null>(null);

    const siteOptions: SelectOption[] = useMemo(
        () => [
            { value: "none", label: "Chung (Không gắn Brand cụ thể)" },
            ...sites.map((s) => ({
                value: s.id,
                label: `${s.name}${s.niche ? ` (${s.niche})` : ""}`,
            })),
        ],
        [sites]
    );

    const templateOptions: SelectOption[] = useMemo(
        () =>
            templates.map((t) => ({
                value: t.id,
                label: `${t.name} (~${t.target_word_count.toLocaleString("vi-VN")} từ)`,
            })),
        [templates]
    );

    const modelOptions: SelectOption[] = useMemo(() => {
        const list = outlineProvider === "gemini" ? GEMINI_MODELS : CLAUDE_MODELS;
        const options = list.map((m) => ({ value: m.value, label: m.label }));
        if (outlineModel && !options.some((o) => o.value === outlineModel)) {
            options.unshift({ value: outlineModel, label: outlineModel });
        }
        return options;
    }, [outlineProvider, outlineModel]);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
            {/* Website Profile & Template */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                        Website / Brand Voice
                    </label>
                    <Select<SelectOption, false>
                        aria-label="Chọn Website áp dụng Brand Voice"
                        value={siteOptions.find((o) => o.value === (siteId ?? "none")) || siteOptions[0]}
                        options={siteOptions}
                        onChange={(opt) =>
                            onChangeSiteId(!opt || opt.value === "none" ? null : Number(opt.value))
                        }
                        styles={cleanSelectStyles}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mẫu Bài SEO (Template)
                    </label>
                    <Select<SelectOption, false>
                        aria-label="Chọn mẫu cấu trúc bài viết SEO"
                        value={
                            templateOptions.find((o) => o.value === templateId) ||
                            templateOptions[0] ||
                            null
                        }
                        options={templateOptions}
                        onChange={(opt) => onChangeTemplateId(opt ? Number(opt.value) : null)}
                        styles={cleanSelectStyles}
                    />
                </div>
            </div>

            {/* Từ khóa chính & Search Intent */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                        Từ khóa chính (Primary Keyword) <span className="text-rose-600">*</span>
                    </label>
                    <input
                        type="text"
                        value={primaryKeyword}
                        onChange={(e) => onChangePrimaryKeyword(e.target.value)}
                        placeholder="Ví dụ: tủ bếp inox cánh kính"
                        className="w-full h-[38px] rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                </div>
                <div className="sm:col-span-5">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                        Search Intent (Ý định tìm kiếm)
                    </label>
                    <Select<SelectOption, false>
                        aria-label="Chọn Search Intent của từ khóa"
                        value={INTENT_OPTIONS.find((o) => o.value === searchIntent) || INTENT_OPTIONS[0]}
                        options={INTENT_OPTIONS}
                        onChange={(opt) =>
                            onChangeSearchIntent((opt?.value as SearchIntent) || "informational")
                        }
                        styles={cleanSelectStyles}
                        isSearchable={false}
                    />
                </div>
            </div>

            {/* Từ khóa phụ / LSI */}
            <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                    Từ khóa phụ / LSI (cách nhau dấu phẩy — bỏ trống để AI tự đề xuất thêm)
                </label>
                <input
                    type="text"
                    value={secondaryKeywordsText}
                    onChange={(e) => onChangeSecondaryKeywordsText(e.target.value)}
                    placeholder="Ví dụ: giá tủ bếp inox 304, ưu nhược điểm tủ bếp cánh kính..."
                    className="w-full h-[38px] rounded-lg border border-slate-300 px-3 text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-indigo-600"
                />
            </div>

            {/* Phân tích URL đối thủ Top Google bằng Rust Crawler */}
            <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                        <Globe className="h-4 w-4 text-indigo-600" />
                        <span>Phân tích bài Top đối thủ (Cào Heading H1–H3 không CORS)</span>
                    </div>
                    <button
                        type="button"
                        onClick={onCrawlCompetitors}
                        disabled={isCrawling || !competitorUrlsText.trim()}
                        aria-label="Cào cấu trúc Heading của các URL đối thủ"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 cursor-pointer"
                    >
                        {isCrawling ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <SearchCheck className="h-3.5 w-3.5" />
                        )}
                        <span>{isCrawling ? "Đang cào HTML..." : "Cào Heading ngay"}</span>
                    </button>
                </div>

                <textarea
                    rows={3}
                    value={competitorUrlsText}
                    onChange={(e) => onChangeCompetitorUrlsText(e.target.value)}
                    placeholder={"Dán tối đa 5 link đối thủ (mỗi dòng 1 link):\nhttps://doithu-1.vn/bai-viet-top-1\nhttps://doithu-2.vn/bai-viet-top-2"}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-mono text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />

                {competitors.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                            {competitors.map((comp) => (
                                <button
                                    key={comp.url}
                                    type="button"
                                    onClick={() =>
                                        setExpandedUrl(expandedUrl === comp.url ? null : comp.url)
                                    }
                                    aria-label={`Xem Heading đã cào từ ${comp.url}`}
                                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold border cursor-pointer ${
                                        comp.error
                                            ? "bg-rose-50 text-rose-800 border-rose-200"
                                            : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                    }`}
                                >
                                    {comp.error
                                        ? `✕ ${comp.url.slice(0, 32)}... (${comp.error})`
                                        : `✓ ${comp.url.replace(/^https?:\/\//, "").slice(0, 28)}: ${comp.headings.length} Heading • ${comp.word_count.toLocaleString("vi-VN")} từ`}
                                </button>
                            ))}
                        </div>

                        {expandedUrl && (
                            <div className="rounded-lg border border-slate-200 bg-white p-2.5 max-h-36 overflow-y-auto text-[11px] space-y-1">
                                {competitors
                                    .find((c) => c.url === expandedUrl)
                                    ?.headings.map((h, i) => (
                                        <div key={i} className="text-slate-700">
                                            <span className="font-bold uppercase text-indigo-700 mr-1.5">
                                                [{h.level}]
                                            </span>
                                            <span>{h.text}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Thanh chọn AI & Nút Tạo Dàn Ý */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            AI Phân tích & Lập dàn ý
                        </label>
                        <Select<SelectOption, false>
                            aria-label="Chọn nhà cung cấp AI tạo dàn ý"
                            value={PROVIDER_OPTIONS.find((o) => o.value === outlineProvider)}
                            options={PROVIDER_OPTIONS}
                            onChange={(opt) => {
                                const nextProv = (opt?.value as AiProvider) || "gemini";
                                onChangeOutlineProvider(nextProv);
                                onChangeOutlineModel(
                                    nextProv === "gemini"
                                        ? GEMINI_MODELS[0].value
                                        : CLAUDE_MODELS[0].value
                                );
                            }}
                            styles={cleanSelectStyles}
                            isSearchable={false}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Model thực thi
                        </label>
                        <Select<SelectOption, false>
                            aria-label="Chọn Model AI tạo dàn ý"
                            value={
                                modelOptions.find((o) => o.value === outlineModel) ||
                                modelOptions[0]
                            }
                            options={modelOptions}
                            onChange={(opt) => onChangeOutlineModel(String(opt?.value || ""))}
                            styles={cleanSelectStyles}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    {outlineProvider === "gemini" ? (
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useSearchGrounding}
                                onChange={(e) => onChangeUseSearchGrounding(e.target.checked)}
                                className="h-4 w-4 rounded accent-indigo-600"
                            />
                            <span>Bật Google Search Grounding (Cập nhật dữ liệu mới nhất)</span>
                        </label>
                    ) : (
                        <span className="text-xs text-slate-600">
                            Claude sẽ phân tích trực tiếp từ khóa & dữ liệu đối thủ đã cào.
                        </span>
                    )}

                    {isGenerating ? (
                        <button
                            type="button"
                            onClick={onStopGeneration}
                            aria-label="Dừng quá trình tạo dàn ý"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                        >
                            <Square className="h-3.5 w-3.5 fill-current" />
                            <span>Dừng tạo dàn ý</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onGenerateOutline}
                            disabled={!primaryKeyword.trim()}
                            aria-label="Gọi AI tạo dàn ý chuẩn SEO"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                        >
                            <Sparkles className="h-4 w-4" />
                            <span>Tạo Dàn Ý Chuẩn SEO</span>
                        </button>
                    )}
                </div>

                {isGenerating && streamPreview && (
                    <div className="rounded-xl border border-indigo-200 bg-slate-900 p-3 text-[11px] font-mono text-emerald-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                        {streamPreview}
                    </div>
                )}
            </div>
        </div>
    );
};
