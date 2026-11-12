import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Calendar, Check, Clock, ExternalLink, Hash, Tag, X } from "lucide-react";
import {
    CreateWeeklyTaskInput,
    TaskStatus,
    UpdateWeeklyTaskInput,
    WeeklyTask,
} from "../types";
import { cleanSelectStyles, SelectOption } from "./selectStyles";
import { extractCategoryFromTitle, normalizeJiraUrl } from "../services/taskParser";

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTask: WeeklyTask | null;
    currentMonth: string;
    currentWeek: number;
    onSaveCreate: (input: CreateWeeklyTaskInput) => Promise<void>;
    onSaveUpdate: (input: UpdateWeeklyTaskInput) => Promise<void>;
}

const STATUS_OPTIONS: SelectOption[] = [
    { value: "To do", label: "🟡 To do (Cần làm)" },
    { value: "In process", label: "🔵 In process (Đang làm)" },
    { value: "Dev testing", label: "🟠 Dev testing (Đang test dev)" },
    { value: "Deploy", label: "🟣 Deploy (Đang triển khai)" },
    { value: "Done", label: "🟢 Done (Hoàn thành)" },
    { value: "Close", label: "🔷 Close (Đóng task)" },
    { value: "Reject", label: "🔴 Reject (Từ chối / Hủy)" },
];

const PRIORITY_OPTIONS: SelectOption[] = [
    { value: "HIGH", label: "🔥 Ưu tiên cao (High)" },
    { value: "NORMAL", label: "⚡ Bình thường (Normal)" },
    { value: "LOW", label: "💤 Ưu tiên thấp (Low)" },
];

const WEEK_OPTIONS: SelectOption[] = [
    { value: 1, label: "Tuần 1" },
    { value: 2, label: "Tuần 2" },
    { value: 3, label: "Tuần 3" },
    { value: 4, label: "Tuần 4" },
    { value: 5, label: "Tuần 5" },
];

const MONTH_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: `Tháng ${i + 1}`,
}));

const YEAR_OPTIONS: SelectOption[] = [
    { value: "2025", label: "Năm 2025" },
    { value: "2026", label: "Năm 2026" },
    { value: "2027", label: "Năm 2027" },
];

/**
 * Modal Thêm Mới hoặc Chỉnh Sửa Task Công Ty Theo Tuần
 * Kích thước to rộng (max-w-4xl), chọn Tháng & Năm trực quan qua react-select
 * Hỗ trợ chọn Deadline ngày giờ chi tiết và các phím tắt chọn nhanh
 */
