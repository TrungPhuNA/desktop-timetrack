import React, { useMemo, useState } from "react";
import Select from "react-select";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    Download,
    Plus,
    Search,
    Sparkles,
} from "lucide-react";
import { TaskStatus, WeeklyTask } from "../types";
import { WeeklyTaskRow } from "./WeeklyTaskRow";
import { cleanSelectStyles, SelectOption } from "./selectStyles";
import {
    exportTasksToExcelCsv,
    formatWeeklySummaryReport,
    isTaskInWeekView,
} from "../services/taskParser";

interface WeeklyTaskViewProps {
    currentMonth: string;
    onChangeMonth: (m: string) => void;
    tasks: WeeklyTask[];
    onRefresh: () => Promise<void>;
    onOpenCreateTask: (week: number) => void;
    onOpenBatchImport: (week: number) => void;
    onEditTask: (task: WeeklyTask) => void;
    onDeleteTask: (id: number, taskKey: string) => void;
    onUpdateStatus: (id: number, status: TaskStatus) => Promise<void>;
}

const STATUS_FILTER_OPTIONS: SelectOption[] = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "To do", label: "🟡 To do (Cần làm)" },
    { value: "In process", label: "🔵 In process (Đang làm)" },
    { value: "Dev testing", label: "🟠 Dev testing (Đang test)" },
    { value: "Deploy", label: "🟣 Deploy (Đang triển khai)" },
    { value: "Done", label: "🟢 Done (Hoàn thành)" },
    { value: "Close", label: "🔷 Close (Đã đóng)" },
    { value: "Reject", label: "🔴 Reject (Từ chối)" },
];

/**
 * Màn hình Quản Lý Task Công Ty Theo Tuần
 * Quản lý theo tuần 1..5 của tháng, lọc trạng thái/dự án, hiển thị deadline cảnh báo ĐỎ/VÀNG
 */
