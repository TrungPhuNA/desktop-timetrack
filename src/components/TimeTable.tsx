import React, { useState } from "react";
import Select from "react-select";
import {
    Check,
    Copy,
    Edit2,
    FileSpreadsheet,
    MessageSquareShare,
    Search,
    Trash2,
} from "lucide-react";
import { AppSettings, MonthlySummary, Project, TimeEntry } from "../types";
import { cleanSelectStyles, SelectOption } from "./selectStyles";

interface TimeTableProps {
    entries: TimeEntry[];
    projects: Project[];
    summary: MonthlySummary | null;
    settings: AppSettings | null;
    currentMonth: string;
    onEditEntry: (entry: TimeEntry) => void;
    onDeleteEntry: (id: number) => void;
    onDuplicateEntry: (entry: TimeEntry) => void;
    selectedProjectId: number | null;
    onSelectProject: (id: number | null) => void;
}

/**
 * Bảng dữ liệu chấm công chi tiết trong tháng
 * Giao diện Sáng (Clean Light), Input - Select - Buttons có CHIỀU CAO BẰNG NHAU (38px)
 */
export const TimeTable: React.FC<TimeTableProps> = ({
    entries,
    projects,
    summary,
    settings,
    currentMonth,
    onEditEntry,
    onDeleteEntry,
    onDuplicateEntry,
    selectedProjectId,
    onSelectProject,
}) => {
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [copiedInvoice, setCopiedInvoice] = useState<boolean>(false);
    const [copiedSheet, setCopiedSheet] = useState<boolean>(false);

    const currencySymbol = settings?.currency_symbol || "đ";

    const formatMoney = (amount: number) => {
        return amount.toLocaleString("vi-VN") + " " + currencySymbol;
    };

    // Lọc theo từ khóa ghi chú
    const filteredEntries = entries.filter((entry) => {
        if (!searchKeyword.trim()) return true;
        const kw = searchKeyword.toLowerCase();
        return (
            entry.note.toLowerCase().includes(kw) ||
            entry.project_name.toLowerCase().includes(kw) ||
            entry.time_range_display.toLowerCase().includes(kw)
        );
    });

    // React-Select Options cho bộ lọc dự án
    const projectFilterOptions: SelectOption[] = [
        { value: "all", label: "Tất cả dự án" },
        ...projects.map((p) => ({
            value: p.id,
            label: p.name,
            color: p.color,
        })),
    ];

    const currentFilterOption =
        projectFilterOptions.find((o) =>
            selectedProjectId === null ? o.value === "all" : o.value === selectedProjectId
        ) || projectFilterOptions[0];

    // Tiện ích 1: Sao chép nội dung Báo cáo gửi đối tác (Kèm công nợ lũy kế)
    const handleCopyInvoiceReport = async () => {
        if (!summary) return;
        const [year, month] = currentMonth.split("-");
        const monthTitle = `THÁNG ${parseInt(month, 10)}/${year}`;
        const targetProjectName =
            selectedProjectId !== null
                ? projects.find((p) => p.id === selectedProjectId)?.name || "Dự án"
                : "Tất cả dự án";

        const text = `BÁO CÁO GIỜ LÀM VIỆC & CÔNG NỢ - ${monthTitle}
Dự án: ${targetProjectName}
---------------------------------------------
1. Dư nợ cũ kỳ trước chuyển sang: ${formatMoney(summary.prev_debt_brought_forward)}
2. Tiền công phát sinh tháng này: ${formatMoney(summary.current_month_earned)} (${summary.total_hours.toLocaleString("vi-VN")} giờ)
3. Đã tạm ứng/thanh toán: -${formatMoney(summary.current_month_paid)}
---------------------------------------------
👉 TỔNG TIỀN CẦN THANH TOÁN: ${formatMoney(summary.total_due_remaining)}

Thông tin chuyển khoản:
- Ngân hàng: ${settings?.bank_name || "VPBank"}
- Số tài khoản: ${settings?.bank_account_no || "131325177"}
- Chủ tài khoản: ${settings?.bank_account_name || "PHAN TRUNG PHÚ"}`;

        await navigator.clipboard.writeText(text);
        setCopiedInvoice(true);
        setTimeout(() => setCopiedInvoice(false), 2000);
    };

    // Tiện ích 2: Sao chép bảng dữ liệu chuẩn để dán (Ctrl+V) vào Google Sheet
    const handleCopyForGoogleSheet = async () => {
        const rows = [
            ["TT", "Dự án", "Ngày", "Số giờ", "Thời gian", "Thành tiền", "Ghi chú"].join("\t"),
            ...filteredEntries.map((e, index) =>
                [
                    index + 1,
                    e.project_name,
                    e.work_date,
                    e.duration_hours.toString().replace(".", ","),
                    e.time_range_display,
                    formatMoney(e.total_amount),
                    e.note.replace(/\n/g, " "),
                ].join("\t")
            ),
        ];

        await navigator.clipboard.writeText(rows.join("\n"));
        setCopiedSheet(true);
        setTimeout(() => setCopiedSheet(false), 2000);
    };

    return (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            {/* Toolbar trên bảng: Search, Filter, Buttons CHIỀU CAO BẰNG NHAU = 38px */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 shrink-0">
                    {/* Ô tìm kiếm ghi chú (Chiều cao h-[38px]) */}
                    <div className="relative min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm công việc..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            className="h-[38px] w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors shadow-2xs"
                        />
                    </div>

                    {/* Bộ lọc dự án (React-Select Chiều cao h-[38px]) */}
                    <div className="min-w-[190px]">
                        <Select
                            options={projectFilterOptions}
                            value={currentFilterOption}
                            onChange={(opt) => {
                                if (!opt || opt.value === "all") {
                                    onSelectProject(null);
                                } else {
                                    onSelectProject(Number(opt.value));
                                }
                            }}
                            styles={cleanSelectStyles}
                            placeholder="Lọc dự án..."
                            isSearchable={false}
                            aria-label="Lọc danh sách theo dự án"
                        />
                    </div>
                </div>

                {/* Các nút sao chép tiện ích (Chiều cao h-[38px]) */}
                <div className="flex items-center space-x-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleCopyForGoogleSheet}
                        aria-label="Sao chép toàn bộ bảng dữ liệu để dán vào Google Sheet"
                        className="inline-flex h-[38px] items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                        {copiedSheet ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="text-emerald-700 font-bold whitespace-nowrap">Đã chép TSV!</span>
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span className="whitespace-nowrap">Copy dán Sheet</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleCopyInvoiceReport}
                        aria-label="Sao chép báo cáo chi tiết gửi khách hàng qua Zalo hoặc Telegram"
                        className="inline-flex h-[38px] items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap"
                    >
                        {copiedInvoice ? (
                            <>
                                <Check className="h-4 w-4 shrink-0" />
                                <span className="whitespace-nowrap">Đã chép Báo cáo!</span>
                            </>
                        ) : (
                            <>
                                <MessageSquareShare className="h-4 w-4 shrink-0" />
                                <span className="whitespace-nowrap">Copy Báo Cáo Khách</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Bảng Dữ liệu Sáng sủa, Sạch sẽ */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/90 uppercase tracking-wider text-slate-600 font-bold whitespace-nowrap">
                        <tr>
                            <th className="px-4 py-3 text-center w-12">TT</th>
                            <th className="px-4 py-3">Dự án</th>
                            <th className="px-4 py-3">Ngày</th>
                            <th className="px-4 py-3 text-right">Số giờ</th>
                            <th className="px-4 py-3">Thời gian</th>
                            <th className="px-4 py-3 text-right">Đơn giá/h</th>
                            <th className="px-4 py-3 text-right">Thành tiền</th>
                            <th className="px-4 py-3">Ghi chú</th>
                            <th className="px-4 py-3 text-center w-28">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-slate-400 whitespace-nowrap">
                                    Chưa có giờ làm việc nào trong tháng này. Bấm{" "}
                                    <strong className="text-indigo-600 font-bold">Thêm Giờ Làm</strong>{" "}
                                    để bắt đầu ghi nhận!
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map((entry, index) => (
                                <tr
                                    key={entry.id}
                                    className="hover:bg-indigo-50/40 transition-colors group"
                                >
                                    <td className="px-4 py-3 text-center font-mono text-slate-400 whitespace-nowrap">
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                                        <span
                                            className="inline-flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap"
                                            style={{
                                                backgroundColor: `${entry.project_color}15`,
                                                color: entry.project_color,
                                                borderColor: `${entry.project_color}30`,
                                                borderWidth: "1px",
                                            }}
                                        >
                                            <span
                                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                                style={{ backgroundColor: entry.project_color }}
                                            />
                                            <span>{entry.project_name}</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                                        {entry.work_date}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-indigo-700 font-mono whitespace-nowrap">
                                        {entry.duration_hours.toLocaleString("vi-VN")}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                        {entry.time_range_display || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-slate-500 whitespace-nowrap">
                                        {formatMoney(entry.hourly_rate)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold font-mono text-emerald-600 whitespace-nowrap">
                                        {formatMoney(entry.total_amount)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={entry.note}>
                                        {entry.note || <span className="text-slate-400 italic">Không có</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => onDuplicateEntry(entry)}
                                                aria-label="Nhân bản phiên làm việc này"
                                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                                                title="Nhân bản"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onEditEntry(entry)}
                                                aria-label="Chỉnh sửa phiên làm việc"
                                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors cursor-pointer"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteEntry(entry.id)}
                                                aria-label="Xóa phiên làm việc"
                                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
                                                title="Xóa"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
