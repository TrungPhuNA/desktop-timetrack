import React from "react";
import { MetricsCards } from "./MetricsCards";
import { TimeTable } from "./TimeTable";
import { TimeTableSkeleton } from "./TimeTableSkeleton";
import { AppSettings, MonthlySummary, Project, TimeEntry } from "../types";

interface FreelanceViewProps {
    loading: boolean;
    summary: MonthlySummary | null;
    entries: TimeEntry[];
    projects: Project[];
    settings: AppSettings | null;
    currentMonth: string;
    selectedProjectId: number | null;
    onSelectProject: (id: number | null) => void;
    onEditEntry: (entry: TimeEntry) => void;
    onDeleteEntry: (id: number) => void;
    onDuplicateEntry: (entry: TimeEntry) => void;
}

/**
 * Phân hệ Chấm Công & Quản Lý Dòng Tiền Freelance
 */
export const FreelanceView: React.FC<FreelanceViewProps> = ({
    loading,
    summary,
    entries,
    projects,
    settings,
    currentMonth,
    selectedProjectId,
    onSelectProject,
    onEditEntry,
    onDeleteEntry,
    onDuplicateEntry,
}) => {
    if (loading && !summary) {
        return <TimeTableSkeleton />;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* 4 Thẻ chỉ số tài chính & Cảnh báo nợ cũ chuyển sang */}
            <MetricsCards
                summary={summary}
                currencySymbol={settings?.currency_symbol || "đ"}
            />

            {/* Bảng dữ liệu chấm công chi tiết */}
            <TimeTable
                entries={entries}
                projects={projects}
                summary={summary}
                settings={settings}
                currentMonth={currentMonth}
                onEditEntry={onEditEntry}
                onDeleteEntry={onDeleteEntry}
                onDuplicateEntry={onDuplicateEntry}
                selectedProjectId={selectedProjectId}
                onSelectProject={onSelectProject}
            />
        </div>
    );
};
