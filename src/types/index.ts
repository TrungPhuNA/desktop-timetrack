/**
 * Types & Interfaces đồng bộ với Rust Backend models
 */

export interface Project {
    id: number;
    name: string;
    hourly_rate: number;
    color: string;
    description: string;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateProjectInput {
    name: string;
    hourly_rate: number;
    color?: string;
    description?: string;
}

export interface UpdateProjectInput {
    id: number;
    name: string;
    hourly_rate: number;
    color: string;
    description: string;
    is_archived: boolean;
}

export interface TimeEntry {
    id: number;
    project_id: number;
    project_name: string;
    project_color: string;
    work_date: string;          // YYYY-MM-DD
    start_time: string;         // VD: 21:40
    end_time: string;           // VD: 02:40
    time_range_display: string; // VD: 21h40 - 02h40 (5h)
    duration_hours: number;     // VD: 2.5, 4.0
    hourly_rate: number;        // Đơn giá áp dụng
    total_amount: number;       // Thành tiền = duration_hours * hourly_rate
    note: string;               // Nội dung công việc
    created_at: string;
    updated_at: string;
}

export interface CreateTimeEntryInput {
    project_id: number;
    work_date: string;
    start_time?: string;
    end_time?: string;
    time_range_display?: string;
    duration_hours: number;
    hourly_rate?: number;
    total_amount?: number;
    note?: string;
}

export interface UpdateTimeEntryInput {
    id: number;
    project_id: number;
    work_date: string;
    start_time?: string;
    end_time?: string;
    time_range_display?: string;
    duration_hours: number;
    hourly_rate: number;
    total_amount: number;
    note?: string;
}

export interface Payment {
    id: number;
    project_id: number;
    project_name: string;
    amount: number;
    paid_date: string;          // YYYY-MM-DD
    note: string;
    created_at: string;
}

export interface CreatePaymentInput {
    project_id: number;
    amount: number;
    paid_date: string;
    note?: string;
}

export interface UpdatePaymentInput {
    id: number;
    project_id: number;
    amount: number;
    paid_date: string;
    note?: string;
}

export interface ProjectMonthlyStat {
    project_id: number;
    project_name: string;
    project_color: string;
    hourly_rate: number;
    total_hours: number;
    total_amount: number;
    entry_count: number;
}

export interface ProjectDebtItem {
    project_id: number;
    project_name: string;
    project_color: string;
    total_earned_all_time: number;
    total_paid_all_time: number;
    balance_due: number;
}

export interface MonthlySummary {
    month: string;                  // YYYY-MM
    total_hours: number;
    current_month_earned: number;   // Tiền làm tháng này
    prev_debt_brought_forward: number; // Nợ cũ tháng trước chuyển sang
    current_month_paid: number;     // Khách đã trả trong tháng
    total_due_remaining: number;    // Dư nợ còn lại chốt sang tháng sau
    project_stats: ProjectMonthlyStat[];
}

export interface AppSettings {
    id: number;
    default_hourly_rate: number;
    currency_symbol: string;
    bank_name: string;
    bank_account_no: string;
    bank_account_name: string;
    enable_desktop_notify: boolean;
}

export interface SaveSettingsInput {
    default_hourly_rate: number;
    currency_symbol: string;
    bank_name: string;
    bank_account_no: string;
    bank_account_name: string;
    enable_desktop_notify: boolean;
}

export interface FocusSettings {
    id: number;
    enabled: boolean;
    message: string;
    start_time: string;        // HH:mm, ví dụ "09:00"
    end_time: string;          // HH:mm, ví dụ "18:00"
    interval_minutes: number;  // 30 hoặc 60
    days_of_week: string;      // "1,2,3,4,5" (T2 -> T6)
    sound_enabled: boolean;
}

export interface SaveFocusSettingsInput {
    enabled: boolean;
    message: string;
    start_time: string;
    end_time: string;
    interval_minutes: number;
    days_of_week: string;
    sound_enabled: boolean;
}

export type TaskStatus =
    | "To do"
    | "In process"
    | "Dev testing"
    | "Deploy"
    | "Done"
    | "Close"
    | "Reject";

export interface WeeklyTask {
    id: number;
    month: string;             // YYYY-MM
    week_of_month: number;     // 1, 2, 3, 4, 5
    task_key: string;          // ONEAT-5289, DEV-9000
    task_url: string;          // https://interspacevn.atlassian.net/browse/...
    title: string;
    category: string;          // ATOS, MGM, DEV, ONEAT...
    status: TaskStatus;
    priority: "HIGH" | "NORMAL" | "LOW";
    deadline: string;          // YYYY-MM-DD HH:mm hoặc ""
    note: string;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface CreateWeeklyTaskInput {
    month: string;
    week_of_month: number;
    task_key: string;
    task_url: string;
    title: string;
    category?: string;
    status?: TaskStatus;
    priority?: "HIGH" | "NORMAL" | "LOW";
    deadline?: string;
    note?: string;
}

export interface UpdateWeeklyTaskInput {
    id: number;
    month: string;
    week_of_month: number;
    task_key: string;
    task_url: string;
    title: string;
    category: string;
    status: TaskStatus;
    priority: "HIGH" | "NORMAL" | "LOW";
    deadline: string;
    note: string;
}

export interface BatchCreateWeeklyTasksInput {
    month: string;
    week_of_month: number;
    tasks: CreateWeeklyTaskInput[];
}