export const WeeklyTaskView: React.FC<WeeklyTaskViewProps> = ({
    currentMonth,
    onChangeMonth,
    tasks,
    onOpenCreateTask,
    onOpenBatchImport,
    onEditTask,
    onDeleteTask,
    onUpdateStatus,
}) => {
    const [selectedWeek, setSelectedWeek] = useState<number>(2);
    const [filterStatus, setFilterStatus] = useState<string>("ALL");
    const [filterCategory, setFilterCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [copiedReport, setCopiedReport] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportedExcel, setExportedExcel] = useState<boolean>(false);

    const handlePrevMonth = () => {
        const [year, month] = currentMonth.split("-").map(Number);
        const date = new Date(year, month - 2, 1);
        const newY = date.getFullYear();
        const newM = String(date.getMonth() + 1).padStart(2, "0");
        onChangeMonth(`${newY}-${newM}`);
    };
    const handleNextMonth = () => {
        const [year, month] = currentMonth.split("-").map(Number);
        const date = new Date(year, month, 1);
        const newY = date.getFullYear();
        const newM = String(date.getMonth() + 1).padStart(2, "0");
        onChangeMonth(`${newY}-${newM}`);
    };
    const displayMonthText = useMemo(() => {
        const [year, month] = currentMonth.split("-");
        return `Tháng ${month} - ${year}`;
    }, [currentMonth]);
    const categoryOptions = useMemo(() => {
        const cats = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)));
        return [
            { value: "ALL", label: "Tất cả dự án" },
            ...cats.map((c) => ({ value: c, label: c })),
        ];
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            if (!isTaskInWeekView(t, selectedWeek)) return false;
            if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
            if (filterCategory !== "ALL" && t.category !== filterCategory) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchKey = t.task_key.toLowerCase().includes(q);
                const matchTitle = t.title.toLowerCase().includes(q);
                const matchCat = t.category.toLowerCase().includes(q);
                if (!matchKey && !matchTitle && !matchCat) return false;
            }
            return true;
        });
    }, [tasks, selectedWeek, filterStatus, filterCategory, searchQuery]);

    const weekStats = useMemo(() => {
        const weekTasks = tasks.filter((t) => isTaskInWeekView(t, selectedWeek));
        const carriedOver = weekTasks.filter((t) => t.week_of_month < selectedWeek).length;
        return {
            total: weekTasks.length,
            carriedOver,
            done: weekTasks.filter((t) => t.status === "Done" || t.status === "Close").length,
            inProgress: weekTasks.filter(
                (t) => t.status === "In process" || t.status === "Dev testing" || t.status === "Deploy"
            ).length,
            todo: weekTasks.filter((t) => t.status === "To do").length,
        };
    }, [tasks, selectedWeek]);

    const handleOpenJiraLink = async (url: string) => {
        if (!url) return;
        try {
            await openUrl(url);
        } catch {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };
    const handleExportExcel = async () => {
        if (filteredTasks.length === 0) return;
        try {
            setIsExporting(true);
            const res = await exportTasksToExcelCsv(filteredTasks, currentMonth, selectedWeek);
            if (res.success) {
                setExportedExcel(true);
                setTimeout(() => setExportedExcel(false), 3000);
            }
        } catch (e) {
            console.error("Lỗi khi xuất file Excel:", e);
        } finally {
            setIsExporting(false);
        }
    };
    const handleCopyReport = async () => {
        const text = formatWeeklySummaryReport(filteredTasks, currentMonth, selectedWeek);
        try {
            await navigator.clipboard.writeText(text);
            setCopiedReport(true);
            setTimeout(() => setCopiedReport(false), 2500);
        } catch (e) {
            console.error("Không thể copy báo cáo:", e);
        }
    };

    return (
        <div className="space-y-4">
            {/* Thanh điều hướng Tuần & Tháng */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Month Switcher */}
                    <div className="flex h-9 items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            aria-label="Tháng trước"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="flex items-center space-x-1 px-2.5 text-xs font-bold text-slate-800 whitespace-nowrap">
                            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                            <span>{displayMonthText}</span>
                        </span>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            aria-label="Tháng sau"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* 5 Nút chọn Tuần 1, 2, 3, 4, 5 */}
                    <div className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 shadow-2xs">
                        {[1, 2, 3, 4, 5].map((w) => {
                            const isSelected = selectedWeek === w;
                            const countInWeek = tasks.filter((t) => isTaskInWeekView(t, w)).length;
                            return (
                                <button
                                    key={w}
                                    type="button"
                                    onClick={() => setSelectedWeek(w)}
                                    aria-label={`Chọn Tuần ${w}`}
                                    className={`inline-flex h-7 items-center space-x-1.5 px-3 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                        isSelected
                                            ? "bg-indigo-600 text-white shadow-2xs"
                                            : "text-slate-600 hover:bg-white hover:text-slate-900"
                                    }`}
                                >
                                    <span>Tuần {w}</span>
                                    <span
                                        className={`px-1 py-0.2 rounded-full text-[10px] ${
                                            isSelected
                                                ? "bg-indigo-700 text-indigo-100"
                                                : "bg-slate-200 text-slate-600"
                                        }`}
                                    >
                                        {countInWeek}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Các nút hành động */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCopyReport}
                        aria-label="Sao chép báo cáo tuần"
                        className="inline-flex h-9 items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                        {copiedReport ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Đã Chép Báo Cáo!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Copy Báo Cáo</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={isExporting || filteredTasks.length === 0}
                        aria-label="Xuất file Excel CSV"
                        className="inline-flex h-9 items-center space-x-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                        {exportedExcel ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Đã Lưu Vào Downloads!</span>
                            </>
                        ) : (
                            <>
                                <Download className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{isExporting ? "Đang xuất..." : "Xuất Excel"}</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenBatchImport(selectedWeek)}
                        aria-label="Nhập nhanh danh sách task"
                        className="inline-flex h-9 items-center space-x-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Nhập Nhanh</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenCreateTask(selectedWeek)}
                        aria-label="Thêm task mới"
                        className="inline-flex h-9 items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Thêm Task</span>
                    </button>
                </div>
            </div>

            {/* Thanh Bộ Lọc & Tìm Kiếm */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex-1 flex flex-wrap items-center gap-2.5">
                    <div className="relative min-w-[200px] flex-1 max-w-xs">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm mã task, tiêu đề..."
                            className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden"
                        />
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    </div>

                    <div className="w-48">
                        <Select
                            options={STATUS_FILTER_OPTIONS}
                            value={STATUS_FILTER_OPTIONS.find((o) => o.value === filterStatus)}
                            onChange={(val) => {
                                if (val) setFilterStatus(val.value as string);
                            }}
                            styles={cleanSelectStyles}
                            isSearchable={false}
                            aria-label="Lọc theo trạng thái"
                        />
                    </div>

                    <div className="w-44">
                        <Select
                            options={categoryOptions}
                            value={categoryOptions.find((o) => o.value === filterCategory) || categoryOptions[0]}
                            onChange={(val) => {
                                if (val) setFilterCategory(val.value as string);
                            }}
                            styles={cleanSelectStyles}
                            isSearchable={false}
                            aria-label="Lọc theo dự án"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500">Tổng: <strong>{weekStats.total}</strong></span>
                    {weekStats.carriedOver > 0 && (
                        <>
                            <span className="text-slate-300">|</span>
                            <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Tồn tuần trước: {weekStats.carriedOver}
                            </span>
                        </>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className="text-emerald-600 font-semibold">Done: {weekStats.done}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sky-600 font-semibold">Đang làm: {weekStats.inProgress}</span>
                </div>
            </div>

            {/* Bảng Danh Sách Task Tuần */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-600 uppercase tracking-wider">
                                <th className="py-3 px-3.5 w-12 text-center whitespace-nowrap">STT</th>
                                <th className="py-3 px-3.5 w-32 whitespace-nowrap">Mã Task</th>
                                <th className="py-3 px-3.5 w-24 whitespace-nowrap">Dự Án</th>
                                <th className="py-3 px-3.5 min-w-[260px]">Tiêu Đề Công Việc</th>
                                <th className="py-3 px-3.5 w-40 whitespace-nowrap">Hạn Chót</th>
                                <th className="py-3 px-3.5 w-36 whitespace-nowrap">Trạng Thái</th>
                                <th className="py-3 px-3.5 min-w-[120px]">Ghi Chú</th>
                                <th className="py-3 px-3.5 w-20 text-right whitespace-nowrap">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400 whitespace-nowrap">
                                        Chưa có task nào trong Tuần {selectedWeek} theo bộ lọc này. Bấm{" "}
                                        <button
                                            type="button"
                                            onClick={() => onOpenCreateTask(selectedWeek)}
                                            className="text-indigo-600 font-bold hover:underline cursor-pointer"
                                        >
                                            Thêm Task
                                        </button>{" "}
                                        hoặc{" "}
                                        <button
                                            type="button"
                                            onClick={() => onOpenBatchImport(selectedWeek)}
                                            className="text-indigo-600 font-bold hover:underline cursor-pointer"
                                        >
                                            Nhập Nhanh
                                        </button>{" "}
                                        để tạo ngay!
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task, idx) => (
                                    <WeeklyTaskRow
                                        key={task.id}
                                        task={task}
                                        index={idx}
                                        selectedWeek={selectedWeek}
                                        onOpenJiraLink={handleOpenJiraLink}
                                        onUpdateStatus={onUpdateStatus}
                                        onEditTask={onEditTask}
                                        onDeleteTask={onDeleteTask}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
