import React from "react";
import {
    Calendar,
    CheckSquare,
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
    activeTab: "freelance" | "tasks";
    onTabChange: (tab: "freelance" | "tasks") => void;
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
 * - Hàng 1 (App Navigation): Logo, Tên ứng dụng và 2 Tab (sẵn sàng mở rộng nhiều tab) cùng hàng, bên phải là Im Lặng & Cài Đặt
 * - Hàng 2 (Sub-toolbar Freelance): Chuyển tháng và các Action (Sổ Công Nợ, Nhận Tiền, Dự Án, Thêm Giờ Làm)
 */
export const Header: React.FC<HeaderProps> = ({
    activeTab,
    onTabChange,
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

    // Format hiển thị: "Tháng 11 - 2026"
    const [yearStr, monthStr] = currentMonth.split("-");
    const displayMonthText = `Tháng ${parseInt(monthStr, 10)} - ${yearStr}`;

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
            {/* HÀNG 1: Logo, Tên ứng dụng + 2 Tabs cùng hàng + Cài đặt toàn cục bên phải */}
            <div className="flex items-center justify-between gap-4 px-6 py-2.5 border-b border-slate-100">
                {/* Logo & Navigation Tabs cùng hàng */}
                <div className="flex items-center space-x-5">
                    {/* Brand Logo */}
                    <div className="flex items-center space-x-2.5 shrink-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 shadow-sm shadow-indigo-500/25 shrink-0">
                            <Timer className="h-4.5 w-4.5 text-white" />
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <span className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
                                TimeTrack
                            </span>
                            <span className="rounded-md bg-indigo-50 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 border border-indigo-200 whitespace-nowrap">
                                Pro
                            </span>
                        </div>
                    </div>

                    <div className="h-5 w-[1px] bg-slate-200 shrink-0"></div>

                    {/* Tab Navigation - Nằm cùng hàng với Logo, sẵn sàng mở rộng nhiều tab */}
                    <nav className="flex items-center space-x-1.5" aria-label="Tabs chính">
                        <button
                            type="button"
                            onClick={() => onTabChange("freelance")}
                            aria-label="Chuyển sang tab Chấm công freelance"
                            className={`inline-flex h-8 items-center space-x-1.5 rounded-lg px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === "freelance"
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                        >
                            <Timer className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Chấm Công Freelance</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => onTabChange("tasks")}
                            aria-label="Chuyển sang tab Task công ty"
                            className={`inline-flex h-8 items-center space-x-1.5 rounded-lg px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === "tasks"
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                            }`}
                        >
                            <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Task Công Ty Theo Tuần</span>
                        </button>
                    </nav>
                </div>

                {/* Các nút hành động toàn cục (Im Lặng Làm Việc, Cài Đặt) */}
                <div className="flex items-center space-x-2 shrink-0">
                    <button
                        type="button"
                        onClick={onOpenFocusModal}
                        aria-label="Cài đặt nhắc nhở tập trung Im lặng làm việc"
                        title="Cài đặt nhắc nhở: Im lặng làm việc"
                        className={`inline-flex h-8 items-center space-x-1.5 rounded-lg border px-2.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer whitespace-nowrap ${
                            isFocusEnabled
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                    >
                        <VolumeX className={`h-3.5 w-3.5 shrink-0 ${isFocusEnabled ? "text-indigo-600" : "text-slate-400"}`} />
                        <span>Im Lặng Làm Việc</span>
                        {isFocusEnabled && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onOpenSettingsModal}
                        aria-label="Mở cài đặt tài khoản ngân hàng và hệ thống"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer shrink-0"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* HÀNG 2: Sub-toolbar ngữ cảnh (Chỉ hiện khi ở Tab Chấm Công Freelance) */}
            {activeTab === "freelance" && (
                <div className="flex items-center justify-between gap-4 px-6 py-2 bg-slate-50/60 animate-in fade-in duration-150">
                    {/* Bộ chọn Tháng của Freelance */}
                    <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-1 shadow-2xs shrink-0">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            aria-label="Xem tháng trước"
                            className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex items-center space-x-1.5 px-2.5">
                            <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span className="text-xs font-bold text-slate-800 min-w-[100px] text-center whitespace-nowrap">
                                {displayMonthText}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleNextMonth}
                            aria-label="Xem tháng tiếp theo"
                            className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {/* Các Action của Freelance */}
                    <div className="flex items-center space-x-2 shrink-0">
                        <button
                            type="button"
                            onClick={onOpenDebtModal}
                            aria-label="Xem sổ theo dõi công nợ dự án"
                            className="inline-flex h-8 items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                            <CreditCard className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>Sổ Công Nợ</span>
                        </button>

                        <button
                            type="button"
                            onClick={onOpenPaymentModal}
                            aria-label="Ghi nhận khách thanh toán tiền"
                            className="inline-flex h-8 items-center space-x-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100/80 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Nhận Tiền</span>
                        </button>

                        <button
                            type="button"
                            onClick={onOpenProjectModal}
                            aria-label="Quản lý danh sách dự án và đơn giá giờ"
                            className="inline-flex h-8 items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                            <FolderKanban className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span>Dự Án</span>
                        </button>

                        <button
                            type="button"
                            onClick={onOpenCreateEntry}
                            aria-label="Thêm mới phiên làm việc hoặc bấm giờ"
                            className="inline-flex h-8 items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4 shrink-0" />
                            <span>Thêm Giờ Làm</span>
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};
