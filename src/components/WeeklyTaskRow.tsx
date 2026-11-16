import React from "react";
import Select from "react-select";
import { Edit2, ExternalLink, Trash2 } from "lucide-react";
import { TaskStatus, WeeklyTask } from "../types";
import { DeadlineBadge } from "./DeadlineBadge";
import { SelectOption, tableSelectStyles } from "./selectStyles";

const STATUS_OPTIONS: SelectOption[] = [
    { value: "To do", label: "🟡 To do" },
    { value: "In process", label: "🔵 In process" },
    { value: "Dev testing", label: "🟠 Dev testing" },
    { value: "Deploy", label: "🟣 Deploy" },
    { value: "Done", label: "🟢 Done" },
    { value: "Close", label: "🔷 Close" },
    { value: "Reject", label: "🔴 Reject" },
];

interface WeeklyTaskRowProps {
    task: WeeklyTask;
    index: number;
    selectedWeek: number;
    onOpenJiraLink: (url: string) => void;
    onUpdateStatus: (id: number, status: TaskStatus) => Promise<void>;
    onEditTask: (task: WeeklyTask) => void;
    onDeleteTask: (id: number, taskKey: string) => void;
}

/**
 * Hàng hiển thị 1 Task trong Bảng Task Công Ty Theo Tuần
 * Tự động gắn badge "Tồn T{week}" nếu task chưa hoàn thành mang sang từ tuần trước
 */
export const WeeklyTaskRow: React.FC<WeeklyTaskRowProps> = ({
    task,
    index,
    selectedWeek,
    onOpenJiraLink,
    onUpdateStatus,
    onEditTask,
    onDeleteTask,
}) => {
    const isCarriedOver = task.week_of_month < selectedWeek;

    return (
        <tr className="hover:bg-indigo-50/40 transition-colors group">
            {/* STT */}
            <td className="py-3.5 px-3.5 text-center text-slate-400 font-mono">
                {index + 1}
            </td>

            {/* Mã Task Jira & Badge Tồn Tuần trước */}
            <td className="py-3.5 px-3.5 whitespace-nowrap">
                <div className="flex items-center space-x-1.5">
                    {task.task_url ? (
                        <button
                            type="button"
                            onClick={() => onOpenJiraLink(task.task_url)}
                            title={`Mở task ${task.task_key} trên Jira`}
                            aria-label={`Mở ${task.task_key}`}
                            className="inline-flex items-center space-x-1 font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                        >
                            <span>{task.task_key}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                        </button>
                    ) : (
                        <span className="font-mono font-bold text-slate-700">
                            {task.task_key}
                        </span>
                    )}

                    {isCarriedOver && (
                        <span
                            className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs shrink-0"
                            title={`Task chưa hoàn thành từ Tuần ${task.week_of_month} được chuyển tiếp sang Tuần ${selectedWeek}`}
                        >
                            Tồn T{task.week_of_month}
                        </span>
                    )}
                </div>
            </td>

            {/* Dự Án / Tag */}
            <td className="py-3.5 px-3.5 whitespace-nowrap">
                {task.category ? (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 text-[11px] border border-slate-200">
                        {task.category}
                    </span>
                ) : (
                    <span className="text-slate-400">-</span>
                )}
            </td>

            {/* Tiêu Đề Công Việc */}
            <td className="py-3.5 px-3.5 font-medium text-slate-800">
                <p className="line-clamp-2 leading-relaxed">{task.title}</p>
            </td>

            {/* Hạn Chót (Deadline) */}
            <td className="py-3.5 px-3.5 whitespace-nowrap">
                <DeadlineBadge deadline={task.deadline} status={task.status} />
            </td>

            {/* Trạng Thái - Sử dụng React-Select chuẩn chỉ kèm menuPortal chống lỗi bị box ngoài cắt đứt */}
            <td className="py-2.5 px-3.5 whitespace-nowrap w-40">
                <Select
                    options={STATUS_OPTIONS}
                    value={STATUS_OPTIONS.find((o) => o.value === task.status) || STATUS_OPTIONS[0]}
                    onChange={(val) => {
                        if (val) onUpdateStatus(task.id, val.value as TaskStatus);
                    }}
                    styles={tableSelectStyles}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                    menuPosition="fixed"
                    isSearchable={false}
                    aria-label={`Chọn trạng thái cho task ${task.task_key}`}
                />
            </td>

            {/* Ghi Chú */}
            <td className="py-3.5 px-3.5 text-slate-500">
                {task.note ? (
                    <span className="line-clamp-1">{task.note}</span>
                ) : (
                    <span className="text-slate-300">-</span>
                )}
            </td>

            {/* Thao Tác Sửa / Xóa */}
            <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                <div className="inline-flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        aria-label={`Sửa task ${task.task_key}`}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                        <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDeleteTask(task.id, task.task_key)}
                        aria-label={`Xóa task ${task.task_key}`}
                        className="p-1.5 rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
};