export const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    editingTask,
    currentMonth,
    currentWeek,
    onSaveCreate,
    onSaveUpdate,
}) => {
    const [selectedYear, setSelectedYear] = useState<string>("2026");
    const [selectedMonth, setSelectedMonth] = useState<string>("11");
    const [weekOfMonth, setWeekOfMonth] = useState<number>(currentWeek);

    const [taskKey, setTaskKey] = useState<string>("");
    const [taskUrl, setTaskUrl] = useState<string>("");
    const [title, setTitle] = useState<string>("");
    const [category, setCategory] = useState<string>("ATOS");
    const [status, setStatus] = useState<TaskStatus>("To do");
    const [priority, setPriority] = useState<"HIGH" | "NORMAL" | "LOW">("NORMAL");
    const [deadline, setDeadline] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        if (editingTask) {
            const parts = (editingTask.month || currentMonth).split("-");
            setSelectedYear(parts[0] || "2026");
            setSelectedMonth(parts[1] || "11");
            setWeekOfMonth(editingTask.week_of_month);
            setTaskKey(editingTask.task_key);
            setTaskUrl(editingTask.task_url);
            setTitle(editingTask.title);
            setCategory(editingTask.category);
            setStatus(editingTask.status);
            setPriority(editingTask.priority);
            setDeadline(editingTask.deadline || "");
            setNote(editingTask.note);
        } else {
            const parts = (currentMonth || "2026-11").split("-");
            setSelectedYear(parts[0] || "2026");
            setSelectedMonth(parts[1] || "11");
            setWeekOfMonth(currentWeek);
            setTaskKey("");
            setTaskUrl("");
            setTitle("");
            setCategory("ATOS");
            setStatus("To do");
            setPriority("NORMAL");
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 2);
            defaultDate.setHours(18, 0, 0, 0);
            const isoStr = `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, "0")}-${String(defaultDate.getDate()).padStart(2, "0")}T18:00`;
            setDeadline(isoStr);
            setNote("");
        }
    }, [editingTask, currentMonth, currentWeek, isOpen]);

    if (!isOpen) return null;

    const handleKeyChange = (val: string) => {
        setTaskKey(val);
        const { url } = normalizeJiraUrl(val);
        setTaskUrl(url);
    };

    const handleUrlChange = (val: string) => {
        setTaskUrl(val);
        const { key } = normalizeJiraUrl(val);
        if (key && key !== "TASK") setTaskKey(key);
    };

    const handleTitleChange = (val: string) => {
        setTitle(val);
        if (!editingTask) {
            const detectedCat = extractCategoryFromTitle(val);
            if (detectedCat && detectedCat !== "CHUNG") setCategory(detectedCat);
        }
    };

    const setQuickDeadline = (type: "today" | "tomorrow" | "friday") => {
        const d = new Date();
        if (type === "today") {
            d.setHours(18, 0, 0, 0);
        } else if (type === "tomorrow") {
            d.setDate(d.getDate() + 1);
            d.setHours(18, 0, 0, 0);
        } else if (type === "friday") {
            const day = d.getDay();
            const diffToFriday = (5 - day + 7) % 7 || 7;
            d.setDate(d.getDate() + diffToFriday);
            d.setHours(18, 0, 0, 0);
        }
        const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T18:00`;
        setDeadline(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            const combinedMonth = `${selectedYear}-${selectedMonth}`;
            const trimmedKey = taskKey.trim() || "TASK";
            const trimmedUrl = taskUrl.trim() || normalizeJiraUrl(trimmedKey).url;

            if (editingTask) {
                await onSaveUpdate({
                    id: editingTask.id,
                    month: combinedMonth,
                    week_of_month: weekOfMonth,
                    task_key: trimmedKey,
                    task_url: trimmedUrl,
                    title: title.trim(),
                    category: category.trim() || "CHUNG",
                    status,
                    priority,
                    deadline: deadline.trim(),
                    note: note.trim(),
                });
            } else {
                await onSaveCreate({
                    month: combinedMonth,
                    week_of_month: weekOfMonth,
                    task_key: trimmedKey,
                    task_url: trimmedUrl,
                    title: title.trim(),
                    category: category.trim() || "CHUNG",
                    status,
                    priority,
                    deadline: deadline.trim(),
                    note: note.trim(),
                });
            }
            onClose();
        } catch (error) {
            console.error("Lỗi khi lưu task:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const currentStatusOption = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
    const currentPriorityOption = PRIORITY_OPTIONS.find((o) => o.value === priority) || PRIORITY_OPTIONS[1];
    const currentWeekOption = WEEK_OPTIONS.find((o) => o.value === weekOfMonth) || WEEK_OPTIONS[0];
    const currentMonthOption = MONTH_OPTIONS.find((o) => o.value === selectedMonth) || MONTH_OPTIONS[10];
    const currentYearOption = YEAR_OPTIONS.find((o) => o.value === selectedYear) || YEAR_OPTIONS[1];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70 shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                {editingTask ? `Cập Nhật Task: ${editingTask.task_key}` : "Thêm Task Công Ty Mới"}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                Quản lý tiến độ công việc • Tuần {weekOfMonth} (Tháng {selectedMonth}/{selectedYear})
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng modal"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <Calendar className="h-4 w-4 text-indigo-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Kỳ Báo Cáo Công Việc *
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Tháng *</label>
                                <Select
                                    options={MONTH_OPTIONS}
                                    value={currentMonthOption}
                                    onChange={(val) => {
                                        if (val) setSelectedMonth(String(val.value));
                                    }}
                                    styles={cleanSelectStyles}
                                    isSearchable={false}
                                    aria-label="Chọn tháng làm việc"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Năm *</label>
                                <Select
                                    options={YEAR_OPTIONS}
                                    value={currentYearOption}
                                    onChange={(val) => {
                                        if (val) setSelectedYear(String(val.value));
                                    }}
                                    styles={cleanSelectStyles}
                                    isSearchable={false}
                                    aria-label="Chọn năm làm việc"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Tuần trong tháng *</label>
                                <Select
                                    options={WEEK_OPTIONS}
                                    value={currentWeekOption}
                                    onChange={(val) => {
                                        if (val) setWeekOfMonth(Number(val.value));
                                    }}
                                    styles={cleanSelectStyles}
                                    isSearchable={false}
                                    aria-label="Chọn tuần trong tháng"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                                Mã Task Jira * (VD: DEV-9000, ONEAT-5289)
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={taskKey}
                                    onChange={(e) => handleKeyChange(e.target.value)}
                                    placeholder="VD: DEV-9000"
                                    className="w-full h-10 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm font-bold text-indigo-700 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden shadow-2xs"
                                />
                                <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                                Link Jira (Tự động sinh hoặc dán link)
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={taskUrl}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    placeholder="https://interspacevn.atlassian.net/browse/..."
                                    className="w-full h-10 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs font-medium text-slate-700 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden shadow-2xs truncate"
                                />
                                <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                            Tiêu đề công việc *
                        </label>
                        <textarea
                            required
                            rows={2}
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="VD: [DEV] [ATOS][M1.5] Dashboard quản trị vận hành – Xây dựng Dashboard..."
                            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden shadow-2xs resize-none"
                        />
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                                <Clock className="h-4 w-4 text-indigo-600" />
                                <span>Hạn Chót Hoàn Thành (Deadline Ngày & Giờ) *</span>
                            </label>
                            <div className="flex items-center space-x-1.5">
                                <span className="text-[11px] text-slate-500 font-medium mr-1">Chọn nhanh:</span>
                                <button
                                    type="button"
                                    onClick={() => setQuickDeadline("today")}
                                    aria-label="Chọn hôm nay 18:00"
                                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
                                >
                                    Hôm nay 18h
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickDeadline("tomorrow")}
                                    aria-label="Chọn ngày mai 18:00"
                                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
                                >
                                    Ngày mai 18h
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuickDeadline("friday")}
                                    aria-label="Chọn thứ 6 18:00"
                                    className="rounded-md border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer"
                                >
                                    Thứ 6 tuần này
                                </button>
                            </div>
                        </div>
                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden shadow-2xs"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                            💡 Hệ thống sẽ tự động cảnh báo <strong className="text-rose-600">ĐỎ</strong> khi quá hạn và <strong className="text-amber-600">VÀNG</strong> khi còn dưới 24h.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                                Dự án / Tag (VD: ATOS, MGM)
                            </label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value.toUpperCase())}
                                placeholder="VD: ATOS"
                                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden shadow-2xs"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                                Trạng thái hiện tại *
                            </label>
                            <Select
                                options={STATUS_OPTIONS}
                                value={currentStatusOption}
                                onChange={(val) => {
                                    if (val) setStatus(val.value as TaskStatus);
                                }}
                                styles={cleanSelectStyles}
                                isSearchable={false}
                                aria-label="Chọn trạng thái task"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                                Mức độ ưu tiên
                            </label>
                            <Select
                                options={PRIORITY_OPTIONS}
                                value={currentPriorityOption}
                                onChange={(val) => {
                                    if (val) setPriority(val.value as "HIGH" | "NORMAL" | "LOW");
                                }}
                                styles={cleanSelectStyles}
                                isSearchable={false}
                                aria-label="Chọn độ ưu tiên"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                            Ghi chú cá nhân (Giải pháp, PR link, Commit...)
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ghi chú thêm giải pháp xử lý hoặc link PR..."
                            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden shadow-2xs"
                        />
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Hủy thao tác"
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                        >
                            Hủy Bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            aria-label="Lưu task công việc"
                            className="inline-flex h-10 items-center justify-center space-x-1.5 rounded-lg bg-indigo-600 px-7 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                            <span>{isSaving ? "Đang lưu..." : editingTask ? "Cập Nhật Task" : "Tạo Mới Task"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
