import * as XLSX from "xlsx";
import { CreateWeeklyTaskInput, TaskStatus, WeeklyTask } from "../types";
import { api } from "./api";

export const JIRA_BASE_URL = "https://interspacevn.atlassian.net/browse/";

/**
 * Trích xuất mã task từ đường dẫn URL hoặc chuỗi văn bản
 * Ví dụ: "https://interspacevn.atlassian.net/browse/DEV-9000" -> "DEV-9000"
 */
export const extractTaskKey = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return "";

    // Regex tìm mã task Jira tiêu chuẩn (PROJECT_KEY-NUMBER)
    const urlMatch = trimmed.match(/\/browse\/([A-Za-z0-9_]+-\d+)/i);
    if (urlMatch && urlMatch[1]) {
        return urlMatch[1].toUpperCase();
    }

    const keyMatch = trimmed.match(/\b([A-Za-z0-9_]+-\d+)\b/);
    if (keyMatch && keyMatch[1]) {
        return keyMatch[1].toUpperCase();
    }

    return trimmed;
};

/**
 * Tạo URL Jira đầy đủ từ mã task hoặc kiểm tra URL hiện có
 */
export const normalizeJiraUrl = (keyOrUrl: string): { key: string; url: string } => {
    const key = extractTaskKey(keyOrUrl);
    if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
        return { key: key || "TASK", url: keyOrUrl.trim() };
    }
    if (key) {
        return { key, url: `${JIRA_BASE_URL}${key}` };
    }
    return { key: "", url: "" };
};

/**
 * Tự động bóc tách Tag/Phân loại từ tiêu đề công việc
 * Ví dụ: "[DEV] [ATOS][M1.5] Dashboard..." -> "ATOS"
 * Ví dụ: "[MGM] - Postback..." -> "MGM"
 */
export const extractCategoryFromTitle = (title: string): string => {
    const upper = title.toUpperCase();
    if (upper.includes("[ATOS]") || upper.includes("ATOS")) return "ATOS";
    if (upper.includes("[MGM]") || upper.includes("MGM")) return "MGM";
    if (upper.includes("[ONEAT]") || upper.includes("ONEAT")) return "ONEAT";
    if (upper.includes("[DEV]") || upper.includes("DEV")) return "DEV";

    // Tìm tag đầu tiên trong ngoặc vuông
    const bracketMatch = title.match(/\[([A-Za-z0-9_-]+)\]/);
    if (bracketMatch && bracketMatch[1]) {
        return bracketMatch[1].toUpperCase();
    }
    return "CHUNG";
};

/**
 * Phân tích khối văn bản ghi chú thô của Anh Phú thành danh sách Task
 * Hỗ trợ nhận diện các cặp: Tiêu đề + Đường link Jira trên 2 dòng kế tiếp nhau
 */
