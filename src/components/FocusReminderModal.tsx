import React, { useEffect, useState } from "react";
import Select from "react-select";
import {
    Check,
    Music,
    Play,
    Volume2,
    VolumeX,
    X,
} from "lucide-react";
import { FocusSettings, SaveFocusSettingsInput } from "../types";
import { cleanSelectStyles, SelectOption } from "./selectStyles";
import { FocusSoundTheme, playFocusChimeSound } from "../services/focusScheduler";

interface FocusReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: FocusSettings | null;
    onSave: (input: SaveFocusSettingsInput) => Promise<void>;
    onTestNotification: (message: string, soundEnabled: boolean, theme: FocusSoundTheme) => void;
}

const INTERVAL_OPTIONS: SelectOption[] = [
    { value: 30, label: "30 phút / lần (Khuyên dùng)" },
    { value: 60, label: "60 phút (1 tiếng) / lần" },
    { value: 45, label: "45 phút / lần" },
    { value: 15, label: "15 phút / lần (Thường xuyên)" },
];

const SOUND_THEME_OPTIONS: SelectOption[] = [
    { value: "crystal", label: "Chuông Pha Lê (Crystal Chime - Du dương, sang trọng)" },
    { value: "marimba", label: "Đàn Gỗ Marimba (Vui vẻ, tươi tắn, bắt tai)" },
    { value: "zen", label: "Chuông Thiền Tây Tạng (Trầm ấm, tĩnh tâm 432Hz)" },
];

const DAYS_OF_WEEK = [
    { id: "1", label: "Thứ 2", short: "T2" },
    { id: "2", label: "Thứ 3", short: "T3" },
    { id: "3", label: "Thứ 4", short: "T4" },
    { id: "4", label: "Thứ 5", short: "T5" },
    { id: "5", label: "Thứ 6", short: "T6" },
    { id: "6", label: "Thứ 7", short: "T7" },
    { id: "0", label: "Chủ Nhật", short: "CN" },
];

/**
 * Modal Cấu hình Nhắc Nhở Tập Trung (Focus Reminder)
 * Thiết kế bố cục chiều ngang 2 cột (Horizontal Grid) tối ưu không gian hiển thị
 */
