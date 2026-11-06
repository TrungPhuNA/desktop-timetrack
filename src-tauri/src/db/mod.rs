pub mod entries;
pub mod focus;
pub mod payments;
pub mod projects;
pub mod settings;

use std::path::PathBuf;
use std::sync::Mutex;
use chrono::Local;
use rusqlite::{params, Connection, Result};

/// Quản lý Wrapper kết nối SQLite Database an toàn thread-safe
pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    /// Khởi tạo kết nối SQLite và chạy migrations bảng dữ liệu
    pub fn new(db_path: PathBuf) -> Result<Self> {
        if let Some(parent) = db_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init_tables()?;
        db.seed_defaults()?;
        Ok(db)
    }

    /// Khởi tạo các bảng dữ liệu cho hệ thống TimeTrack
    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        // 1. Bảng lưu danh mục Dự án
        conn.execute(
            "CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                hourly_rate REAL NOT NULL DEFAULT 220000.0,
                color TEXT NOT NULL DEFAULT '#6366f1',
                description TEXT NOT NULL DEFAULT '',
                is_archived INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );",
            [],
        )?;

        // 2. Bảng lưu chi tiết từng phiên làm việc (Time Log)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS time_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                work_date TEXT NOT NULL,
                start_time TEXT NOT NULL DEFAULT '',
                end_time TEXT NOT NULL DEFAULT '',
                time_range_display TEXT NOT NULL DEFAULT '',
                duration_hours REAL NOT NULL DEFAULT 0.0,
                hourly_rate REAL NOT NULL DEFAULT 0.0,
                total_amount REAL NOT NULL DEFAULT 0.0,
                note TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );",
            [],
        )?;

        // 3. Bảng ghi nhận các khoản khách thanh toán (Payments)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                amount REAL NOT NULL DEFAULT 0.0,
                paid_date TEXT NOT NULL,
                note TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );",
            [],
        )?;

        // 4. Bảng lưu thông tin cài đặt và tài khoản thanh toán
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                default_hourly_rate REAL NOT NULL DEFAULT 220000.0,
                currency_symbol TEXT NOT NULL DEFAULT 'đ',
                bank_name TEXT NOT NULL DEFAULT 'VPBank',
                bank_account_no TEXT NOT NULL DEFAULT '131325177',
                bank_account_name TEXT NOT NULL DEFAULT 'PHAN TRUNG PHÚ',
                enable_desktop_notify INTEGER NOT NULL DEFAULT 1
            );",
            [],
        )?;

        // 5. Bảng lưu cấu hình Nhắc nhở tập trung (Focus Reminder: Im lặng làm việc)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS focus_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                enabled INTEGER NOT NULL DEFAULT 1,
                message TEXT NOT NULL DEFAULT 'Im lặng làm việc',
                start_time TEXT NOT NULL DEFAULT '09:00',
                end_time TEXT NOT NULL DEFAULT '18:00',
                interval_minutes INTEGER NOT NULL DEFAULT 30,
                days_of_week TEXT NOT NULL DEFAULT '1,2,3,4,5',
                sound_enabled INTEGER NOT NULL DEFAULT 1
            );",
            [],
        )?;

        Ok(())
    }

    /// Khởi tạo dữ liệu mặc định ban đầu nếu bảng còn trống
    fn seed_defaults(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        // Cài đặt ban đầu
        conn.execute(
            "INSERT OR IGNORE INTO settings (
                id, default_hourly_rate, currency_symbol, bank_name,
                bank_account_no, bank_account_name, enable_desktop_notify
            ) VALUES (1, 220000.0, 'đ', 'VPBank', '131325177', 'PHAN TRUNG PHÚ', 1);",
            [],
        )?;

        // Cài đặt Nhắc nhở tập trung mặc định: 09:00 - 18:00, 30 phút/lần, Thứ 2 -> Thứ 6
        conn.execute(
            "INSERT OR IGNORE INTO focus_settings (
                id, enabled, message, start_time, end_time,
                interval_minutes, days_of_week, sound_enabled
            ) VALUES (1, 1, 'Im lặng làm việc', '09:00', '18:00', 30, '1,2,3,4,5', 1);",
            [],
        )?;

        // Tạo sẵn dự án mẫu 'tilo-company' nếu chưa có
        let proj_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM projects WHERE name = 'tilo-company'",
            [],
            |row| row.get(0),
        )?;

        let project_id: i64 = if proj_count == 0 {
            conn.execute(
                "INSERT INTO projects (name, hourly_rate, color, description, is_archived, created_at, updated_at)
                 VALUES ('tilo-company', 220000.0, '#3b82f6', 'Dự án tilo.vn', 0, ?1, ?2);",
                params![now, now],
            )?;
            conn.last_insert_rowid()
        } else {
            conn.query_row(
                "SELECT id FROM projects WHERE name = 'tilo-company'",
                [],
                |r| r.get(0),
            )?
        };

        // Nếu bảng time_entries còn trống, tự động nạp dữ liệu T8, T9, T10
        let entry_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM time_entries",
            [],
            |row| row.get(0),
        )?;

        if entry_count == 0 {
            let entries = vec![
                // T8 - 2026
                ("2026-08-01", "21h00", "02h00", "21h00 - 02h00 (2)", 5.0, 1100000.0, "Meet"),
                ("2026-08-03", "21h30", "01h30", "21h30 - 01h30 (4)", 4.0, 880000.0, "Meet"),
                ("2026-08-04", "03h00", "05h00", "03h00 - 05h00 (2)", 2.0, 440000.0, "Check nguyên nhân ko nhận HS và xử lý"),
                ("2026-08-05", "21h40", "01h40", "21h40 - 01h40 (4)", 4.0, 880000.0, "Meet"),
                ("2026-08-18", "21h00", "02h00", "21h00 - 02h00 (3)", 5.0, 1100000.0, "Meet"),
                ("2026-08-20", "20h30", "02h00", "20h30 - 02h00 (5,5)", 5.5, 1210000.0, "Meet"),
                ("2026-08-23", "21h30", "00h00", "21h30 - 00h00 (2,5)", 2.5, 550000.0, "Meet"),
                ("2026-08-24", "15h00", "18h00", "15h00 - 18h00 (3,5)", 3.5, 770000.0, "Xly các vấn đề note trong group"),
                // T9 - 2026
                ("2026-09-27", "20h50", "00h50", "20h50 - 00h50 (4)", 4.0, 880000.0, "Meet"),
                ("2026-09-30", "21h00", "00h00", "21h00 - 0h00 (3)", 3.0, 660000.0, "Xử lý vẫn đề cập nhật thư viện cho tilo"),
                // T10 - 2026
                ("2026-10-09", "22h00", "00h30", "22h00 - 00h30 (2,5)", 2.5, 550000.0, "Meet"),
                ("2026-10-14", "21h40", "02h40", "21h40 - 02h40 (5)", 5.0, 1100000.0, "Meet"),
                ("2026-10-15", "21h30", "01h30", "21h30 - 01h30 (4)", 4.0, 880000.0, "Meet"),
                ("2026-10-22", "21h10", "00h40", "21h10 - 00h40 (3,5)", 3.5, 770000.0, "Meet"),
                ("2026-10-23", "21h05", "01h05", "21h05 - 01h05 (4)", 4.0, 880000.0, "Meet"),
                ("2026-10-24", "13h50", "16h50", "13h50 - 16h50 (3)", 3.0, 660000.0, "Meet"),
                ("2026-10-25", "21h30", "00h30", "21h30 - 00h30 (3)", 3.0, 660000.0, "Meet"),
                ("2026-10-27", "22h00", "01h30", "22h00 - 01h30 (3,5)", 3.5, 770000.0, "Meet"),
                ("2026-10-30", "21h30", "01h30", "21h30 - 01h30 (4)", 4.0, 880000.0, "Meet"),
                ("2026-10-31", "10h00", "11h00", "10h00 - 11h00 (1)", 2.0, 440000.0, "Xử lý lệch phần phụ kiện\nXử lý tối ưu màn thu chi"),
            ];

            for (wdate, stime, etime, rdisp, dur, tot, nt) in entries {
                conn.execute(
                    "INSERT INTO time_entries (project_id, work_date, start_time, end_time, time_range_display, duration_hours, hourly_rate, total_amount, note, created_at, updated_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 220000.0, ?7, ?8, ?9, ?10);",
                    params![project_id, wdate, stime, etime, rdisp, dur, tot, nt, now, now],
                )?;
            }

            // Thanh toán T8: 4.700.000 đ
            conn.execute(
                "INSERT INTO payments (project_id, amount, paid_date, note, created_at)
                 VALUES (?1, 4700000.0, '2026-08-31', 'Khách thanh toán đợt 1 (còn dư nợ 2.230.000 đ)', ?2);",
                params![project_id, now],
            )?;
        }

        Ok(())
    }
}
