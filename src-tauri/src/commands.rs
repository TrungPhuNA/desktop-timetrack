use tauri::State;

use crate::db::Database;
use crate::models::{
    AppSettings, BatchCreateWeeklyTasksInput, CreatePaymentInput, CreateProjectInput,
    CreateTimeEntryInput, CreateWeeklyTaskInput, FocusSettings, MonthlySummary,
    Payment, Project, ProjectDebtItem, SaveFocusSettingsInput, SaveSettingsInput,
    TimeEntry, UpdatePaymentInput, UpdateProjectInput, UpdateTimeEntryInput,
    UpdateWeeklyTaskInput, WeeklyTask,
};

// ==========================================
// IPC COMMANDS DỰ ÁN (PROJECTS)
// ==========================================

#[tauri::command]
pub fn cmd_get_projects(
    db: State<'_, Database>,
    include_archived: Option<bool>,
) -> Result<Vec<Project>, String> {
    db.get_projects(include_archived.unwrap_or(false))
        .map_err(|e| format!("Lỗi tải danh sách dự án: {}", e))
}

#[tauri::command]
pub fn cmd_create_project(
    db: State<'_, Database>,
    input: CreateProjectInput,
) -> Result<Project, String> {
    db.create_project(input)
        .map_err(|e| format!("Lỗi tạo dự án: {}", e))
}

#[tauri::command]
pub fn cmd_update_project(
    db: State<'_, Database>,
    input: UpdateProjectInput,
) -> Result<(), String> {
    db.update_project(input)
        .map_err(|e| format!("Lỗi cập nhật dự án: {}", e))
}

#[tauri::command]
pub fn cmd_delete_project(
    db: State<'_, Database>,
    id: i64,
) -> Result<(), String> {
    db.delete_project(id)
        .map_err(|e| format!("Lỗi xóa dự án: {}", e))
}

// ==========================================
// IPC COMMANDS PHIÊN LÀM VIỆC (TIME ENTRIES)
// ==========================================

#[tauri::command]
pub fn cmd_get_time_entries(
    db: State<'_, Database>,
    month: Option<String>,
    project_id: Option<i64>,
) -> Result<Vec<TimeEntry>, String> {
    db.get_time_entries(month, project_id)
        .map_err(|e| format!("Lỗi tải danh sách giờ làm: {}", e))
}

#[tauri::command]
pub fn cmd_create_time_entry(
    db: State<'_, Database>,
    input: CreateTimeEntryInput,
) -> Result<TimeEntry, String> {
    db.create_time_entry(input)
        .map_err(|e| format!("Lỗi thêm giờ làm: {}", e))
}

#[tauri::command]
pub fn cmd_update_time_entry(
    db: State<'_, Database>,
    input: UpdateTimeEntryInput,
) -> Result<(), String> {
    db.update_time_entry(input)
        .map_err(|e| format!("Lỗi cập nhật giờ làm: {}", e))
}

#[tauri::command]
pub fn cmd_delete_time_entry(
    db: State<'_, Database>,
    id: i64,
) -> Result<(), String> {
    db.delete_time_entry(id)
        .map_err(|e| format!("Lỗi xóa giờ làm: {}", e))
}

// ==========================================
// IPC COMMANDS THANH TOÁN (PAYMENTS)
// ==========================================

#[tauri::command]
pub fn cmd_get_payments(
    db: State<'_, Database>,
    month: Option<String>,
    project_id: Option<i64>,
) -> Result<Vec<Payment>, String> {
    db.get_payments(month, project_id)
        .map_err(|e| format!("Lỗi tải lịch sử thanh toán: {}", e))
}

#[tauri::command]
pub fn cmd_create_payment(
    db: State<'_, Database>,
    input: CreatePaymentInput,
) -> Result<Payment, String> {
    db.create_payment(input)
        .map_err(|e| format!("Lỗi ghi nhận thanh toán: {}", e))
}

#[tauri::command]
pub fn cmd_update_payment(
    db: State<'_, Database>,
    input: UpdatePaymentInput,
) -> Result<(), String> {
    db.update_payment(input)
        .map_err(|e| format!("Lỗi cập nhật thanh toán: {}", e))
}

#[tauri::command]
pub fn cmd_delete_payment(
    db: State<'_, Database>,
    id: i64,
) -> Result<(), String> {
    db.delete_payment(id)
        .map_err(|e| format!("Lỗi xóa thanh toán: {}", e))
}

// ==========================================
// IPC COMMANDS BÁO CÁO & CÔNG NỢ LŨY KẾ
// ==========================================

#[tauri::command]
pub fn cmd_get_monthly_summary(
    db: State<'_, Database>,
    month: String,
    project_id: Option<i64>,
) -> Result<MonthlySummary, String> {
    db.get_monthly_summary(month, project_id)
        .map_err(|e| format!("Lỗi tính toán báo cáo tháng: {}", e))
}

