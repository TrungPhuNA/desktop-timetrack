mod commands;
mod db;
mod models;
mod seo;

use std::path::PathBuf;
use tauri::Manager;

use commands::*;
use db::Database;
use seo::commands::*;
use seo::SeoStreamState;

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

            // Đưa Database và SeoStreamState vào Tauri State để các command sử dụng an toàn thread-safe
            app.manage(database);
            app.manage(SeoStreamState::default());

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
            cmd_get_focus_settings,
            cmd_save_focus_settings,
            cmd_get_weekly_tasks,
            cmd_create_weekly_task,
            cmd_update_weekly_task,
            cmd_delete_weekly_task,
            cmd_update_task_status,
            cmd_batch_create_weekly_tasks,
            cmd_export_excel_file,
            // Phân hệ SEO Content Studio
            cmd_seo_get_ai_configs,
            cmd_seo_save_ai_config,
            cmd_seo_delete_ai_config,
            cmd_seo_test_ai_connection,
            cmd_seo_get_sites,
            cmd_seo_save_site,
            cmd_seo_delete_site,
            cmd_seo_get_internal_links,
            cmd_seo_sync_sitemap,
            cmd_seo_get_templates,
            cmd_seo_save_template,
            cmd_seo_delete_template,
            cmd_seo_get_articles,
            cmd_seo_get_article_detail,
            cmd_seo_create_article,
            cmd_seo_update_article,
            cmd_seo_delete_article,
            cmd_seo_crawl_competitors,
            cmd_seo_stop_generation,
            cmd_seo_generate_outline,
            cmd_seo_generate_article,
            cmd_seo_rewrite_selection,
            cmd_seo_generate_meta_faq,
            cmd_seo_get_usage_summary,
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi khởi chạy ứng dụng TimeTrack");
}
