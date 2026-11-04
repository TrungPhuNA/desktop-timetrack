use chrono::Local;
use rusqlite::{params, Result};

use crate::db::Database;
use crate::models::{
    CreatePaymentInput, MonthlySummary, Payment, ProjectDebtItem,
    ProjectMonthlyStat, UpdatePaymentInput,
};

impl Database {
    /// Lấy danh sách các khoản thanh toán từ khách, hỗ trợ lọc theo Tháng và Dự án
    pub fn get_payments(&self, month: Option<String>, project_id: Option<i64>) -> Result<Vec<Payment>> {
        let conn = self.conn.lock().unwrap();
        let mut conditions = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(ref m) = month {
            conditions.push("substr(pay.paid_date, 1, 7) = ?");
            params_vec.push(Box::new(m.clone()));
        }
        if let Some(pid) = project_id {
            conditions.push("pay.project_id = ?");
            params_vec.push(Box::new(pid));
        }

        let where_clause = if conditions.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", conditions.join(" AND "))
        };

        let sql = format!(
            "SELECT pay.id, pay.project_id, COALESCE(p.name, 'Chưa gán'), pay.amount, pay.paid_date, pay.note, pay.created_at
             FROM payments pay
             LEFT JOIN projects p ON pay.project_id = p.id
             {}
             ORDER BY pay.paid_date DESC, pay.id DESC",
            where_clause
        );

        let mut stmt = conn.prepare(&sql)?;
        let params_slice: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

