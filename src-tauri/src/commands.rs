use tauri::State;

use crate::db::Database;
use crate::models::{
    AppSettings, CreatePaymentInput, CreateProjectInput, CreateTimeEntryInput,
    MonthlySummary, Payment, Project, ProjectDebtItem, SaveSettingsInput,
    TimeEntry, UpdatePaymentInput, UpdateProjectInput, UpdateTimeEntryInput,
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
