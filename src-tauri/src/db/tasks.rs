use chrono::Local;
use rusqlite::{params, Result};

use crate::db::Database;
use crate::models::{
    BatchCreateWeeklyTasksInput, CreateWeeklyTaskInput, UpdateWeeklyTaskInput, WeeklyTask,
};

impl Database {
    /// Lấy danh sách Task theo Tháng và tùy chọn lọc theo Tuần trong tháng, Trạng thái, Tag dự án
    pub fn get_weekly_tasks(
        &self,
        month: &str,
        week_of_month: Option<i64>,
        status: Option<&str>,
        category: Option<&str>,
    ) -> Result<Vec<WeeklyTask>> {
        let conn = self.conn.lock().unwrap();

        let mut conditions = vec!["month = ?1".to_string()];
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(month.to_string())];

        if let Some(w) = week_of_month {
            params_vec.push(Box::new(w));
            conditions.push(format!("week_of_month = ?{}", params_vec.len()));
        }

        if let Some(st) = status {
            if !st.is_empty() && st != "ALL" {
                params_vec.push(Box::new(st.to_string()));
                conditions.push(format!("status = ?{}", params_vec.len()));
            }
        }

        if let Some(cat) = category {
            if !cat.is_empty() && cat != "ALL" {
                params_vec.push(Box::new(cat.to_string()));
                conditions.push(format!("category = ?{}", params_vec.len()));
            }
        }

        let where_clause = conditions.join(" AND ");
        let sql = format!(
            "SELECT id, month, week_of_month, task_key, task_url, title, category,
                    status, priority, deadline, note, order_index, created_at, updated_at
             FROM weekly_tasks
             WHERE {}
             ORDER BY week_of_month ASC, order_index ASC, id ASC",
            where_clause
        );

        let mut stmt = conn.prepare(&sql)?;
        let params_slice: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

        let rows = stmt.query_map(&params_slice[..], |row| {
            Ok(WeeklyTask {
                id: row.get(0)?,
                month: row.get(1)?,
                week_of_month: row.get(2)?,
                task_key: row.get(3)?,
                task_url: row.get(4)?,
                title: row.get(5)?,
                category: row.get(6)?,
                status: row.get(7)?,
                priority: row.get(8)?,
                deadline: row.get(9)?,
                note: row.get(10)?,
                order_index: row.get(11)?,
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

    /// Thêm mới 1 Task công việc theo tuần
    pub fn create_weekly_task(&self, input: CreateWeeklyTaskInput) -> Result<WeeklyTask> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let category = input.category.unwrap_or_default();
        let status = input.status.unwrap_or_else(|| "To do".to_string());
        let priority = input.priority.unwrap_or_else(|| "NORMAL".to_string());
        let deadline = input.deadline.unwrap_or_default();
        let note = input.note.unwrap_or_default();

        // Lấy thứ tự order_index lớn nhất hiện tại của tuần đó
        let max_order: i64 = conn.query_row(
            "SELECT COALESCE(MAX(order_index), 0) FROM weekly_tasks WHERE month = ?1 AND week_of_month = ?2",
            params![input.month, input.week_of_month],
            |r| r.get(0),
        ).unwrap_or(0);

        conn.execute(
            "INSERT INTO weekly_tasks (
                month, week_of_month, task_key, task_url, title, category,
                status, priority, deadline, note, order_index, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13);",
            params![
                input.month,
                input.week_of_month,
                input.task_key,
                input.task_url,
                input.title,
                category,
                status,
                priority,
                deadline,
                note,
                max_order + 1,
                now,
                now
            ],
        )?;

        let id = conn.last_insert_rowid();
        Ok(WeeklyTask {
            id,
            month: input.month,
            week_of_month: input.week_of_month,
            task_key: input.task_key,
            task_url: input.task_url,
            title: input.title,
            category,
            status,
            priority,
            deadline,
            note,
            order_index: max_order + 1,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    /// Cập nhật thông tin chi tiết một Task công việc
    pub fn update_weekly_task(&self, input: UpdateWeeklyTaskInput) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        conn.execute(
            "UPDATE weekly_tasks SET
                month = ?1,
                week_of_month = ?2,
                task_key = ?3,
                task_url = ?4,
                title = ?5,
                category = ?6,
                status = ?7,
                priority = ?8,
                deadline = ?9,
                note = ?10,
                updated_at = ?11
             WHERE id = ?12;",
            params![
                input.month,
                input.week_of_month,
                input.task_key,
                input.task_url,
                input.title,
                input.category,
                input.status,
                input.priority,
                input.deadline,
                input.note,
                now,
                input.id
            ],
        )?;
        Ok(())
    }

    /// Cập nhật nhanh trạng thái (Status) của Task
    pub fn update_task_status(&self, id: i64, status: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        conn.execute(
            "UPDATE weekly_tasks SET status = ?1, updated_at = ?2 WHERE id = ?3;",
            params![status, now, id],
        )?;
        Ok(())
    }

    /// Xóa một Task công việc
    pub fn delete_weekly_task(&self, id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM weekly_tasks WHERE id = ?1;", params![id])?;
        Ok(())
    }

    /// Import hàng loạt Task vào một Tuần trong Tháng (Atomic Transaction)
    pub fn batch_create_weekly_tasks(&self, input: BatchCreateWeeklyTasksInput) -> Result<Vec<WeeklyTask>> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        let mut max_order: i64 = tx.query_row(
            "SELECT COALESCE(MAX(order_index), 0) FROM weekly_tasks WHERE month = ?1 AND week_of_month = ?2",
            params![input.month, input.week_of_month],
            |r| r.get(0),
        ).unwrap_or(0);

        let mut created_list = Vec::new();

        for item in input.tasks {
            max_order += 1;
            let category = item.category.unwrap_or_default();
            let status = item.status.unwrap_or_else(|| "To do".to_string());
            let priority = item.priority.unwrap_or_else(|| "NORMAL".to_string());
            let deadline = item.deadline.unwrap_or_default();
            let note = item.note.unwrap_or_default();

            tx.execute(
                "INSERT INTO weekly_tasks (
                    month, week_of_month, task_key, task_url, title, category,
                    status, priority, deadline, note, order_index, created_at, updated_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13);",
                params![
                    input.month,
                    input.week_of_month,
                    item.task_key,
                    item.task_url,
                    item.title,
                    category,
                    status,
                    priority,
                    deadline,
                    note,
                    max_order,
                    now,
                    now
                ],
            )?;

            let id = tx.last_insert_rowid();
            created_list.push(WeeklyTask {
                id,
                month: input.month.clone(),
                week_of_month: input.week_of_month,
                task_key: item.task_key,
                task_url: item.task_url,
                title: item.title,
                category,
                status,
                priority,
                deadline,
                note,
                order_index: max_order,
                created_at: now.clone(),
                updated_at: now.clone(),
            });
        }

        tx.commit()?;
        Ok(created_list)
    }
}
