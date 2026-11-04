import React from "react";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Coins,
    DollarSign,
    History,
} from "lucide-react";
import { MonthlySummary } from "../types";

interface MetricsCardsProps {
    summary: MonthlySummary | null;
    currencySymbol?: string;
}

/**
 * Hiển thị các thẻ chỉ số tài chính và dư nợ lũy kế trong tháng
 * Giao diện Sáng (Clean Light), độ tương phản cao, heading và text 1 dòng
 */
export const MetricsCards: React.FC<MetricsCardsProps> = ({
    summary,
    currencySymbol = "đ",
}) => {
    if (!summary) {
        return null;
    }

    const formatMoney = (amount: number) => {
        return amount.toLocaleString("vi-VN") + " " + currencySymbol;
    };

    const hasPrevDebt = summary.prev_debt_brought_forward > 0;
    const isPaidInFull = summary.total_due_remaining <= 0;

    return (
        <div className="space-y-4">
            {/* Banner cảnh báo dòng tiền dư nợ chuyển tiếp */}
            {hasPrevDebt && (
                <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-2.5 text-amber-900 shadow-2xs">
                    <div className="flex items-center space-x-2 truncate">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span className="text-xs font-medium whitespace-nowrap truncate">
                            Tháng trước tồn dư nợ{" "}
                            <strong className="text-amber-950 font-bold">
                                {formatMoney(summary.prev_debt_brought_forward)}
                            </strong>{" "}
                            chưa thanh toán, đã tự động cộng dồn vào tháng này!
                        </span>
                    </div>
                    <span className="hidden sm:inline-flex text-[11px] bg-amber-200/80 px-2 py-0.5 rounded text-amber-900 font-bold shrink-0 whitespace-nowrap">
                        Cộng dồn lũy kế
                    </span>
                </div>
            )}

            {/* 4 Thẻ chỉ số tài chính */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Nợ cũ chuyển sang */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition-shadow hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Nợ Cũ Kỳ Trước
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                            <History className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-amber-700 whitespace-nowrap truncate font-mono">
                            {formatMoney(summary.prev_debt_brought_forward)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 whitespace-nowrap truncate">
                            Chuyển tiếp từ các tháng trước
                        </p>
                    </div>
                </div>

                {/* 2. Tiền làm tháng này */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition-shadow hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Làm Trong Tháng
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-slate-900 whitespace-nowrap truncate font-mono">
                            {formatMoney(summary.current_month_earned)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 whitespace-nowrap truncate">
                            Tổng số giờ: <span className="font-bold text-indigo-700">{summary.total_hours.toLocaleString("vi-VN")} giờ</span>
                        </p>
                    </div>
                </div>

                {/* 3. Đã thanh toán trong tháng */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition-shadow hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            Đã Thanh Toán
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                            <Coins className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold text-emerald-700 whitespace-nowrap truncate font-mono">
                            {formatMoney(summary.current_month_paid)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 whitespace-nowrap truncate">
                            Khách đã chuyển khoản đợt này
                        </p>
                    </div>
                </div>

                {/* 4. Tổng cần thu hiện tại */}
                <div
                    className={`rounded-2xl border p-4.5 shadow-xs transition-all ${
                        isPaidInFull
                            ? "border-emerald-200 bg-emerald-50/60"
                            : "border-rose-200 bg-rose-50/50"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                            isPaidInFull ? "text-emerald-800" : "text-rose-800"
                        }`}>
                            Tổng Còn Phải Thu
                        </span>
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                                isPaidInFull
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-100 text-rose-700 border border-rose-200"
                            }`}
                        >
                            {isPaidInFull ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <DollarSign className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                    <div className="mt-3">
                        <div
                            className={`text-2xl font-black whitespace-nowrap truncate font-mono ${
                                isPaidInFull ? "text-emerald-700" : "text-rose-700"
                            }`}
                        >
                            {formatMoney(summary.total_due_remaining)}
                        </div>
                        <p className="mt-1 flex items-center space-x-1 text-xs whitespace-nowrap truncate">
                            {isPaidInFull ? (
                                <span className="text-emerald-700 font-bold whitespace-nowrap">Đã thanh toán đủ 🎉</span>
                            ) : (
                                <span className="flex items-center space-x-1 text-rose-700 font-bold whitespace-nowrap">
                                    <span>Tự chuyển sang tháng sau</span>
                                    <ArrowRight className="h-3 w-3 inline shrink-0" />
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Phân bổ theo từng dự án */}
            {summary.project_stats.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Phân bổ dự án:</span>
                    {summary.project_stats.map((proj) => (
                        <div
                            key={proj.project_id}
                            className="inline-flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 whitespace-nowrap shrink-0"
                        >
                            <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: proj.project_color }}
                            />
                            <span className="font-bold">{proj.project_name}</span>
                            <span className="text-slate-500">({proj.total_hours}h)</span>
                            <span className="font-bold text-indigo-700 font-mono">
                                {formatMoney(proj.total_amount)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
