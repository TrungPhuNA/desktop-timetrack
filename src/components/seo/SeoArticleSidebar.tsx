import React, { useMemo } from "react";
import Select from "react-select";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { cleanSelectStyles, SelectOption } from "../selectStyles";
import { ARTICLE_STATUS_META, SeoArticle, SeoArticleStatus, SeoSite } from "../../types/seo";

interface SeoArticleSidebarProps {
    articles: SeoArticle[];
    sites: SeoSite[];
    selectedArticleId: number | null;
    filterSiteId: number | null;
    filterStatus: string;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onFilterSiteChange: (siteId: number | null) => void;
    onFilterStatusChange: (status: string) => void;
    onSelectArticle: (article: SeoArticle) => void;
    onCreateNew: () => void;
    onDeleteArticle: (article: SeoArticle) => void;
}

/**
 * Cột trái SEO Studio: Tìm kiếm, lọc theo Website/Trạng thái và danh sách bài viết
 */
export const SeoArticleSidebar: React.FC<SeoArticleSidebarProps> = ({
    articles,
    sites,
    selectedArticleId,
    filterSiteId,
    filterStatus,
    searchQuery,
    onSearchChange,
    onFilterSiteChange,
    onFilterStatusChange,
    onSelectArticle,
    onCreateNew,
    onDeleteArticle,
}) => {
    const siteOptions: SelectOption[] = useMemo(() => {
        return [
            { value: "all", label: "Site: Tất cả" },
            ...sites.map((s) => ({ value: s.id, label: s.name })),
        ];
    }, [sites]);

    const statusOptions: SelectOption[] = useMemo(
        () => [
            { value: "", label: "TT: Tất cả" },
            { value: "draft", label: "Bản nháp" },
            { value: "outlined", label: "Đã có Outline" },
            { value: "writing", label: "Đang viết" },
            { value: "review", label: "Đang duyệt" },
            { value: "published", label: "Hoàn tất" },
        ],
        []
    );

    const selectedSiteOption =
        siteOptions.find((o) => o.value === (filterSiteId ?? "all")) || siteOptions[0];
    const selectedStatusOption =
        statusOptions.find((o) => o.value === filterStatus) || statusOptions[0];

    return (
        <aside className="col-span-12 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col gap-3 lg:max-h-[calc(100vh-220px)]">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Bài viết SEO ({articles.length})
                </h2>
                <button
                    type="button"
                    onClick={onCreateNew}
                    aria-label="Tạo bài viết SEO mới"
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Bài mới</span>
                </button>
            </div>

            {/* Ô tìm kiếm từ khóa / tiêu đề */}
            <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Tìm từ khóa, tiêu đề bài..."
                    aria-label="Tìm kiếm bài viết SEO theo từ khóa hoặc tiêu đề"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
            </div>

            {/* Bộ lọc Website & Trạng thái bằng react-select */}
            <div className="grid grid-cols-2 gap-2">
                <Select<SelectOption, false>
                    aria-label="Lọc bài viết theo Website"
                    value={selectedSiteOption}
                    options={siteOptions}
                    onChange={(opt) => {
                        if (!opt || opt.value === "all") {
                            onFilterSiteChange(null);
                        } else {
                            onFilterSiteChange(Number(opt.value));
                        }
                    }}
                    styles={cleanSelectStyles}
                    isSearchable={false}
                />
                <Select<SelectOption, false>
                    aria-label="Lọc bài viết theo trạng thái"
                    value={selectedStatusOption}
                    options={statusOptions}
                    onChange={(opt) => onFilterStatusChange(String(opt?.value ?? ""))}
                    styles={cleanSelectStyles}
                    isSearchable={false}
                />
            </div>

            {/* Danh sách bài viết */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {articles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-2">
                        <FileText className="h-7 w-7 text-slate-500 mx-auto" />
                        <p className="text-xs font-medium text-slate-600">
                            Chưa có bài viết nào. Bấm <strong>Bài mới</strong> để bắt đầu nghiên cứu từ khóa.
                        </p>
                    </div>
                ) : (
                    articles.map((art) => {
                        const isSelected = art.id === selectedArticleId;
                        const statusMeta =
                            ARTICLE_STATUS_META[art.status as SeoArticleStatus] ||
                            ARTICLE_STATUS_META.draft;
                        const scoreBadgeClass =
                            art.seo_score >= 80
                                ? "bg-emerald-100 text-emerald-800"
                                : art.seo_score >= 50
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700";

                        return (
                            <div
                                key={art.id}
                                onClick={() => onSelectArticle(art)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        onSelectArticle(art);
                                    }
                                }}
                                aria-label={`Mở bài viết ${art.title || art.primary_keyword}`}
                                className={`group rounded-xl border p-2.5 transition-all cursor-pointer ${
                                    isSelected
                                        ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/30"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                    <span
                                        className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white truncate max-w-[115px]"
                                        style={{ backgroundColor: art.site_color || "#4f46e5" }}
                                    >
                                        {art.site_name || "Chung"}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreBadgeClass}`}>
                                            SEO {art.seo_score}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteArticle(art);
                                            }}
                                            aria-label={`Xóa bài viết ${art.title || art.primary_keyword}`}
                                            className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                                    {art.title || art.primary_keyword}
                                </p>

                                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600">
                                    <span>{art.word_count.toLocaleString("vi-VN")} từ</span>
                                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusMeta.bgClass} ${statusMeta.textClass}`}>
                                        {statusMeta.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );
};
