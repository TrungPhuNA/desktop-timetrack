pub mod entries;
pub mod focus;
pub mod payments;
pub mod projects;
pub mod settings;
pub mod tasks;

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

        // 6. Bảng lưu danh sách Task công việc theo tuần (Weekly Tasks)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS weekly_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                month TEXT NOT NULL,
                week_of_month INTEGER NOT NULL DEFAULT 1,
                task_key TEXT NOT NULL,
                task_url TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'To do',
                priority TEXT NOT NULL DEFAULT 'NORMAL',
                deadline TEXT NOT NULL DEFAULT '',
                note TEXT NOT NULL DEFAULT '',
                order_index INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );",
            [],
        )?;

        // Migration an toàn bổ sung cột deadline nếu bảng đã tồn tại từ trước
        let _ = conn.execute(
            "ALTER TABLE weekly_tasks ADD COLUMN deadline TEXT NOT NULL DEFAULT '';",
            [],
        );

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

        // Nếu bảng weekly_tasks còn trống, khởi tạo danh sách task mẫu của Anh Phú
        let task_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM weekly_tasks",
            [],
            |row| row.get(0),
        )?;

        if task_count == 0 {
            let initial_tasks = vec![
                ("[DEV] [ATOS][M1.5] Dashboard quản trị vận hành (view KHCL/BOD) – Xây dựng Dashboard Tổng quan công ty", "ONEAT-5289", "https://interspacevn.atlassian.net/browse/ONEAT-5289", "ATOS", "In process", "2026-11-12 18:00"),
                ("[DEV] [ATOS][M1.5] Dashboard quản trị vận hành (view KHCL/BOD) – AGE Performance", "ONEAT-5291", "https://interspacevn.atlassian.net/browse/ONEAT-5291", "ATOS", "To do", "2026-11-13 18:00"),
                ("[DEV] [ATOS][M1.5] Dashboard quản trị vận hành (view KHCL/BOD) – Campaign performance", "ONEAT-5290", "https://interspacevn.atlassian.net/browse/ONEAT-5290", "ATOS", "To do", "2026-11-10 18:00"),
                ("[DEV] [ATOS][M1.5] Vận hành hệ thống (Left menu) – Thêm chức năng chuyển campaign sang BU member khác", "ONEAT-5226", "https://interspacevn.atlassian.net/browse/ONEAT-5226", "ATOS", "Dev testing", "2026-11-12 21:00"),
                ("[DEV] [ATOS][M1.5] Screen Plan launching & vận hành – Time cutoff khóa chỉnh sửa số liệu của AGE, Admin được phép chỉnh sửa", "ONEAT-5295", "https://interspacevn.atlassian.net/browse/ONEAT-5295", "ATOS", "To do", "2026-11-14 18:00"),
                ("[DEV] [ATOS][M1.5] Screen Plan launching & vận hành – Export/Import file cho phép AGE cập nhật 5 số liệu campaign", "ONEAT-5294", "https://interspacevn.atlassian.net/browse/ONEAT-5294", "ATOS", "Deploy", "2026-11-13 12:00"),
                ("[ATOS][M1.5] Pipeline – Bổ sung logic cho edge case AGE fill dữ liệu trên AT OS tự động tạo mới bản ghi trên file AT Operation", "ONEAT-5297", "https://interspacevn.atlassian.net/browse/ONEAT-5297", "ATOS", "Done", "2026-11-11 18:00"),
                ("[ATOS][M1.5] Pipeline – Bổ sung các field còn thiếu trên AT OS để AGE fill dữ liệu và tự động fill vào file AT Operation", "ONEAT-5296", "https://interspacevn.atlassian.net/browse/ONEAT-5296", "ATOS", "Close", "2026-11-10 12:00"),
                ("[MGM] - Postback trạng thái hợp đồng về cho các đối tác", "DEV-9000", "https://interspacevn.atlassian.net/browse/DEV-9000", "MGM", "In process", "2026-11-12 17:30"),
            ];

            for (idx, (title, key, url, cat, st, dline)) in initial_tasks.iter().enumerate() {
                conn.execute(
                    "INSERT INTO weekly_tasks (
                        month, week_of_month, task_key, task_url, title, category,
                        status, priority, deadline, note, order_index, created_at, updated_at
                    ) VALUES ('2026-11', 2, ?1, ?2, ?3, ?4, ?5, 'NORMAL', ?6, '', ?7, ?8, ?9);",
                    params![key, url, title, cat, st, dline, (idx + 1) as i64, now, now],
                )?;
            }
        }

        Ok(())
    }
}
