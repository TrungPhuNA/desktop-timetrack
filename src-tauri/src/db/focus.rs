use rusqlite::{params, Result};

use crate::db::Database;
use crate::models::{FocusSettings, SaveFocusSettingsInput};

impl Database {
    /// Lấy cấu hình tính năng Nhắc nhở tập trung (Focus Reminder)
    pub fn get_focus_settings(&self) -> Result<FocusSettings> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, enabled, message, start_time, end_time, interval_minutes, days_of_week, sound_enabled
             FROM focus_settings WHERE id = 1",
            [],
            |r| {
                let enabled_int: i64 = r.get(1)?;
                let sound_int: i64 = r.get(7)?;
                Ok(FocusSettings {
                    id: r.get(0)?,
                    enabled: enabled_int != 0,
                    message: r.get(2)?,
                    start_time: r.get(3)?,
                    end_time: r.get(4)?,
                    interval_minutes: r.get(5)?,
                    days_of_week: r.get(6)?,
                    sound_enabled: sound_int != 0,
                })
            },
        )
    }

    /// Cập nhật cấu hình Nhắc nhở tập trung (Focus Reminder)
    pub fn save_focus_settings(&self, input: SaveFocusSettingsInput) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let enabled = if input.enabled { 1 } else { 0 };
        let sound = if input.sound_enabled { 1 } else { 0 };

        conn.execute(
            "UPDATE focus_settings SET 
                enabled = ?1, 
                message = ?2, 
                start_time = ?3, 
                end_time = ?4, 
                interval_minutes = ?5, 
                days_of_week = ?6, 
                sound_enabled = ?7 
             WHERE id = 1;",
            params![
                enabled,
                input.message,
                input.start_time,
                input.end_time,
                input.interval_minutes,
                input.days_of_week,
                sound
            ],
        )?;
        Ok(())
    }
}
