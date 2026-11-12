import React, { useMemo, useState } from "react";
import Select from "react-select";
import { Check, ExternalLink, FileSpreadsheet, Sparkles, X } from "lucide-react";
import { BatchCreateWeeklyTasksInput } from "../types";
import { cleanSelectStyles, SelectOption } from "./selectStyles";
import { parseRawTaskText } from "../services/taskParser";

interface BatchImportTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentMonth: string;
    currentWeek: number;
    onSaveBatch: (input: BatchCreateWeeklyTasksInput) => Promise<void>;
}

const WEEK_OPTIONS: SelectOption[] = [
    { value: 1, label: "Tuần 1" },
    { value: 2, label: "Tuần 2" },
    { value: 3, label: "Tuần 3" },
    { value: 4, label: "Tuần 4" },
    { value: 5, label: "Tuần 5" },
];

/**
 * Modal Nhập Nhanh Hàng Loạt Task Công Ty (Quick Batch Import)
 * Tự động bóc tách khối văn bản ghi chú Jira thành danh sách task có cấu trúc
 */
export const BatchImportTaskModal: React.FC<BatchImportTaskModalProps> = ({
    isOpen,
    onClose,
    currentMonth,
    currentWeek,
    onSaveBatch,
}) => {
    const [rawText, setRawText] = useState<string>("");
    const [targetWeek, setTargetWeek] = useState<number>(currentWeek);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Tự động phân tích ngay khi người dùng dán text
    const parsedTasks = useMemo(() => {
        if (!rawText.trim()) return [];
        return parseRawTaskText(rawText, currentMonth, targetWeek);
    }, [rawText, currentMonth, targetWeek]);

    if (!isOpen) return null;

    const handleImport = async () => {
        if (parsedTasks.length === 0) return;
        try {
            setIsSubmitting(true);
            await onSaveBatch({
                month: currentMonth,
                week_of_month: targetWeek,
                tasks: parsedTasks,
            });
            setRawText("");
            onClose();
        } catch (error) {
            console.error("Lỗi khi import hàng loạt:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentWeekOption = WEEK_OPTIONS.find((o) => o.value === targetWeek) || WEEK_OPTIONS[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70 shrink-0">
                    <div className="flex items-center space-x-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">
                                Nhập Nhanh Hàng Loạt Task Công Ty
                            </h2>
                            <p className="text-xs text-slate-500">
                                Dán trực tiếp danh sách ghi chú Jira, hệ thống sẽ tự động bóc tách từng task
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng modal"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body: 2 cột - Trái: Textarea, Phải: Live Preview */}
                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Cột trái: Nhập văn bản thô */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-700 whitespace-nowrap">
                                Dán danh sách ghi chú vào đây:
                            </label>
                            <div className="flex items-center space-x-2 w-36">
                                <Select
                                    options={WEEK_OPTIONS}
                                    value={currentWeekOption}
                                    onChange={(val) => {
                                        if (val) setTargetWeek(Number(val.value));
                                    }}
                                    styles={cleanSelectStyles}
                                    isSearchable={false}
                                    aria-label="Chọn tuần nhận task"
                                />
                            </div>
                        </div>

                        <textarea
                            rows={12}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={`Ví dụ dán dạng:\n[DEV] [ATOS][M1.5] Dashboard quản trị vận hành...\nhttps://interspacevn.atlassian.net/browse/ONEAT-5289\n\n[MGM] - Postback trạng thái hợp đồng...\nhttps://interspacevn.atlassian.net/browse/DEV-9000`}
                            className="flex-1 min-h-[260px] w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-hidden transition-colors shadow-2xs resize-none leading-relaxed"
                        />
                        <p className="text-[11px] text-slate-500">
                            💡 Hỗ trợ nhận diện tự động từng cặp tiêu đề và đường link Jira `https://interspacevn.atlassian.net/browse/***`.
                        </p>
                    </div>

                    {/* Cột phải: Xem trước kết quả bóc tách */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">
                                Xem trước kết quả nhận diện ({parsedTasks.length} task):
                            </span>
                            {parsedTasks.length > 0 && (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                    <Check className="h-3 w-3" />
                                    <span>Hợp lệ</span>
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-h-[260px] max-h-[360px] rounded-xl border border-slate-200 bg-slate-50/60 p-3 overflow-y-auto space-y-2.5">
                            {parsedTasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                    <FileSpreadsheet className="h-10 w-10 text-slate-300 mb-2" />
                                    <p className="text-xs font-medium">Chưa có dữ liệu xem trước</p>
                                    <p className="text-[11px] mt-0.5">Dán nội dung vào ô bên trái để xem kết quả bóc tách</p>
                                </div>
                            ) : (
                                parsedTasks.map((task, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs text-xs space-y-1.5 hover:border-indigo-300 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[11px]">
                                                    {task.task_key}
                                                </span>
                                                {task.category && (
                                                    <span className="font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                                        {task.category}
                                                    </span>
                                                )}
                                            </div>
                                            {task.task_url && (
                                                <span className="text-slate-400 inline-flex items-center space-x-1 text-[10px]">
                                                    <ExternalLink className="h-3 w-3" />
                                                    <span>Jira</span>
                                                </span>
                                            )}
                                        </div>
                                        <p className="font-semibold text-slate-800 line-clamp-2">
                                            {task.title}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/70 shrink-0">
                    <span className="text-xs text-slate-500">
                        Sẽ thêm vào: <strong>Tuần {targetWeek} (Tháng {currentMonth})</strong>
                    </span>

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
                            type="button"
                            disabled={parsedTasks.length === 0 || isSubmitting}
                            onClick={handleImport}
                            aria-label="Xác nhận thêm hàng loạt"
                            className="inline-flex h-10 items-center justify-center space-x-1.5 rounded-lg bg-indigo-600 px-6 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                            <span>
                                {isSubmitting ? "Đang xử lý..." : `Thêm ${parsedTasks.length} Task Vào Tuần ${targetWeek}`}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
