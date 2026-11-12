import React from "react";
import { TaskStatus } from "../types";

interface TaskStatusBadgeProps {
    status: TaskStatus;
    className?: string;
}

/**
 * Badge hiển thị trạng thái chuẩn của quy trình phát triển Jira
 */
export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status, className = "" }) => {
    const getBadgeStyle = (st: TaskStatus) => {
        switch (st) {
            case "To do":
                return "bg-slate-100 text-slate-700 border-slate-300";
            case "In process":
                return "bg-sky-50 text-sky-700 border-sky-300";
            case "Dev testing":
                return "bg-amber-50 text-amber-700 border-amber-300";
            case "Deploy":
                return "bg-purple-50 text-purple-700 border-purple-300";
            case "Done":
                return "bg-emerald-50 text-emerald-700 border-emerald-300";
            case "Close":
                return "bg-teal-50 text-teal-700 border-teal-300";
            case "Reject":
                return "bg-rose-50 text-rose-700 border-rose-300";
            default:
                return "bg-slate-100 text-slate-700 border-slate-300";
        }
    };

    const getDotColor = (st: TaskStatus) => {
        switch (st) {
            case "To do":
                return "bg-slate-400";
            case "In process":
                return "bg-sky-500 animate-pulse";
            case "Dev testing":
                return "bg-amber-500";
            case "Deploy":
                return "bg-purple-500";
            case "Done":
                return "bg-emerald-500";
            case "Close":
                return "bg-teal-500";
            case "Reject":
                return "bg-rose-500";
            default:
                return "bg-slate-400";
        }
    };

    return (
        <span
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors whitespace-nowrap shadow-2xs ${getBadgeStyle(
                status
            )} ${className}`}
        >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getDotColor(status)}`} />
            <span>{status}</span>
        </span>
    );
};