export const parseRawTaskText = (
    rawText: string,
    month: string,
    weekOfMonth: number
): CreateWeeklyTaskInput[] => {
    const lines = rawText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const results: CreateWeeklyTaskInput[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Nếu dòng hiện tại là link Jira
        if (line.includes("atlassian.net/browse/") || line.match(/^[A-Za-z0-9_]+-\d+$/)) {
            const { key, url } = normalizeJiraUrl(line);
            const prevTitle = results.length > 0 ? "" : "";
            results.push({
                month,
                week_of_month: weekOfMonth,
                task_key: key || "TASK",
                task_url: url,
                title: prevTitle || key,
                category: extractCategoryFromTitle(prevTitle || key),
                status: "To do",
                priority: "NORMAL",
                note: "",
            });
            i++;
            continue;
        }

        // Dòng hiện tại là Tiêu đề, kiểm tra dòng tiếp theo có phải link Jira không
        const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
        if (nextLine && (nextLine.includes("atlassian.net/browse/") || nextLine.match(/^[A-Za-z0-9_]+-\d+$/))) {
            const { key, url } = normalizeJiraUrl(nextLine);
            results.push({
                month,
                week_of_month: weekOfMonth,
                task_key: key || "TASK",
                task_url: url,
                title: line,
                category: extractCategoryFromTitle(line),
                status: "To do",
                priority: "NORMAL",
                note: "",
            });
            i += 2; // Bỏ qua cả dòng link vừa xử lý
            continue;
        }

        // Trường hợp 1 dòng chứa cả Mã task và Tiêu đề: "ONEAT-5289: Tiêu đề..."
        const inlineMatch = line.match(/^([A-Za-z0-9_]+-\d+)[:\s-]+(.*)$/);
        if (inlineMatch && inlineMatch[1]) {
            const key = inlineMatch[1].toUpperCase();
            const title = inlineMatch[2].trim() || line;
            results.push({
                month,
                week_of_month: weekOfMonth,
                task_key: key,
                task_url: `${JIRA_BASE_URL}${key}`,
                title,
                category: extractCategoryFromTitle(title),
                status: "To do",
                priority: "NORMAL",
                note: "",
            });
            i++;
            continue;
        }

        // Dòng tiêu đề độc lập không kèm link
        results.push({
            month,
            week_of_month: weekOfMonth,
            task_key: "DEV-" + (results.length + 1),
            task_url: "",
            title: line,
            category: extractCategoryFromTitle(line),
            status: "To do",
            priority: "NORMAL",
            note: "",
        });
        i++;
    }

    return results;
};

/**
 * Kiểu trạng thái cảnh báo hạn chót
 */
export interface DeadlineAlert {
    type: "OVERDUE" | "SOON" | "NORMAL" | "DONE" | "NONE";
    badgeText: string;
    formattedDate: string;
    diffHours: number;
}

/**
 * Tính toán trạng thái cảnh báo Deadline theo thời gian thực
 * - Task đã Done / Close: Không cảnh báo
 * - Quá hạn: Báo ĐỎ kèm thời gian quá hạn
 * - Sắp tới hạn trong vòng 24 giờ (1 ngày): Báo VÀNG kèm thời gian còn lại
 * - Còn hạn > 24 giờ: Bình thường
 */
export const getDeadlineAlertStatus = (
    deadlineStr?: string,
    status?: TaskStatus
): DeadlineAlert => {
    if (!deadlineStr || !deadlineStr.trim()) {
        return {
            type: "NONE",
            badgeText: "Chưa đặt",
            formattedDate: "--",
            diffHours: 0,
        };
    }

    // Định dạng hiển thị ngày giờ (ví dụ: 18:00 14/11)
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) {
        return {
            type: "NONE",
            badgeText: deadlineStr,
            formattedDate: deadlineStr,
            diffHours: 0,
        };
    }

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const formattedDate = `${hours}:${minutes} ${day}/${month}`;

    // Nếu task đã hoàn thành hoặc đóng
    if (status === "Done" || status === "Close") {
        return {
            type: "DONE",
            badgeText: "Đã hoàn thành",
            formattedDate,
            diffHours: 0,
        };
    }

    const now = Date.now();
    const diffMs = d.getTime() - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Quá hạn (Diff âm) -> Báo ĐỎ
    if (diffMs < 0) {
        const absHours = Math.abs(diffHours);
        if (absHours < 24) {
            const h = Math.max(1, Math.round(absHours));
            return {
                type: "OVERDUE",
                badgeText: `Trễ ${h}h`,
                formattedDate,
                diffHours,
            };
        }
        const days = Math.floor(absHours / 24);
        return {
            type: "OVERDUE",
            badgeText: `Trễ ${days} ngày`,
            formattedDate,
            diffHours,
        };
    }

    // Sắp tới hạn trong vòng 24h -> Báo VÀNG
    if (diffHours <= 24) {
        const h = Math.max(1, Math.round(diffHours));
        return {
            type: "SOON",
            badgeText: `Còn ${h}h`,
            formattedDate,
            diffHours,
        };
    }

    // Còn hạn > 24h -> Bình thường
    const remainDays = Math.ceil(diffHours / 24);
    return {
        type: "NORMAL",
        badgeText: `Còn ${remainDays} ngày`,
        formattedDate,
        diffHours,
    };
};

