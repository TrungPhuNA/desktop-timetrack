use rusqlite::{params, Result};

use crate::db::Database;
use crate::models::{AppSettings, SaveSettingsInput};

impl Database {
    /// Lấy cấu hình hệ thống & thông tin tài khoản nhận tiền
    pub fn get_settings(&self) -> Result<AppSettings> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT id, default_hourly_rate, currency_symbol, bank_name, 
                    bank_account_no, bank_account_name, enable_desktop_notify 
             FROM settings WHERE id = 1",
            [],
            |r| {
                let notify_int: i64 = r.get(6)?;
                Ok(AppSettings {
                    id: r.get(0)?,
                    default_hourly_rate: r.get(1)?,
                    currency_symbol: r.get(2)?,
                    bank_name: r.get(3)?,
                    bank_account_no: r.get(4)?,
                    bank_account_name: r.get(5)?,
                    enable_desktop_notify: notify_int != 0,
                })
            },
        )
    }

    /// Cập nhật cấu hình hệ thống & thông tin tài khoản nhận tiền
    pub fn save_settings(&self, input: SaveSettingsInput) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let notify = if input.enable_desktop_notify { 1 } else { 0 };

        conn.execute(
            "UPDATE settings SET default_hourly_rate = ?1, currency_symbol = ?2, bank_name = ?3,
             bank_account_no = ?4, bank_account_name = ?5, enable_desktop_notify = ?6 WHERE id = 1;",
            params![
                input.default_hourly_rate,
                input.currency_symbol,
                input.bank_name,
                input.bank_account_no,
                input.bank_account_name,
                notify
            ],
        )?;
        Ok(())
    }
}
