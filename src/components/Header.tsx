import React from "react";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    FolderKanban,
    Plus,
    Settings,
    Timer,
    VolumeX,
} from "lucide-react";

interface HeaderProps {
    currentMonth: string; // YYYY-MM
    onChangeMonth: (newMonth: string) => void;
    onOpenCreateEntry: () => void;
    onOpenPaymentModal: () => void;
    onOpenProjectModal: () => void;
    onOpenDebtModal: () => void;
    onOpenSettingsModal: () => void;
    onOpenFocusModal: () => void;
    isFocusEnabled?: boolean;
}

/**
 * Header chính của ứng dụng TimeTrack
 * Giao diện Sáng (Clean Light), các nút có chiều cao đồng nhất h-9 (36px), chữ 1 dòng
 * Icon nhận diện thương hiệu Timer Stopwatch chuẩn chuyên ngành Time Tracking
 */
export const Header: React.FC<HeaderProps> = ({
    currentMonth,
    onChangeMonth,
    onOpenCreateEntry,
    onOpenPaymentModal,
    onOpenProjectModal,
    onOpenDebtModal,
    onOpenSettingsModal,
    onOpenFocusModal,
    isFocusEnabled = true,
}) => {
    // Chuyển lùi 1 tháng
    const handlePrevMonth = () => {
        const [year, month] = currentMonth.split("-").map(Number);
        const date = new Date(year, month - 2, 1);
        const newY = date.getFullYear();
        const newM = String(date.getMonth() + 1).padStart(2, "0");
        onChangeMonth(`${newY}-${newM}`);
    };

    // Chuyển tiến 1 tháng
    const handleNextMonth = () => {
        const [year, month] = currentMonth.split("-").map(Number);
        const date = new Date(year, month, 1);
        const newY = date.getFullYear();
        const newM = String(date.getMonth() + 1).padStart(2, "0");
        onChangeMonth(`${newY}-${newM}`);
    };

    // Format hiển thị: "Tháng 10 - 2026"
    const [yearStr, monthStr] = currentMonth.split("-");
    const displayMonthText = `Tháng ${parseInt(monthStr, 10)} - ${yearStr}`;

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3 shadow-xs">
            <div className="flex items-center justify-between gap-4">
                {/* Logo & Tên ứng dụng */}
                <div className="flex items-center space-x-3 shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 shadow-md shadow-indigo-500/25 shrink-0">
                        <Timer className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center space-x-2.5">
                        <h1 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                            TimeTrack
                        </h1>
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200 whitespace-nowrap">
                            Freelance Pro
                        </span>
                        <span className="hidden xl:inline text-xs text-slate-500 whitespace-nowrap">
                            • Quản lý giờ làm & Dư nợ lũy kế
                        </span>
                    </div>
                </div>

                {/* Bộ chọn Tháng (Month Switcher - Chiều cao cố định h-9) */}
                <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-1 shadow-2xs shrink-0">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        aria-label="Xem tháng trước"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all cursor-pointer"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center space-x-2 px-3">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 min-w-[105px] text-center whitespace-nowrap">
                            {displayMonthText}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleNextMonth}
                        aria-label="Xem tháng tiếp theo"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-xs transition-all cursor-pointer"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Các nút hành động chính (Toàn bộ chiều cao cố định h-9 = 36px) */}
                <div className="flex items-center space-x-2 shrink-0">
                    <button
                        type="button"
                        onClick={onOpenDebtModal}
                        aria-label="Xem sổ theo dõi công nợ dự án"
                        className="inline-flex h-9 items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                        <CreditCard className="h-4 w-4 text-amber-500 shrink-0" />
                        <span>Sổ Công Nợ</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenPaymentModal}
                        aria-label="Ghi nhận khách thanh toán tiền"
                        className="inline-flex h-9 items-center space-x-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100/80 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Nhận Tiền</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenProjectModal}
                        aria-label="Quản lý danh sách dự án và đơn giá giờ"
                        className="inline-flex h-9 items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                    >
                        <FolderKanban className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span>Dự Án</span>
                    </button>

                    <button
                        type="button"
                        onClick={onOpenFocusModal}
                        aria-label="Cài đặt nhắc nhở tập trung Im lặng làm việc"
                        title="Cài đặt nhắc nhở: Im lặng làm việc"
                        className={`inline-flex h-9 items-center space-x-1.5 rounded-lg border px-3 text-xs font-bold transition-colors shadow-2xs cursor-pointer whitespace-nowrap ${
                            isFocusEnabled
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                    >
                        <VolumeX className={`h-4 w-4 shrink-0 ${isFocusEnabled ? "text-indigo-600" : "text-slate-400"}`} />
                        <span>Im Lặng Làm Việc</span>
                        {isFocusEnabled && (
                            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onOpenSettingsModal}
                        aria-label="Mở cài đặt tài khoản ngân hàng và hệ thống"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer shrink-0"
                    >
                        <Settings className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={onOpenCreateEntry}
                        aria-label="Thêm mới phiên làm việc hoặc bấm giờ"
                        className="inline-flex h-9 items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4 shrink-0" />
                        <span>Thêm Giờ Làm</span>
                    </button>
                </div>
            </div>
        </header>
    );
};