/**
 * Xuất danh sách Task ra file Excel (.xlsx) chuẩn OpenXML
 * Tự động căn chỉnh độ rộng các cột, lưu trực tiếp vào ~/Downloads và mở Finder
 */
export const exportTasksToExcel = async (
    tasks: WeeklyTask[],
    month: string,
    weekOfMonth: number
): Promise<{ success: boolean; filePath?: string; message: string }> => {
    const headers = [
        "STT",
        "Tháng",
        "Tuần",
        "Mã Task",
        "Dự Án / Tag",
        "Tiêu Đề Công Việc",
        "Hạn Chót (Deadline)",
        "Trạng Thái",
        "Độ Ưu Tiên",
        "Link Jira",
        "Ghi Chú",
    ];

    const rows = tasks.map((t, idx) => [
        idx + 1,
        t.month,
        `Tuần ${t.week_of_month}`,
        t.task_key,
        t.category,
        t.title,
        t.deadline || "--",
        t.status,
        t.priority,
        t.task_url,
        t.note,
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Căn chỉnh độ rộng cột chuẩn Excel
    ws["!cols"] = [
        { wch: 6 },  // STT
        { wch: 12 }, // Tháng
        { wch: 10 }, // Tuần
        { wch: 15 }, // Mã Task
        { wch: 15 }, // Dự Án
        { wch: 45 }, // Tiêu Đề Công Việc
        { wch: 22 }, // Hạn Chót
        { wch: 16 }, // Trạng Thái
        { wch: 14 }, // Độ Ưu Tiên
        { wch: 50 }, // Link Jira
        { wch: 30 }, // Ghi Chú
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Tuần ${weekOfMonth}`);

    const fileName = `Tasks_CongTy_${month}_Tuan_${weekOfMonth}.xlsx`;

    try {
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const bytes = Array.from(new Uint8Array(excelBuffer));
        const savedPath = await api.exportExcelFile(fileName, bytes);
        return {
            success: true,
            filePath: savedPath,
            message: `Đã lưu file Excel: ${fileName}`,
        };
    } catch (ipcErr) {
        console.warn("Lưu qua Tauri IPC không thành công, thử fallback SheetJS download:", ipcErr);
        try {
            XLSX.writeFile(wb, fileName);
            return {
                success: true,
                message: `Đã tải file Excel: ${fileName}`,
            };
        } catch (err) {
            return {
                success: false,
                message: `Lỗi xuất file Excel: ${String(err)}`,
            };
        }
    }
};

// Bí danh tương thích ngược
export const exportTasksToExcelCsv = exportTasksToExcel;

/**
 * Tạo văn bản báo cáo tuần định dạng sẵn để copy gửi Zalo/Telegram/Slack
 */
export const formatWeeklySummaryReport = (
    tasks: WeeklyTask[],
    month: string,
    weekOfMonth: number
): string => {
    let report = `📋 BÁO CÁO CÔNG VIỆC TUẦN ${weekOfMonth} (THÁNG ${month})\n`;
    report += `Tổng số task: ${tasks.length} task\n`;
    report += `------------------------------------\n\n`;

    const statusGroups: { [key in TaskStatus]?: WeeklyTask[] } = {};
    tasks.forEach((t) => {
        if (!statusGroups[t.status]) statusGroups[t.status] = [];
        statusGroups[t.status]!.push(t);
    });

    const orderedStatuses: TaskStatus[] = [
        "Done",
        "Deploy",
        "Dev testing",
        "In process",
        "To do",
        "Close",
        "Reject",
    ];

    orderedStatuses.forEach((st) => {
        const group = statusGroups[st];
        if (group && group.length > 0) {
            report += `【${st.toUpperCase()}】 (${group.length})\n`;
            group.forEach((t, idx) => {
                report += `${idx + 1}. [${t.task_key}] ${t.title}\n   🔗 ${t.task_url}\n`;
            });
            report += `\n`;
        }
    });

    return report.trim();
};
