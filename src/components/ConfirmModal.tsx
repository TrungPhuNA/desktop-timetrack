import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Modal xác nhận hành động nguy hiểm
 * Giao diện Sáng (Clean Light), nút bấm có cursor-pointer và chiều cao h-10
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy bỏ",
    isDanger = true,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                isDanger
                                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                                    : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                        >
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 whitespace-nowrap">
                            {title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Đóng hộp thoại"
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                    {message}
                </p>

                <div className="mt-6 flex items-center justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-10 rounded-lg border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`h-10 rounded-lg px-5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer ${
                            isDanger
                                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