#[tauri::command]
pub fn cmd_get_project_debt_summary(
    db: State<'_, Database>,
) -> Result<Vec<ProjectDebtItem>, String> {
    db.get_project_debt_summary()
        .map_err(|e| format!("Lỗi lấy danh sách công nợ dự án: {}", e))
}

// ==========================================
// IPC COMMANDS CÀI ĐẶT (SETTINGS)
// ==========================================

#[tauri::command]
pub fn cmd_get_settings(
    db: State<'_, Database>,
) -> Result<AppSettings, String> {
    db.get_settings()
        .map_err(|e| format!("Lỗi lấy cài đặt hệ thống: {}", e))
}

#[tauri::command]
pub fn cmd_save_settings(
    db: State<'_, Database>,
    input: SaveSettingsInput,
) -> Result<(), String> {
    db.save_settings(input)
        .map_err(|e| format!("Lỗi lưu cài đặt hệ thống: {}", e))
}

// ==========================================
// IPC COMMANDS NHẮC NHỞ TẬP TRUNG (FOCUS REMINDER)
// ==========================================

#[tauri::command]
pub fn cmd_get_focus_settings(
    db: State<'_, Database>,
) -> Result<FocusSettings, String> {
    db.get_focus_settings()
        .map_err(|e| format!("Lỗi tải cài đặt nhắc nhở tập trung: {}", e))
}

#[tauri::command]
pub fn cmd_save_focus_settings(
    db: State<'_, Database>,
    input: SaveFocusSettingsInput,
) -> Result<(), String> {
    db.save_focus_settings(input)
        .map_err(|e| format!("Lỗi lưu cài đặt nhắc nhở tập trung: {}", e))
}

// ==========================================
// IPC COMMANDS TASK CÔNG TY THEO TUẦN (WEEKLY TASKS)
// ==========================================

#[tauri::command]
pub fn cmd_get_weekly_tasks(
    db: State<'_, Database>,
    month: String,
    week_of_month: Option<i64>,
    status: Option<String>,
    category: Option<String>,
) -> Result<Vec<WeeklyTask>, String> {
    db.get_weekly_tasks(&month, week_of_month, status.as_deref(), category.as_deref())
        .map_err(|e| format!("Lỗi tải danh sách task tuần: {}", e))
}

#[tauri::command]
pub fn cmd_create_weekly_task(
    db: State<'_, Database>,
    input: CreateWeeklyTaskInput,
) -> Result<WeeklyTask, String> {
    db.create_weekly_task(input)
        .map_err(|e| format!("Lỗi tạo task tuần: {}", e))
}

#[tauri::command]
pub fn cmd_update_weekly_task(
    db: State<'_, Database>,
    input: UpdateWeeklyTaskInput,
) -> Result<(), String> {
    db.update_weekly_task(input)
        .map_err(|e| format!("Lỗi cập nhật task tuần: {}", e))
}

#[tauri::command]
pub fn cmd_delete_weekly_task(
    db: State<'_, Database>,
    id: i64,
) -> Result<(), String> {
    db.delete_weekly_task(id)
        .map_err(|e| format!("Lỗi xóa task tuần: {}", e))
}

#[tauri::command]
pub fn cmd_update_task_status(
    db: State<'_, Database>,
    id: i64,
    status: String,
) -> Result<(), String> {
    db.update_task_status(id, &status)
        .map_err(|e| format!("Lỗi cập nhật trạng thái task: {}", e))
}

#[tauri::command]
pub fn cmd_batch_create_weekly_tasks(
    db: State<'_, Database>,
    input: BatchCreateWeeklyTasksInput,
) -> Result<Vec<WeeklyTask>, String> {
    db.batch_create_weekly_tasks(input)
        .map_err(|e| format!("Lỗi import hàng loạt task: {}", e))
}

// ==========================================
// IPC COMMAND XUẤT FILE EXCEL (.XLSX)
// ==========================================

#[tauri::command]
pub fn cmd_export_excel_file(
    file_name: String,
    bytes: Vec<u8>,
) -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|e| format!("Không tìm thấy thư mục người dùng: {}", e))?;
    let downloads_dir = std::path::PathBuf::from(home).join("Downloads");

    if !downloads_dir.exists() {
        std::fs::create_dir_all(&downloads_dir)
            .map_err(|e| format!("Không thể tạo thư mục Downloads: {}", e))?;
    }

    let file_path = downloads_dir.join(&file_name);

    std::fs::write(&file_path, &bytes)
        .map_err(|e| format!("Lỗi ghi file Excel (.xlsx): {}", e))?;

    // Trên macOS: Tự động mở Finder và highlight vị trí file vừa lưu
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg("-R")
            .arg(&file_path)
            .spawn();
    }

    Ok(file_path.to_string_lossy().to_string())
}
