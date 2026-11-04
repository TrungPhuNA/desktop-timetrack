import React, { useState } from "react";
import Select from "react-select";
import { Coins, Plus, Trash2, X } from "lucide-react";
import { CreatePaymentInput, Payment, Project } from "../types";
import { cleanSelectStyles, SelectOption } from "./selectStyles";
import { MoneyInput } from "./MoneyInput";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    payments: Payment[];
    projects: Project[];
    currencySymbol?: string;
    onSavePayment: (input: CreatePaymentInput) => Promise<void>;
    onDeletePayment: (id: number) => void;
}

/**
 * Modal ghi nhận khách chuyển khoản và theo dõi lịch sử thanh toán trong tháng
 * Giao diện Sáng (Clean Light), Input - Select - Buttons có CHIỀU CAO BẰNG NHAU (40px)
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    payments,
    projects,
    currencySymbol = "đ",
    onSavePayment,
    onDeletePayment,
}) => {
    const [projectId, setProjectId] = useState<number>(projects[0]?.id || 0);
    const [amount, setAmount] = useState<number>(1000000);
    const [paidDate, setPaidDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [note, setNote] = useState<string>("Khách chuyển khoản");

    if (!isOpen) return null;

    const formatMoney = (val: number) => {
        return val.toLocaleString("vi-VN") + " " + currencySymbol;
    };

    const projectOptions: SelectOption[] = projects.map((p) => ({
        value: p.id,
        label: p.name,
        color: p.color,
    }));

    const selectedOption = projectOptions.find((o) => o.value === projectId) || projectOptions[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0 || !projectId) return;

        await onSavePayment({
            project_id: projectId,
            amount,
            paid_date: paidDate,
            note,
        });

        // Reset
        setAmount(1000000);
        setNote("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5">
                    <div className="flex items-center space-x-2 shrink-0">
                        <Coins className="h-5 w-5 text-emerald-600 shrink-0" />
                        <h2 className="text-base font-bold text-slate-900 whitespace-nowrap">
                            Ghi nhận Thanh toán & Nhận tiền
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng cửa sổ"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Form thêm khoản thanh toán mới */}
                    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block whitespace-nowrap">
                            + Thêm khoản tiền khách vừa chuyển
                        </span>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                Dự án thanh toán
                            </label>
                            <Select
                                options={projectOptions}
                                value={selectedOption}
                                onChange={(opt) => opt && setProjectId(Number(opt.value))}
                                styles={cleanSelectStyles}
                                isSearchable
                                aria-label="Chọn dự án nhận tiền"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Số tiền ({currencySymbol})
                                </label>
                                <MoneyInput
                                    value={amount}
                                    onChange={setAmount}
                                    placeholder="1.000.000"
                                    required
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-emerald-700 font-mono font-bold focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Ngày nhận tiền
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={paidDate}
                                    onChange={(e) => setPaidDate(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                Ghi chú đợt thanh toán
                            </label>
                            <input
                                type="text"
                                placeholder="VD: Khách trả đợt 1, Ứng trước..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                            />
                        </div>

                        <button
                            type="submit"
                            className="inline-flex h-10 w-full items-center justify-center space-x-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Lưu Khoản Thanh Toán</span>
                        </button>
                    </form>

                    {/* Danh sách các khoản tiền đã nhận trong tháng */}
                    <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block whitespace-nowrap">
                            Các đợt đã thanh toán trong tháng ({payments.length})
                        </span>

                        <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                            {payments.length === 0 ? (
                                <p className="text-center py-4 text-xs text-slate-400 italic whitespace-nowrap">
                                    Tháng này khách chưa thanh toán đợt nào.
                                </p>
                            ) : (
                                payments.map((pay) => (
                                    <div
                                        key={pay.id}
                                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                                    >
                                        <div className="truncate mr-2">
                                            <div className="flex items-center space-x-2 whitespace-nowrap">
                                                <span className="font-bold text-slate-900">
                                                    {pay.project_name}
                                                </span>
                                                <span className="text-slate-500 font-mono text-[11px]">
                                                    {pay.paid_date}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-[11px] mt-0.5 truncate">
                                                {pay.note || "Không có ghi chú"}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-3 shrink-0">
                                            <span className="font-bold text-emerald-700 font-mono text-sm whitespace-nowrap">
                                                +{formatMoney(pay.amount)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => onDeletePayment(pay.id)}
                                                aria-label="Xóa đợt thanh toán này"
                                                className="rounded p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
