mod commands;
mod db;
mod models;

use std::path::PathBuf;
use tauri::Manager;

use commands::*;
use db::Database;

/// Hàm khởi chạy chính của ứng dụng Tauri TimeTrack
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // Xác định đường dẫn thư mục lưu trữ Database SQLite
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("./data"));

            let db_path = app_data_dir.join("timetrack.db");
            let database = Database::new(db_path)
                .expect("Không thể khởi tạo cơ sở dữ liệu SQLite cho TimeTrack");

            // Đưa Database vào Tauri State để các command sử dụng an toàn thread-safe
            app.manage(database);

            Ok(())
        })
        // Đăng ký toàn bộ IPC Commands cho Frontend gọi
        .invoke_handler(tauri::generate_handler![
            cmd_get_projects,
            cmd_create_project,
            cmd_update_project,
            cmd_delete_project,
            cmd_get_time_entries,
            cmd_create_time_entry,
            cmd_update_time_entry,
            cmd_delete_time_entry,
            cmd_get_payments,
            cmd_create_payment,
            cmd_update_payment,
            cmd_delete_payment,
            cmd_get_monthly_summary,
            cmd_get_project_debt_summary,
            cmd_get_settings,
            cmd_save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi khởi chạy ứng dụng TimeTrack");
}
