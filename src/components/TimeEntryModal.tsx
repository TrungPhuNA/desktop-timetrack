import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Clock, Play, Square, X, Pause, Moon } from "lucide-react";
import { CreateTimeEntryInput, Project, TimeEntry, UpdateTimeEntryInput } from "../types";
import { cleanSelectStyles, SelectOption } from "./selectStyles";
import { MoneyInput } from "./MoneyInput";
import { calculateHoursDiff, formatToDisplayHour, normalizeToTimeInput } from "../services/timeUtils";

interface TimeEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveCreate: (input: CreateTimeEntryInput) => Promise<void>;
    onSaveUpdate: (input: UpdateTimeEntryInput) => Promise<void>;
    editingEntry: TimeEntry | null;
    projects: Project[];
    currencySymbol?: string;
}

/**
 * Modal thêm mới hoặc chỉnh sửa phiên làm việc
 * Hỗ trợ chọn Giờ bắt đầu & Giờ kết thúc bằng Time Picker chuẩn, tự động tính số giờ và ca xuyên đêm
 */
export const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
    isOpen,
    onClose,
    onSaveCreate,
    onSaveUpdate,
    editingEntry,
    projects,
    currencySymbol = "đ",
}) => {
    // Form States
    const [projectId, setProjectId] = useState<number>(projects[0]?.id || 0);
    const [workDate, setWorkDate] = useState<string>("");
    const [startTime, setStartTime] = useState<string>(""); // Lưu định dạng "HH:mm"
    const [endTime, setEndTime] = useState<string>("");     // Lưu định dạng "HH:mm"
    const [isOvernight, setIsOvernight] = useState<boolean>(false);
    const [durationHours, setDurationHours] = useState<number>(1);
    const [hourlyRate, setHourlyRate] = useState<number>(220000);
    const [note, setNote] = useState<string>("");

    // Live Timer States
    const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
    const [timerSeconds, setTimerSeconds] = useState<number>(0);

    // Thiết lập dữ liệu ban đầu khi mở modal
    useEffect(() => {
        if (!isOpen) return;

        if (editingEntry) {
            setProjectId(editingEntry.project_id);
            setWorkDate(editingEntry.work_date);
            const normStart = normalizeToTimeInput(editingEntry.start_time);
            const normEnd = normalizeToTimeInput(editingEntry.end_time);
            setStartTime(normStart);
            setEndTime(normEnd);
            setDurationHours(editingEntry.duration_hours);
            setHourlyRate(editingEntry.hourly_rate);
            setNote(editingEntry.note);

            if (normStart && normEnd) {
                const diff = calculateHoursDiff(normStart, normEnd);
                setIsOvernight(diff.isOvernight);
            }
        } else {
            const today = new Date().toISOString().split("T")[0];
            setWorkDate(today);
            const defaultProj = projects[0];
            if (defaultProj) {
                setProjectId(defaultProj.id);
                setHourlyRate(defaultProj.hourly_rate);
            }
            setStartTime("");
            setEndTime("");
            setIsOvernight(false);
            setDurationHours(1);
            setNote("");
        }
    }, [isOpen, editingEntry, projects]);

    // Timer Interval logic
    useEffect(() => {
        let interval: any = null;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimerSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    if (!isOpen) return null;

    // Thay đổi dự án -> Cập nhật đơn giá tương ứng
    const handleProjectChange = (opt: SelectOption | null) => {
        if (!opt) return;
        const pid = Number(opt.value);
        setProjectId(pid);
        const proj = projects.find((p) => p.id === pid);
        if (proj && !editingEntry) {
            setHourlyRate(proj.hourly_rate);
        }
    };

    // Khi người dùng chọn Giờ bắt đầu
    const handleStartTimeChange = (newStart: string) => {
        setStartTime(newStart);
        if (newStart && endTime) {
            const { hours, isOvernight: overnight } = calculateHoursDiff(newStart, endTime);
            if (hours > 0) {
                setDurationHours(hours);
                setIsOvernight(overnight);
            }
        }
    };

    // Khi người dùng chọn Giờ kết thúc
    const handleEndTimeChange = (newEnd: string) => {
        setEndTime(newEnd);
        if (startTime && newEnd) {
            const { hours, isOvernight: overnight } = calculateHoursDiff(startTime, newEnd);
            if (hours > 0) {
                setDurationHours(hours);
                setIsOvernight(overnight);
            }
        }
    };

    // Bắt đầu Timer
    const handleStartTimer = () => {
        const now = new Date();
        const startNorm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setStartTime(startNorm);
        setTimerSeconds(0);
        setIsTimerRunning(true);
    };

    // Tạm dừng Timer
    const handlePauseTimer = () => {
        setIsTimerRunning(false);
    };

    // Kết thúc Timer -> Tự động tính số giờ
    const handleStopTimer = () => {
        setIsTimerRunning(false);
        const now = new Date();
        const endNorm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setEndTime(endNorm);

        if (startTime) {
            const { hours, isOvernight: overnight } = calculateHoursDiff(startTime, endNorm);
            setDurationHours(hours > 0 ? hours : Math.max(0.25, Math.round((timerSeconds / 3600) * 10) / 10));
            setIsOvernight(overnight);
        } else {
            const hours = Math.max(0.25, Math.round((timerSeconds / 3600) * 10) / 10);
            setDurationHours(hours);
        }
    };

    const formatTimerDisplay = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    // Chuỗi định dạng lưu trữ: VD "21h40 - 02h40 (5)"
    const computeTimeRangeDisplay = (): string => {
        if (startTime && endTime) {
            const sDisplay = formatToDisplayHour(startTime);
            const eDisplay = formatToDisplayHour(endTime);
            return `${sDisplay} - ${eDisplay} (${durationHours.toLocaleString("vi-VN")})`;
        }
        return `${durationHours.toLocaleString("vi-VN")} giờ`;
    };

    const calculatedTotalAmount = Math.round(durationHours * hourlyRate);

    // Xử lý Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (durationHours <= 0) return;

        const timeRangeDisplay = computeTimeRangeDisplay();
        const sDisplay = formatToDisplayHour(startTime);
        const eDisplay = formatToDisplayHour(endTime);

        if (editingEntry) {
            await onSaveUpdate({
                id: editingEntry.id,
                project_id: projectId,
                work_date: workDate,
                start_time: sDisplay,
                end_time: eDisplay,
                time_range_display: timeRangeDisplay,
                duration_hours: durationHours,
                hourly_rate: hourlyRate,
                total_amount: calculatedTotalAmount,
                note,
            });
        } else {
            await onSaveCreate({
                project_id: projectId,
                work_date: workDate,
                start_time: sDisplay,
                end_time: eDisplay,
                time_range_display: timeRangeDisplay,
                duration_hours: durationHours,
                hourly_rate: hourlyRate,
                total_amount: calculatedTotalAmount,
                note,
            });
        }
        onClose();
    };

    const projectOptions: SelectOption[] = projects.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.hourly_rate.toLocaleString("vi-VN")} ${currencySymbol}/h)`,
        color: p.color,
    }));

    const selectedOption = projectOptions.find((o) => o.value === projectId) || null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                {/* Header Modal */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5">
                    <div className="flex items-center space-x-2 shrink-0">
                        <Clock className="h-5 w-5 text-indigo-600 shrink-0" />
                        <h2 className="text-base font-bold text-slate-900 whitespace-nowrap">
                            {editingEntry ? "Chỉnh sửa Giờ làm việc" : "Ghi nhận Giờ làm việc"}
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

                {/* Live Timer Widget */}
                {!editingEntry && (
                    <div className="border-b border-indigo-100 bg-indigo-50/50 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block whitespace-nowrap">
                                    Đồng Hồ Live Timer
                                </span>
                                <div className="text-2xl font-black font-mono text-indigo-700 tracking-wider">
                                    {formatTimerDisplay(timerSeconds)}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {!isTimerRunning ? (
                                    <button
                                        type="button"
                                        onClick={handleStartTimer}
                                        aria-label="Bắt đầu tính giờ"
                                        className="inline-flex h-9 items-center space-x-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                                    >
                                        <Play className="h-3.5 w-3.5 fill-current" />
                                        <span>Bắt đầu</span>
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handlePauseTimer}
                                            aria-label="Tạm dừng tính giờ"
                                            className="inline-flex h-9 items-center space-x-1.5 rounded-lg bg-amber-600 px-3.5 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            <Pause className="h-3.5 w-3.5 fill-current" />
                                            <span>Tạm dừng</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleStopTimer}
                                            aria-label="Kết thúc và tính giờ"
                                            className="inline-flex h-9 items-center space-x-1.5 rounded-lg bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            <Square className="h-3.5 w-3.5 fill-current" />
                                            <span>Kết thúc</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Body - Input, Select, Button đều chuẩn h-10 (40px) */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Chọn Dự án */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                            Dự án <span className="text-rose-500">*</span>
                        </label>
                        <Select
                            options={projectOptions}
                            value={selectedOption}
                            onChange={handleProjectChange}
                            styles={cleanSelectStyles}
                            placeholder="Chọn dự án..."
                            isSearchable
                            aria-label="Chọn dự án làm việc"
                        />
                    </div>

                    {/* Ngày làm việc */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                            Ngày làm <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={workDate}
                            onChange={(e) => setWorkDate(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                        />
                    </div>

                    {/* CHỌN GIỜ BẮT ĐẦU VÀ GIỜ KẾT THÚC BẰNG TIME PICKER */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                                Giờ bắt đầu
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => handleStartTimeChange(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs cursor-pointer"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                    Giờ kết thúc
                                </label>
                                {isOvernight && (
                                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 whitespace-nowrap">
                                        <Moon className="h-3 w-3" />
                                        <span>+1 ngày (qua đêm)</span>
                                    </span>
                                )}
                            </div>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => handleEndTimeChange(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Số giờ & Đơn giá - Dùng step="any" và min="0.01" để không bị lỗi stepMismatch của HTML5 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                                Số giờ làm (Tự tính) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="0.01"
                                required
                                value={durationHours || ""}
                                onChange={(e) => setDurationHours(parseFloat(e.target.value) || 0)}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-indigo-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                                Đơn giá / giờ ({currencySymbol})
                            </label>
                            <MoneyInput
                                value={hourlyRate}
                                onChange={setHourlyRate}
                                placeholder="220.000"
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono font-bold focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                            />
                        </div>
                    </div>

                    {/* Thành tiền */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                            Thành tiền dự kiến (Số giờ × Đơn giá)
                        </label>
                        <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-emerald-700 font-mono shadow-2xs">
                            <span className="text-xs text-slate-500 font-normal">
                                {computeTimeRangeDisplay()}
                            </span>
                            <span>
                                {calculatedTotalAmount.toLocaleString("vi-VN")} {currencySymbol}
                            </span>
                        </div>
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                            Ghi chú công việc (Note)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Ví dụ: Meet, Xử lý lệch phụ kiện, fix bug..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 resize-none shadow-2xs"
                        />
                    </div>

                    {/* Actions - Nút chiều cao h-10 */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-lg border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            className="h-10 rounded-lg bg-indigo-600 px-5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap"
                        >
                            {editingEntry ? "Lưu Thay Đổi" : "Tạo Giờ Làm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
