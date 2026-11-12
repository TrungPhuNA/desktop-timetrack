import React from "react";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { TaskStatus } from "../types";
import { getDeadlineAlertStatus } from "../services/taskParser";

interface DeadlineBadgeProps {
    deadline?: string;
    status: TaskStatus;
}

/**
 * Component hiển thị Badge Hạn Chót (Deadline)
 * - Quá hạn: Báo ĐỎ (icon cảnh báo + số giờ/ngày trễ, hiển thị tĩnh, không nhấp nháy)
 * - Sắp tới hạn trong vòng 24h: Báo VÀNG (icon đồng hồ + số giờ còn lại)
 * - Còn hạn > 24h: Bình thường
 * - Đã xong / Close: Hoàn thành đúng hạn
 */
export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({ deadline, status }) => {
    const alertInfo = getDeadlineAlertStatus(deadline, status);

    if (alertInfo.type === "NONE") {
        return <span className="text-slate-300 text-[11px]">-</span>;
    }

    if (alertInfo.type === "DONE") {
        return (
            <div
                className="inline-flex items-center space-x-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200"
                title={`Hạn chót: ${alertInfo.formattedDate} (Đã hoàn thành)`}
            >
                <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                <span className="truncate">{alertInfo.formattedDate}</span>
            </div>
        );
    }

    // Quá hạn -> Báo ĐỎ (Hiển thị tĩnh, nổi bật, không nhấp nháy gây mỏi mắt)
    if (alertInfo.type === "OVERDUE") {
        return (
            <div
                className="inline-flex items-center space-x-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-300 shadow-2xs"
                title={`Hạn chót: ${alertInfo.formattedDate} (ĐÃ QUÁ HẠN)`}
            >
                <AlertCircle className="h-3 w-3 text-rose-600 shrink-0" />
                <span className="whitespace-nowrap">{alertInfo.badgeText}</span>
                <span className="text-[10px] text-rose-500 font-normal hidden xl:inline">
                    ({alertInfo.formattedDate})
                </span>
            </div>
        );
    }

    // Sắp tới hạn trong vòng 24h -> Báo VÀNG
    if (alertInfo.type === "SOON") {
        return (
            <div
                className="inline-flex items-center space-x-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300 shadow-2xs"
                title={`Hạn chót: ${alertInfo.formattedDate} (SẮP ĐẾN HẠN)`}
            >
                <Clock className="h-3 w-3 text-amber-600 shrink-0" />
                <span className="whitespace-nowrap">{alertInfo.badgeText}</span>
                <span className="text-[10px] text-amber-600 font-normal hidden xl:inline">
                    ({alertInfo.formattedDate})
                </span>
            </div>
        );
    }

    // Bình thường (> 24h)
    return (
        <div
            className="inline-flex items-center space-x-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200"
            title={`Hạn chót: ${alertInfo.formattedDate} (${alertInfo.badgeText})`}
        >
            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="whitespace-nowrap">{alertInfo.formattedDate}</span>
            <span className="text-[10px] text-slate-400 hidden xl:inline">
                ({alertInfo.badgeText})
            </span>
        </div>
    );
};