export const FocusReminderModal: React.FC<FocusReminderModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSave,
    onTestNotification,
}) => {
    const [enabled, setEnabled] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("Im lặng làm việc");
    const [startTime, setStartTime] = useState<string>("09:00");
    const [endTime, setEndTime] = useState<string>("18:00");
    const [intervalMinutes, setIntervalMinutes] = useState<number>(30);
    const [selectedDays, setSelectedDays] = useState<string[]>(["1", "2", "3", "4", "5"]);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [soundTheme, setSoundTheme] = useState<FocusSoundTheme>("crystal");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [testSuccess, setTestSuccess] = useState<boolean>(false);

    useEffect(() => {
        if (settings) {
            setEnabled(settings.enabled);
            setMessage(settings.message || "Im lặng làm việc");
            setStartTime(settings.start_time || "09:00");
            setEndTime(settings.end_time || "18:00");
            setIntervalMinutes(settings.interval_minutes || 30);
            setSoundEnabled(settings.sound_enabled);

            const days = (settings.days_of_week || "1,2,3,4,5")
                .split(",")
                .map((d) => d.trim())
                .filter(Boolean);
            setSelectedDays(days);
        }
    }, [settings, isOpen]);

    if (!isOpen) return null;

    const toggleDay = (dayId: string) => {
        if (selectedDays.includes(dayId)) {
            if (selectedDays.length > 1) {
                setSelectedDays(selectedDays.filter((d) => d !== dayId));
            }
        } else {
            setSelectedDays([...selectedDays, dayId]);
        }
    };

    const handleSelectWeekdaysOnly = () => {
        setSelectedDays(["1", "2", "3", "4", "5"]);
    };

    const handleSelectAllDays = () => {
        setSelectedDays(["1", "2", "3", "4", "5", "6", "0"]);
    };

    const handleTest = () => {
        onTestNotification(message, soundEnabled, soundTheme);
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await onSave({
                enabled,
                message: message.trim() || "Im lặng làm việc",
                start_time: startTime || "09:00",
                end_time: endTime || "18:00",
                interval_minutes: intervalMinutes,
                days_of_week: selectedDays.sort().join(","),
                sound_enabled: soundEnabled,
            });
            onClose();
        } catch (error) {
            console.error("Lỗi khi lưu cài đặt nhắc nhở:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const currentIntervalOption = INTERVAL_OPTIONS.find((opt) => opt.value === intervalMinutes) || INTERVAL_OPTIONS[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header Modal */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
                    <div className="flex items-center space-x-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs">
                            <VolumeX className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">
                                Cài Đặt Nhắc Nhở Tập Trung
                            </h2>
                            <p className="text-xs text-slate-500">
                                Tự động cảnh báo &quot;Im lặng làm việc&quot; theo lịch trình định kỳ
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng cửa sổ cài đặt nhắc nhở"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form Body - Bố cục dàn ngang 2 cột */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CỘT TRÁI: Thời gian & Lịch trình */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40">
                                <div className="space-y-0.5">
                                    <label htmlFor="toggle-reminder" className="text-sm font-bold text-slate-800 block cursor-pointer">
                                        Bật cảnh báo nhắc nhở
                                    </label>
                                    <p className="text-xs text-slate-500">
                                        Tự động kích hoạt khi đến giờ làm việc
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        id="toggle-reminder"
                                        type="checkbox"
                                        checked={enabled}
                                        onChange={(e) => setEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* Khung giờ: 9h tới 18h */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                        Giờ bắt đầu
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden shadow-2xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                        Giờ kết thúc
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* Chu kỳ lặp lại (react-select theo Rule 7) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Chu kỳ thông báo định kỳ
                                </label>
                                <Select
                                    options={INTERVAL_OPTIONS}
                                    value={currentIntervalOption}
                                    onChange={(val) => {
                                        if (val) setIntervalMinutes(Number(val.value));
                                    }}
                                    styles={cleanSelectStyles}
                                    isSearchable={false}
                                    aria-label="Chọn chu kỳ thông báo"
                                />
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Cứ mỗi {intervalMinutes} phút trong khoảng từ {startTime} đến {endTime}.
                                </p>
                            </div>

                            {/* Các ngày áp dụng trong tuần */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700 whitespace-nowrap">
                                        Ngày áp dụng trong tuần
                                    </label>
                                    <div className="space-x-1">
                                        <button
                                            type="button"
                                            onClick={handleSelectWeekdaysOnly}
                                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                                        >
                                            Thứ 2 - Thứ 6
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                            type="button"
                                            onClick={handleSelectAllDays}
                                            className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold cursor-pointer underline"
                                        >
                                            Cả tuần
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-1.5">
                                    {DAYS_OF_WEEK.map((day) => {
                                        const isSelected = selectedDays.includes(day.id);
                                        return (
                                            <button
                                                key={day.id}
                                                type="button"
                                                onClick={() => toggleDay(day.id)}
                                                aria-label={`Chọn ${day.label}`}
                                                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                <span>{day.short}</span>
                                                <span className="text-[9px] font-normal opacity-80 mt-0.5">
                                                    {day.id === "0" || day.id === "6" ? "Nghỉ" : "Làm"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* CỘT PHẢI: Nội dung, Âm thanh & Cảnh báo */}
                        <div className="space-y-4">
                            {/* Nội dung thông báo */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Nội dung thông điệp cảnh báo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="VD: Im lặng làm việc"
                                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden transition-colors shadow-2xs"
                                />
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Thông điệp xuất hiện to rõ trên cửa sổ rung cảnh báo và khay hệ thống.
                                </p>
                            </div>

                            {/* Âm thanh cảnh báo & Chọn giai điệu */}
                            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        {soundEnabled ? (
                                            <Volume2 className="h-4 w-4 text-indigo-600" />
                                        ) : (
                                            <VolumeX className="h-4 w-4 text-slate-400" />
                                        )}
                                        <span className="text-xs font-bold text-slate-700">
                                            Phát âm thanh chuông dịu nhẹ (Chime)
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={soundEnabled}
                                            onChange={(e) => setSoundEnabled(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {soundEnabled && (
                                    <div className="space-y-1.5 pt-1">
                                        <label className="block text-xs font-semibold text-slate-600 whitespace-nowrap">
                                            Chọn phong cách giai điệu
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 min-w-0">
                                                <Select
                                                    options={SOUND_THEME_OPTIONS}
                                                    value={
                                                        SOUND_THEME_OPTIONS.find((opt) => opt.value === soundTheme) ||
                                                        SOUND_THEME_OPTIONS[0]
                                                    }
                                                    onChange={(val) => {
                                                        if (val) setSoundTheme(val.value as FocusSoundTheme);
                                                    }}
                                                    styles={cleanSelectStyles}
                                                    isSearchable={false}
                                                    aria-label="Chọn giai điệu chuông"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => playFocusChimeSound(soundTheme)}
                                                aria-label="Nghe thử giai điệu chuông"
                                                className="inline-flex h-[38px] items-center space-x-1.5 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                                            >
                                                <Music className="h-3.5 w-3.5" />
                                                <span>Nghe Thử</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Giới thiệu hiệu ứng rung lắc 2 bên */}
                            <div className="flex items-start space-x-2.5 p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs text-slate-700">
                                <span className="text-lg leading-none">📳</span>
                                <div className="space-y-0.5">
                                    <span className="font-bold text-indigo-900 block">
                                        Hiệu ứng rung chuông gây chú ý:
                                    </span>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        Khi đến chu kỳ nhắc nhở, cửa sổ thông báo sẽ <strong>rung lắc qua lại 2 bên liên tục</strong> ở giữa màn hình cho đến khi bạn bấm xác nhận.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Modal Action Buttons */}
                    <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleTest}
                            aria-label="Thử nghiệm thông báo ngay"
                            className="inline-flex h-10 items-center space-x-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                            {testSuccess ? (
                                <>
                                    <Check className="h-4 w-4 text-emerald-600" />
                                    <span className="text-emerald-700">Đã bắn thông báo & rung!</span>
                                </>
                            ) : (
                                <>
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    <span>Thử Nghiệm Ngay</span>
                                </>
                            )}
                        </button>

                        <div className="flex items-center space-x-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Hủy bỏ"
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Hủy
                            </button>

                            <button
                                type="submit"
                                disabled={isSaving}
                                aria-label="Lưu cài đặt nhắc nhở"
                                className="inline-flex h-10 items-center justify-center space-x-1.5 rounded-lg bg-indigo-600 px-6 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap disabled:opacity-50"
                            >
                                <Check className="h-4 w-4" />
                                <span>{isSaving ? "Đang lưu..." : "Lưu Cài Đặt"}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
