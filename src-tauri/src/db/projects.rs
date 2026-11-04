use chrono::Local;
use rusqlite::{params, Result};

use crate::db::Database;
use crate::models::{CreateProjectInput, Project, UpdateProjectInput};

impl Database {
    /// Lấy danh sách các Dự án (tùy chọn lấy cả dự án đã lưu trữ)
    pub fn get_projects(&self, include_archived: bool) -> Result<Vec<Project>> {
        let conn = self.conn.lock().unwrap();
        let query = if include_archived {
            "SELECT id, name, hourly_rate, color, description, is_archived, created_at, updated_at 
             FROM projects ORDER BY is_archived ASC, name ASC"
        } else {
            "SELECT id, name, hourly_rate, color, description, is_archived, created_at, updated_at 
             FROM projects WHERE is_archived = 0 ORDER BY name ASC"
        };

        let mut stmt = conn.prepare(query)?;
        let rows = stmt.query_map([], |row| {
            let is_archived_int: i64 = row.get(5)?;
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                hourly_rate: row.get(2)?,
                color: row.get(3)?,
                description: row.get(4)?,
                is_archived: is_archived_int != 0,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    /// Tạo mới một Dự án
    pub fn create_project(&self, input: CreateProjectInput) -> Result<Project> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let color = input.color.unwrap_or_else(|| "#6366f1".to_string());
        let desc = input.description.unwrap_or_default();

        conn.execute(
            "INSERT INTO projects (name, hourly_rate, color, description, is_archived, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6);",
            params![input.name, input.hourly_rate, color, desc, now, now],
        )?;

        let id = conn.last_insert_rowid();
        Ok(Project {
            id,
            name: input.name,
            hourly_rate: input.hourly_rate,
            color,
            description: desc,
            is_archived: false,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    /// Cập nhật thông tin Dự án
    pub fn update_project(&self, input: UpdateProjectInput) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
        let archived = if input.is_archived { 1 } else { 0 };

        conn.execute(
            "UPDATE projects SET name = ?1, hourly_rate = ?2, color = ?3, description = ?4, 
             is_archived = ?5, updated_at = ?6 WHERE id = ?7;",
            params![
                input.name,
                input.hourly_rate,
                input.color,
                input.description,
                archived,
                now,
                input.id
            ],
        )?;
        Ok(())
    }

    /// Xóa dự án theo ID (Chủ động xóa sạch các bảng phụ thuộc trong transaction để đảm bảo xóa thành công 100%)
    pub fn delete_project(&self, id: i64) -> Result<()> {
        let mut conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        tx.execute("DELETE FROM time_entries WHERE project_id = ?1;", params![id])?;
        tx.execute("DELETE FROM payments WHERE project_id = ?1;", params![id])?;
        tx.execute("DELETE FROM projects WHERE id = ?1;", params![id])?;
        tx.commit()?;
        Ok(())
    }
}
