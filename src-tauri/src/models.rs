use serde::{Deserialize, Serialize};

/// Thông tin Dự án / Khách hàng
/// Mục đích: Quản lý tên dự án, đơn giá tính theo giờ, màu sắc tag nhận diện
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub hourly_rate: f64,
    pub color: String,
    pub description: String,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

/// DTO Input khi tạo mới Dự án
#[derive(Debug, Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub hourly_rate: f64,
    pub color: Option<String>,
    pub description: Option<String>,
}

/// DTO Input khi cập nhật Dự án
#[derive(Debug, Deserialize)]
pub struct UpdateProjectInput {
    pub id: i64,
    pub name: String,
    pub hourly_rate: f64,
    pub color: String,
    pub description: String,
    pub is_archived: bool,
}

/// Dữ liệu ghi nhận một phiên làm việc (Time Entry / Log)
/// Mục đích: Lưu ngày làm, khung thời gian, số giờ thực tế, đơn giá giờ, thành tiền và ghi chú
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeEntry {
    pub id: i64,
    pub project_id: i64,
    pub project_name: String,
    pub project_color: String,
    pub work_date: String,         // Định dạng YYYY-MM-DD
    pub start_time: String,        // Ví dụ: 21:40 hoặc 21h40
    pub end_time: String,          // Ví dụ: 02:40 hoặc 02h40
    pub time_range_display: String,// Ví dụ: 21h40 - 02h40 (5h)
    pub duration_hours: f64,       // Số giờ làm, ví dụ 2.5, 4.0
    pub hourly_rate: f64,          // Đơn giá áp dụng tại thời điểm làm việc
    pub total_amount: f64,         // Thành tiền = duration_hours * hourly_rate
    pub note: String,              // Nội dung công việc (Meet, Fix bug...)
    pub created_at: String,
    pub updated_at: String,
}

/// DTO Input khi tạo mới Time Entry
#[derive(Debug, Deserialize)]
pub struct CreateTimeEntryInput {
    pub project_id: i64,
    pub work_date: String,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub time_range_display: Option<String>,
    pub duration_hours: f64,
    pub hourly_rate: Option<f64>, // Nếu None sẽ lấy theo hourly_rate của dự án
    pub total_amount: Option<f64>, // Nếu None sẽ tự động tính = duration_hours * hourly_rate
    pub note: Option<String>,
}

/// DTO Input khi cập nhật Time Entry
#[derive(Debug, Deserialize)]
pub struct UpdateTimeEntryInput {
    pub id: i64,
    pub project_id: i64,
    pub work_date: String,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub time_range_display: Option<String>,
    pub duration_hours: f64,
    pub hourly_rate: f64,
    pub total_amount: f64,
    pub note: Option<String>,
}

/// Ghi nhận một đợt thanh toán từ khách hàng (Payment)
/// Mục đích: Quản lý dòng tiền khách trả dần, trả nửa hoặc trả dồn nhiều tháng
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payment {
    pub id: i64,
    pub project_id: i64,
    pub project_name: String,
    pub amount: f64,
    pub paid_date: String, // Định dạng YYYY-MM-DD
    pub note: String,      // Ví dụ: Chuyển khoản đợt 1, Ứng trước...
    pub created_at: String,
}

/// DTO Input khi tạo mới Thanh toán
#[derive(Debug, Deserialize)]
pub struct CreatePaymentInput {
    pub project_id: i64,
    pub amount: f64,
    pub paid_date: String,
    pub note: Option<String>,
}

/// DTO Input khi cập nhật Thanh toán
#[derive(Debug, Deserialize)]
pub struct UpdatePaymentInput {
    pub id: i64,
    pub project_id: i64,
    pub amount: f64,
    pub paid_date: String,
    pub note: Option<String>,
}

/// Thống kê chi tiết theo từng Dự án trong tháng
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMonthlyStat {
    pub project_id: i64,
    pub project_name: String,
    pub project_color: String,
    pub hourly_rate: f64,
    pub total_hours: f64,
    pub total_amount: f64,
    pub entry_count: i64,
}

/// Thống kê lũy kế công nợ theo từng dự án
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectDebtItem {
    pub project_id: i64,
    pub project_name: String,
    pub project_color: String,
    pub total_earned_all_time: f64, // Tổng tiền đã làm từ trước tới nay
    pub total_paid_all_time: f64,   // Tổng tiền khách đã thanh toán từ trước tới nay
    pub balance_due: f64,           // Dư nợ còn lại = total_earned - total_paid
}

/// Báo cáo tổng hợp theo Tháng (Monthly Financial Summary)
/// Mục đích: Bóc tách nợ cũ kỳ trước chuyển sang, phát sinh tháng này, tiền đã thu, và dư nợ chuyển tiếp sang tháng sau
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlySummary {
    pub month: String,                  // Định dạng YYYY-MM (Ví dụ: 2026-10)
    pub total_hours: f64,               // Tổng số giờ làm việc trong tháng
    pub current_month_earned: f64,      // Tổng tiền làm được trong tháng
    pub prev_debt_brought_forward: f64, // Dư nợ cũ từ các tháng trước chuyển sang
    pub current_month_paid: f64,        // Tổng số tiền khách đã thanh toán trong tháng
    pub total_due_remaining: f64,       // Dư nợ cuối tháng = (Nợ cũ + Tiền làm tháng này) - Tiền đã thanh toán
    pub project_stats: Vec<ProjectMonthlyStat>,
}

/// Cấu hình hệ thống & Thông tin thanh toán cá nhân
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub id: i64,
    pub default_hourly_rate: f64,
    pub currency_symbol: String,
    pub bank_name: String,
    pub bank_account_no: String,
    pub bank_account_name: String,
    pub enable_desktop_notify: bool,
}

/// DTO Input lưu cấu hình hệ thống
#[derive(Debug, Deserialize)]
pub struct SaveSettingsInput {
    pub default_hourly_rate: f64,
    pub currency_symbol: String,
    pub bank_name: String,
    pub bank_account_no: String,
    pub bank_account_name: String,
    pub enable_desktop_notify: bool,
}

/// Cấu hình tính năng Nhắc nhở tập trung (Focus Reminder)
/// Mục đích: Nhắc nhở người dùng "Im lặng làm việc" theo khung giờ và chu kỳ cài đặt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusSettings {
    pub id: i64,
    pub enabled: bool,
    pub message: String,
    pub start_time: String,        // Định dạng "HH:mm", ví dụ: "09:00"
    pub end_time: String,          // Định dạng "HH:mm", ví dụ: "18:00"
    pub interval_minutes: i64,     // Ví dụ: 30 hoặc 60
    pub days_of_week: String,      // Ví dụ: "1,2,3,4,5" (T2 -> T6)
    pub sound_enabled: bool,
}

/// DTO Input khi lưu cấu hình Focus Reminder
#[derive(Debug, Deserialize)]
pub struct SaveFocusSettingsInput {
    pub enabled: bool,
    pub message: String,
    pub start_time: String,
    pub end_time: String,
    pub interval_minutes: i64,
    pub days_of_week: String,
    pub sound_enabled: bool,
}
