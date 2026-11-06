import React, { useEffect, useState } from "react";
import { VolumeX, CheckCircle, BellRing, X } from "lucide-react";

interface FocusAlertBannerProps {
    message: string;
    onDismiss: () => void;
    autoCloseSeconds?: number;
}

/**
 * Modal Cảnh Báo "Im Lặng Làm Việc" Nổi Bật
 * Rung lắc 2 bên liên tục (Continuous Horizontal Shake) để thu hút sự chú ý tuyệt đối
 */
export const FocusAlertBanner: React.FC<FocusAlertBannerProps> = ({
    message,
    onDismiss,
    autoCloseSeconds = 15,
}) => {
    const [timeLeft, setTimeLeft] = useState<number>(autoCloseSeconds);

    // Đếm ngược tự động đóng sau autoCloseSeconds
    useEffect(() => {
        if (timeLeft <= 0) {
            onDismiss();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onDismiss]);

    // Hỗ trợ phím Escape / Enter / Space để tắt nhanh
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDismiss();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onDismiss]);

    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-live="assertive"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
        >
            {/* Hộp thoại Modal rung lắc 2 bên liên tục */}
            <div className="relative w-full max-w-md rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-2xl animate-shake-continuous overflow-hidden">
                {/* Nút đóng nhanh góc phải */}
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Đóng cửa sổ cảnh báo"
                    className="absolute top-3.5 right-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    {/* Icon rung chuông nổi bật */}
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-lg shadow-indigo-600/40 ring-4 ring-indigo-100 mb-4 animate-bounce">
                        <VolumeX className="h-8 w-8" />
                    </div>

                    {/* Tag badge */}
                    <span className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                        <BellRing className="h-3.5 w-3.5 text-indigo-600" />
                        <span>NHẮC NHỞ TẬP TRUNG</span>
                    </span>

                    {/* Tiêu đề thông điệp */}
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
                        🤫 {message}
                    </h2>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-xs">
                        Đã đến chu kỳ nhắc nhở định kỳ. Hãy giữ không gian yên lặng, tập trung cao độ để bứt phá năng suất!
                    </p>

                    {/* Nút hành động xác nhận đã hiểu */}
                    <div className="mt-6 w-full space-y-2">
                        <button
                            type="button"
                            onClick={onDismiss}
                            aria-label="Đã hiểu và tiếp tục làm việc"
                            className="inline-flex h-11 w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-700 hover:to-violet-700 transition-all cursor-pointer"
                        >
                            <CheckCircle className="h-4 w-4" />
                            <span>ĐÃ HIỂU - TIẾP TỤC LÀM VIỆC</span>
                        </button>
                        <span className="block text-[11px] text-slate-400">
                            Tự động đóng sau {timeLeft}s hoặc bấm Enter / Space
                        </span>
                    </div>
                </div>

                {/* Thanh tiến trình đếm ngược dưới đáy */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${(timeLeft / autoCloseSeconds) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
