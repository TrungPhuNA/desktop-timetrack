import React, { useEffect, useState } from "react";
import { Globe, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { seoApi } from "../../services/seoApi";
import { SeoSite } from "../../types/seo";

interface SeoSiteModalProps {
    isOpen: boolean;
    sites: SeoSite[];
    onClose: () => void;
    onSaved: () => Promise<void>;
}

const SITE_COLORS = ["#4f46e5", "#0284c7", "#059669", "#d97706", "#dc2626", "#7c3aed"];

/**
 * Modal quản lý Hồ sơ Website (Brand Voice, Độc giả, CTA & Đồng bộ Sitemap Internal Link)
 */
export const SeoSiteModal: React.FC<SeoSiteModalProps> = ({
    isOpen,
    sites,
    onClose,
    onSaved,
}) => {
    const [editingId, setEditingId] = useState<number | undefined>(undefined);
    const [name, setName] = useState("");
    const [domain, setDomain] = useState("");
    const [niche, setNiche] = useState("");
    const [brandVoice, setBrandVoice] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [ctaTemplate, setCtaTemplate] = useState("");
    const [sitemapUrl, setSitemapUrl] = useState("");
    const [color, setColor] = useState(SITE_COLORS[0]);

    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const loadSiteIntoForm = (site?: SeoSite) => {
        setNotice(null);
        if (!site) {
            setEditingId(undefined);
            setName("");
            setDomain("");
            setNiche("");
            setBrandVoice("");
            setTargetAudience("");
            setCtaTemplate("");
            setSitemapUrl("");
            setColor(SITE_COLORS[0]);
            return;
        }
        setEditingId(site.id);
        setName(site.name);
        setDomain(site.domain);
        setNiche(site.niche);
        setBrandVoice(site.brand_voice);
        setTargetAudience(site.target_audience);
        setCtaTemplate(site.cta_template);
        setSitemapUrl(site.sitemap_url);
        setColor(site.color || SITE_COLORS[0]);
    };

    useEffect(() => {
        if (!isOpen) return;
        loadSiteIntoForm(sites[0]);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) {
            setNotice({ type: "err", text: "Vui lòng nhập Tên Website." });
            return;
        }
        setSaving(true);
        setNotice(null);
        try {
            const saved = await seoApi.saveSite({
                id: editingId,
                name: name.trim(),
                domain: domain.trim(),
                niche: niche.trim(),
                brand_voice: brandVoice,
                target_audience: targetAudience,
                cta_template: ctaTemplate,
                sitemap_url: sitemapUrl.trim(),
                color,
            });
            setEditingId(saved.id);
            await onSaved();
            setNotice({ type: "ok", text: `Đã lưu Website "${saved.name}".` });
        } catch (err) {
            setNotice({ type: "err", text: String(err) });
        } finally {
            setSaving(false);
        }
    };

    const handleSyncSitemap = async () => {
        if (!editingId) {
            setNotice({ type: "err", text: "Hãy bấm Lưu Website trước khi đồng bộ Sitemap." });
            return;
        }
        if (!sitemapUrl.trim()) {
            setNotice({ type: "err", text: "Vui lòng nhập đường dẫn Sitemap XML." });
            return;
        }
        setSyncing(true);
        setNotice(null);
        try {
            const count = await seoApi.syncSitemap(editingId, sitemapUrl.trim());
            await onSaved();
            setNotice({
                type: "ok",
                text: `Đã đồng bộ thành công ${count} Internal Link từ Sitemap! AI sẽ tự chèn các link này khi viết bài.`,
            });
        } catch (err) {
            setNotice({ type: "err", text: String(err) });
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await seoApi.deleteSite(id);
            await onSaved();
            loadSiteIntoForm(undefined);
            setNotice({ type: "ok", text: "Đã xóa Website." });
        } catch (err) {
            setNotice({ type: "err", text: String(err) });
        }
    };

    const activeSite = sites.find((s) => s.id === editingId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-indigo-600" />
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                Hồ Sơ Website & Brand Voice (Multi-Site SEO)
                            </h2>
                            <p className="text-xs text-slate-600">
                                Lưu giọng văn, đối tượng đọc và kho Internal Link riêng cho từng web của anh.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng cửa sổ quản lý Website"
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-12 max-h-[75vh]">
                    {/* Danh sách site bên trái */}
                    <div className="col-span-12 sm:col-span-4 border-r border-slate-200 bg-slate-50/70 p-3 space-y-2 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => loadSiteIntoForm(undefined)}
                            className="w-full inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Thêm Website Mới</span>
                        </button>

                        {sites.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => loadSiteIntoForm(s)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && loadSiteIntoForm(s)}
                                className={`flex items-center justify-between rounded-xl border p-2.5 text-xs cursor-pointer ${
                                    editingId === s.id
                                        ? "border-indigo-500 bg-white shadow-2xs"
                                        : "border-slate-200 bg-white/70 hover:bg-white"
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: s.color || "#4f46e5" }}
                                        />
                                        <span className="font-bold text-slate-900 truncate">{s.name}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 truncate">
                                        {s.internal_link_count} internal links
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(s.id);
                                    }}
                                    aria-label={`Xóa Website ${s.name}`}
                                    className="rounded p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Form chi tiết bên phải */}
                    <div className="col-span-12 sm:col-span-8 p-4 space-y-3 overflow-y-auto text-xs">
                        {notice && (
                            <div
                                className={`rounded-lg px-3 py-2 font-semibold ${
                                    notice.type === "ok"
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        : "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}
                            >
                                {notice.text}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Tên Website <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ví dụ: tilo.vn"
                                    className="w-full h-[36px] rounded-lg border border-slate-300 px-3 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Domain chính</label>
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="https://tilo.vn"
                                    className="w-full h-[36px] rounded-lg border border-slate-300 px-3"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-end">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Lĩnh vực (Niche)</label>
                                <input
                                    type="text"
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                    placeholder="Nội thất bếp, công nghệ..."
                                    className="w-full h-[36px] rounded-lg border border-slate-300 px-3"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Màu nhận diện</label>
                                <div className="flex items-center gap-2 h-[36px]">
                                    {SITE_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            aria-label={`Chọn màu ${c}`}
                                            className={`h-6 w-6 rounded-full cursor-pointer ${
                                                color === c ? "ring-2 ring-offset-2 ring-slate-900" : ""
                                            }`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Giọng văn & Quy tắc viết (Brand Voice)
                            </label>
                            <textarea
                                rows={3}
                                value={brandVoice}
                                onChange={(e) => setBrandVoice(e.target.value)}
                                placeholder="Ví dụ: Chuyên gia thực chiến, xưng chúng tôi/bạn, giải thích dễ hiểu, tránh sáo rỗng..."
                                className="w-full rounded-lg border border-slate-300 p-2.5"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    Độc giả mục tiêu
                                </label>
                                <input
                                    type="text"
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    placeholder="Chủ nhà chung cư, người tìm hiểu..."
                                    className="w-full h-[36px] rounded-lg border border-slate-300 px-3"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    CTA chuẩn cuối bài
                                </label>
                                <input
                                    type="text"
                                    value={ctaTemplate}
                                    onChange={(e) => setCtaTemplate(e.target.value)}
                                    placeholder="Liên hệ hotline để khảo sát miễn phí..."
                                    className="w-full h-[36px] rounded-lg border border-slate-300 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-slate-700 mb-1">
                                Link Sitemap XML (Đồng bộ Internal Link tự động)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={sitemapUrl}
                                    onChange={(e) => setSitemapUrl(e.target.value)}
                                    placeholder="https://domain.vn/post-sitemap.xml"
                                    className="flex-1 h-[36px] rounded-lg border border-slate-300 px-3 font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={handleSyncSitemap}
                                    disabled={syncing || !editingId}
                                    aria-label="Đồng bộ Internal Link từ Sitemap XML"
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 px-3 text-xs font-bold text-emerald-800 cursor-pointer"
                                >
                                    {syncing ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    )}
                                    <span>
                                        Đồng bộ ({activeSite?.internal_link_count ?? 0})
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                            >
                                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <span>{editingId ? "Cập Nhật Website" : "Tạo Website"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
