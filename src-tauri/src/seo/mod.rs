pub mod ai_claude;
pub mod ai_gemini;
pub mod ai_orchestrator;
pub mod commands;
pub mod crawler;
pub mod db_articles;
pub mod db_configs;
pub mod db_schema;
pub mod models;
pub mod prompts;

use std::sync::Mutex;
use tokio_util::sync::CancellationToken;

/// Quản lý trạng thái hủy stream AI (CancellationToken) an toàn thread-safe
/// Mục đích: Cho phép người dùng bấm nút "Dừng" để ngắt luồng stream Claude/Gemini tức thì
pub struct SeoStreamState {
    pub active_token: Mutex<Option<CancellationToken>>,
}

impl Default for SeoStreamState {
    fn default() -> Self {
        Self {
            active_token: Mutex::new(None),
        }
    }
}

impl SeoStreamState {
    /// Hủy token cũ (nếu còn chạy) và cấp phát CancellationToken mới cho phiên stream hiện tại
    pub fn reset_and_create_token(&self) -> CancellationToken {
        let mut guard = self.active_token.lock().unwrap();
        if let Some(old_token) = guard.take() {
            old_token.cancel();
        }
        let new_token = CancellationToken::new();
        *guard = Some(new_token.clone());
        new_token
    }

    /// Kích hoạt hủy phiên stream đang chạy (khi người dùng bấm nút Dừng)
    pub fn cancel_active(&self) -> bool {
        let mut guard = self.active_token.lock().unwrap();
        if let Some(token) = guard.take() {
            token.cancel();
            return true;
        }
        false
    }

    /// Dọn dẹp token sau khi stream kết thúc tự nhiên
    pub fn clear_if_done(&self) {
        let mut guard = self.active_token.lock().unwrap();
        *guard = None;
    }
}
