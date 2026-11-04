import React, { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, DollarSign, Wallet, X } from "lucide-react";
import { api } from "../services/api";
import { ProjectDebtItem } from "../types";

interface DebtModalProps {
    isOpen: boolean;
    onClose: () => void;
    currencySymbol?: string;
}

/**
 * Modal hiển thị Sổ theo dõi Công nợ Lũy kế toàn thời gian theo từng dự án
 * Giao diện Sáng (Clean Light), Kích thước RỘNG RÃI (max-w-4xl), hiển thị thoáng đãng
 */
export const DebtModal: React.FC<DebtModalProps> = ({
    isOpen,
    onClose,
    currencySymbol = "đ",
}) => {
    const [debtList, setDebtList] = useState<ProjectDebtItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const loadDebtData = async () => {
        try {
            setLoading(true);
            const data = await api.getProjectDebtSummary();
            setDebtList(data);
        } catch (error) {
            console.error("Lỗi tải danh sách công nợ:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadDebtData();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatMoney = (val: number) => {
        return val.toLocaleString("vi-VN") + " " + currencySymbol;
    };

    const totalAllEarned = debtList.reduce((acc, curr) => acc + curr.total_earned_all_time, 0);
    const totalAllPaid = debtList.reduce((acc, curr) => acc + curr.total_paid_all_time, 0);
    const totalAllDebt = debtList.reduce((acc, curr) => acc + curr.balance_due, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 sm:p-6 backdrop-blur-xs animate-fadeIn overflow-y-auto">
            <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto">
                {/* Header Modal - Rộng rãi, thoáng mắt */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
                    <div className="flex items-center space-x-3 shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs shrink-0">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2.5">
                                <h2 className="text-base font-bold text-slate-900 whitespace-nowrap">
                                    Sổ Theo Dõi Công Nợ Khách Hàng
                                </h2>
                                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200 whitespace-nowrap">
                                    Toàn Thời Gian
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 whitespace-nowrap mt-0.5">
                                Dư nợ cộng dồn liên tục qua các tháng - Tự động đối soát thu chi
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng cửa sổ"
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* 3 Thẻ tóm tắt dòng tiền toàn thời gian */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* 1. Tổng tiền đã làm */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                                    Tổng Đã Làm (All-Time)
                                </span>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    <Wallet className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-2 text-xl font-bold text-slate-900 font-mono whitespace-nowrap">
                                {formatMoney(totalAllEarned)}
                            </div>
                        </div>

                        {/* 2. Khách đã thanh toán */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 whitespace-nowrap">
                                    Đã Thanh Toán (All-Time)
                                </span>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-2 text-xl font-bold text-emerald-700 font-mono whitespace-nowrap">
                                {formatMoney(totalAllPaid)}
                            </div>
                        </div>

                        {/* 3. Tổng dư nợ còn lại */}
                        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 whitespace-nowrap">
                                    Tổng Dư Nợ Đang Nợ
                                </span>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-2 text-2xl font-black text-amber-700 font-mono whitespace-nowrap">
                                {formatMoney(totalAllDebt)}
                            </div>
                        </div>
                    </div>

                    {/* Bảng chi tiết công nợ từng dự án - Rộng rãi, thoáng mắt */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50/90 uppercase tracking-wider text-slate-600 font-bold whitespace-nowrap">
                                <tr>
                                    <th className="px-5 py-3.5 text-center w-12">TT</th>
                                    <th className="px-5 py-3.5">Dự Án / Khách Hàng</th>
                                    <th className="px-5 py-3.5 text-right">Tổng Tiền Đã Làm</th>
                                    <th className="px-5 py-3.5 text-right">Đã Thanh Toán</th>
                                    <th className="px-5 py-3.5 text-right">Dư Nợ Còn Lại</th>
                                    <th className="px-5 py-3.5 text-center w-36">Tình Trạng Nợ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 whitespace-nowrap">
                                            Đang tính toán dòng tiền công nợ...
                                        </td>
                                    </tr>
                                ) : debtList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 whitespace-nowrap">
                                            Chưa có dự án nào ghi nhận công việc.
                                        </td>
                                    </tr>
                                ) : (
                                    debtList.map((item, index) => {
                                        const isClear = item.balance_due <= 0;
                                        return (
                                            <tr key={item.project_id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-5 py-3.5 text-center font-mono text-slate-400 whitespace-nowrap">
                                                    {index + 1}
                                                </td>
                                                <td className="px-5 py-3.5 font-bold whitespace-nowrap">
                                                    <span className="inline-flex items-center space-x-2.5">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: item.project_color }}
                                                        />
                                                        <span className="text-sm text-slate-900">{item.project_name}</span>
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono text-slate-600 text-xs whitespace-nowrap">
                                                    {formatMoney(item.total_earned_all_time)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono text-emerald-600 font-bold text-xs whitespace-nowrap">
                                                    {formatMoney(item.total_paid_all_time)}
                                                </td>
                                                <td
                                                    className={`px-5 py-3.5 text-right font-mono font-bold whitespace-nowrap ${
                                                        isClear ? "text-slate-400 text-xs" : "text-rose-600 text-sm"
                                                    }`}
                                                >
                                                    {formatMoney(item.balance_due)}
                                                </td>
                                                <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                                    {isClear ? (
                                                        <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                                            <span>Đã thanh toán đủ</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700 border border-rose-200">
                                                            Đang nợ dồn
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50/70 px-6 py-3.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        Đóng Sổ Công Nợ
                    </button>
                </div>
            </div>
        </div>
    );
};
