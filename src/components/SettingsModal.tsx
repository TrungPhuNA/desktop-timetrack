import React, { useEffect, useState } from "react";
import { Check, Settings, X } from "lucide-react";
import { AppSettings, SaveSettingsInput } from "../types";
import { MoneyInput } from "./MoneyInput";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings | null;
    onSaveSettings: (input: SaveSettingsInput) => Promise<void>;
}

/**
 * Modal cấu hình thông tin thanh toán cá nhân và cài đặt ứng dụng
 * Giao diện Sáng (Clean Light), Input - Buttons có CHIỀU CAO BẰNG NHAU (40px)
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSaveSettings,
}) => {
    const [bankName, setBankName] = useState<string>("VPBank");
    const [bankAccountNo, setBankAccountNo] = useState<string>("131325177");
    const [bankAccountName, setBankAccountName] = useState<string>("PHAN TRUNG PHÚ");
    const [defaultHourlyRate, setDefaultHourlyRate] = useState<number>(220000);
    const [currencySymbol, setCurrencySymbol] = useState<string>("đ");
    const [enableDesktopNotify, setEnableDesktopNotify] = useState<boolean>(true);
    const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

    useEffect(() => {
        if (settings) {
            setBankName(settings.bank_name);
            setBankAccountNo(settings.bank_account_no);
            setBankAccountName(settings.bank_account_name);
            setDefaultHourlyRate(settings.default_hourly_rate);
            setCurrencySymbol(settings.currency_symbol);
            setEnableDesktopNotify(settings.enable_desktop_notify);
        }
    }, [settings]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSaveSettings({
            bank_name: bankName.trim(),
            bank_account_no: bankAccountNo.trim(),
            bank_account_name: bankAccountName.trim(),
            default_hourly_rate: defaultHourlyRate,
            currency_symbol: currencySymbol.trim(),
            enable_desktop_notify: enableDesktopNotify,
        });
        setSavedSuccess(true);
        setTimeout(() => {
            setSavedSuccess(false);
            onClose();
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5">
                    <div className="flex items-center space-x-2 shrink-0">
                        <Settings className="h-5 w-5 text-indigo-600 shrink-0" />
                        <h2 className="text-base font-bold text-slate-900 whitespace-nowrap">
                            Cài đặt & Tài khoản Thanh toán
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

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block whitespace-nowrap">
                            Thông tin thanh toán (Hiển thị trên báo cáo)
                        </span>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                Tên Ngân hàng
                            </label>
                            <input
                                type="text"
                                required
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Số tài khoản (STK)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={bankAccountNo}
                                    onChange={(e) => setBankAccountNo(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Tên chủ tài khoản
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={bankAccountName}
                                    onChange={(e) => setBankAccountName(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 uppercase font-bold focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block whitespace-nowrap">
                            Cấu hình tính giờ & Tiền tệ
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Đơn giá giờ mặc định ({currencySymbol})
                                </label>
                                <MoneyInput
                                    value={defaultHourlyRate}
                                    onChange={setDefaultHourlyRate}
                                    placeholder="220.000"
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 font-mono font-bold focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Ký hiệu tiền tệ
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={currencySymbol}
                                    onChange={(e) => setCurrencySymbol(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 text-center font-bold focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-lg border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="inline-flex h-10 items-center space-x-1.5 rounded-lg bg-indigo-600 px-5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap"
                        >
                            {savedSuccess ? (
                                <>
                                    <Check className="h-4 w-4 text-emerald-300" />
                                    <span>Đã Lưu!</span>
                                </>
                            ) : (
                                <span>Lưu Cài Đặt</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