        let rows = stmt.query_map(&params_slice[..], |row| {
            Ok(Payment {
                id: row.get(0)?,
                project_id: row.get(1)?,
                project_name: row.get(2)?,
                amount: row.get(3)?,
                paid_date: row.get(4)?,
                note: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    /// Ghi nhận một khoản thanh toán mới
    pub fn create_payment(&self, input: CreatePaymentInput) -> Result<Payment> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let project_name: String = conn.query_row(
            "SELECT name FROM projects WHERE id = ?1",
            params![input.project_id],
            |r| r.get(0),
        )?;

        let note = input.note.unwrap_or_default();
        conn.execute(
            "INSERT INTO payments (project_id, amount, paid_date, note, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5);",
            params![input.project_id, input.amount, input.paid_date, note, now],
        )?;

        let id = conn.last_insert_rowid();
        Ok(Payment {
            id,
            project_id: input.project_id,
            project_name,
            amount: input.amount,
            paid_date: input.paid_date,
            note,
            created_at: now,
        })
    }

    /// Cập nhật thông tin khoản thanh toán
    pub fn update_payment(&self, input: UpdatePaymentInput) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE payments SET project_id = ?1, amount = ?2, paid_date = ?3, note = ?4 WHERE id = ?5;",
            params![
                input.project_id,
                input.amount,
                input.paid_date,
                input.note.unwrap_or_default(),
                input.id
            ],
        )?;
        Ok(())
    }

    /// Xóa khoản thanh toán
    pub fn delete_payment(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM payments WHERE id = ?1;", params![id])?;
        Ok(())
    }

    /// Tính toán báo cáo tài chính của tháng và số dư nợ cũ chuyển sang
    pub fn get_monthly_summary(&self, month: String, project_id: Option<i64>) -> Result<MonthlySummary> {
        let conn = self.conn.lock().unwrap();

        // 1. Tiền làm trong tháng hiện tại và tổng giờ
        let (current_earned, total_hours): (f64, f64) = if let Some(pid) = project_id {
            conn.query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0), COALESCE(SUM(duration_hours), 0.0) 
                 FROM time_entries WHERE substr(work_date, 1, 7) = ?1 AND project_id = ?2",
                params![month, pid],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )?
        } else {
            conn.query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0), COALESCE(SUM(duration_hours), 0.0) 
                 FROM time_entries WHERE substr(work_date, 1, 7) = ?1",
                params![month],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )?
        };

        // 2. Số tiền khách đã thanh toán trong tháng hiện tại
        let current_paid: f64 = if let Some(pid) = project_id {
            conn.query_row(
                "SELECT COALESCE(SUM(amount), 0.0) FROM payments 
                 WHERE substr(paid_date, 1, 7) = ?1 AND project_id = ?2",
                params![month, pid],
                |r| r.get(0),
            )?
        } else {
            conn.query_row(
                "SELECT COALESCE(SUM(amount), 0.0) FROM payments 
                 WHERE substr(paid_date, 1, 7) = ?1",
                params![month],
                |r| r.get(0),
            )?
        };

        // 3. Tính toán dư nợ từ các tháng TRƯỚC ĐÓ chuyển sang (All-time before this month)
        let prev_earned: f64 = if let Some(pid) = project_id {
            conn.query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) FROM time_entries 
                 WHERE substr(work_date, 1, 7) < ?1 AND project_id = ?2",
                params![month, pid],
                |r| r.get(0),
            )?
        } else {
            conn.query_row(
                "SELECT COALESCE(SUM(total_amount), 0.0) FROM time_entries 
                 WHERE substr(work_date, 1, 7) < ?1",
                params![month],
                |r| r.get(0),
            )?
        };

        let prev_paid: f64 = if let Some(pid) = project_id {
            conn.query_row(
                "SELECT COALESCE(SUM(amount), 0.0) FROM payments 
                 WHERE substr(paid_date, 1, 7) < ?1 AND project_id = ?2",
                params![month, pid],
                |r| r.get(0),
            )?
        } else {
            conn.query_row(
                "SELECT COALESCE(SUM(amount), 0.0) FROM payments 
                 WHERE substr(paid_date, 1, 7) < ?1",
                params![month],
                |r| r.get(0),
            )?
        };

        let prev_debt = prev_earned - prev_paid;
        let total_due = (prev_debt + current_earned) - current_paid;

        // 4. Lấy thống kê theo từng dự án trong tháng này
        let mut proj_stmt = conn.prepare(
            "SELECT p.id, p.name, p.color, p.hourly_rate, 
                    COALESCE(SUM(t.duration_hours), 0.0), 
                    COALESCE(SUM(t.total_amount), 0.0),
                    COUNT(t.id)
             FROM projects p
             LEFT JOIN time_entries t ON p.id = t.project_id AND substr(t.work_date, 1, 7) = ?1
             WHERE p.is_archived = 0 OR t.id IS NOT NULL
             GROUP BY p.id
             HAVING COUNT(t.id) > 0
             ORDER BY COALESCE(SUM(t.total_amount), 0.0) DESC"
        )?;

        let proj_rows = proj_stmt.query_map(params![month], |r| {
            Ok(ProjectMonthlyStat {
                project_id: r.get(0)?,
                project_name: r.get(1)?,
                project_color: r.get(2)?,
                hourly_rate: r.get(3)?,
                total_hours: r.get(4)?,
                total_amount: r.get(5)?,
                entry_count: r.get(6)?,
            })
        })?;

        let mut project_stats = Vec::new();
        for pr in proj_rows {
            project_stats.push(pr?);
        }

        Ok(MonthlySummary {
            month,
            total_hours,
            current_month_earned: current_earned,
            prev_debt_brought_forward: prev_debt,
            current_month_paid: current_paid,
            total_due_remaining: total_due,
            project_stats,
        })
    }

    /// Lấy bảng tổng hợp công nợ toàn thời gian theo từng dự án
    pub fn get_project_debt_summary(&self) -> Result<Vec<ProjectDebtItem>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT p.id, p.name, p.color,
                    COALESCE((SELECT SUM(total_amount) FROM time_entries WHERE project_id = p.id), 0.0) AS earned,
                    COALESCE((SELECT SUM(amount) FROM payments WHERE project_id = p.id), 0.0) AS paid
             FROM projects p
             ORDER BY (COALESCE((SELECT SUM(total_amount) FROM time_entries WHERE project_id = p.id), 0.0) - 
                       COALESCE((SELECT SUM(amount) FROM payments WHERE project_id = p.id), 0.0)) DESC, p.name ASC"
        )?;

        let rows = stmt.query_map([], |r| {
            let earned: f64 = r.get(3)?;
            let paid: f64 = r.get(4)?;
            Ok(ProjectDebtItem {
                project_id: r.get(0)?,
                project_name: r.get(1)?,
                project_color: r.get(2)?,
                total_earned_all_time: earned,
                total_paid_all_time: paid,
                balance_due: earned - paid,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }
}
