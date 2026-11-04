use chrono::Local;
use rusqlite::{params, Result};

use crate::db::Database;
use crate::models::{CreateTimeEntryInput, TimeEntry, UpdateTimeEntryInput};

impl Database {
    /// Lấy danh sách các phiên làm việc (Time Entries), hỗ trợ lọc theo Tháng và Dự án
    pub fn get_time_entries(&self, month: Option<String>, project_id: Option<i64>) -> Result<Vec<TimeEntry>> {
        let conn = self.conn.lock().unwrap();
        let mut conditions = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(ref m) = month {
            conditions.push("substr(t.work_date, 1, 7) = ?");
            params_vec.push(Box::new(m.clone()));
        }
        if let Some(pid) = project_id {
            conditions.push("t.project_id = ?");
            params_vec.push(Box::new(pid));
        }

        let where_clause = if conditions.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", conditions.join(" AND "))
        };

        let sql = format!(
            "SELECT t.id, t.project_id, COALESCE(p.name, 'Chưa gán'), COALESCE(p.color, '#6366f1'),
                    t.work_date, t.start_time, t.end_time, t.time_range_display,
                    t.duration_hours, t.hourly_rate, t.total_amount, t.note, t.created_at, t.updated_at
             FROM time_entries t
             LEFT JOIN projects p ON t.project_id = p.id
             {}
             ORDER BY t.work_date DESC, t.id DESC",
            where_clause
        );

        let mut stmt = conn.prepare(&sql)?;
        let params_slice: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

        let rows = stmt.query_map(&params_slice[..], |row| {
            Ok(TimeEntry {
                id: row.get(0)?,
                project_id: row.get(1)?,
                project_name: row.get(2)?,
                project_color: row.get(3)?,
                work_date: row.get(4)?,
                start_time: row.get(5)?,
                end_time: row.get(6)?,
                time_range_display: row.get(7)?,
                duration_hours: row.get(8)?,
                hourly_rate: row.get(9)?,
                total_amount: row.get(10)?,
                note: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    /// Thêm mới một phiên làm việc (Time Entry)
    pub fn create_time_entry(&self, input: CreateTimeEntryInput) -> Result<TimeEntry> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        // Lấy thông tin dự án để xác định đơn giá và tên
        let (project_name, project_color, proj_rate): (String, String, f64) = conn.query_row(
            "SELECT name, color, hourly_rate FROM projects WHERE id = ?1",
            params![input.project_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )?;

        let hourly_rate = input.hourly_rate.unwrap_or(proj_rate);
        let total_amount = input.total_amount.unwrap_or(input.duration_hours * hourly_rate);
        let start_time = input.start_time.unwrap_or_default();
        let end_time = input.end_time.unwrap_or_default();
        let range_display = input.time_range_display.unwrap_or_default();
        let note = input.note.unwrap_or_default();

        conn.execute(
            "INSERT INTO time_entries (
                project_id, work_date, start_time, end_time, time_range_display,
                duration_hours, hourly_rate, total_amount, note, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11);",
            params![
                input.project_id,
                input.work_date,
                start_time,
                end_time,
                range_display,
                input.duration_hours,
                hourly_rate,
                total_amount,
                note,
                now,
                now
            ],
        )?;

        let id = conn.last_insert_rowid();
        Ok(TimeEntry {
            id,
            project_id: input.project_id,
            project_name,
            project_color,
            work_date: input.work_date,
            start_time,
            end_time,
            time_range_display: range_display,
            duration_hours: input.duration_hours,
            hourly_rate,
            total_amount,
            note,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    /// Cập nhật phiên làm việc
    pub fn update_time_entry(&self, input: UpdateTimeEntryInput) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        conn.execute(
            "UPDATE time_entries SET project_id = ?1, work_date = ?2, start_time = ?3,
             end_time = ?4, time_range_display = ?5, duration_hours = ?6, hourly_rate = ?7,
             total_amount = ?8, note = ?9, updated_at = ?10 WHERE id = ?11;",
            params![
                input.project_id,
                input.work_date,
                input.start_time.unwrap_or_default(),
                input.end_time.unwrap_or_default(),
                input.time_range_display.unwrap_or_default(),
                input.duration_hours,
                input.hourly_rate,
                input.total_amount,
                input.note.unwrap_or_default(),
                now,
                input.id
            ],
        )?;
        Ok(())
    }

    /// Xóa phiên làm việc theo ID
    pub fn delete_time_entry(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM time_entries WHERE id = ?1;", params![id])?;
        Ok(())
    }
}
