# TimeTrack - Quản Lý Giờ Làm Việc & Doanh Thu Freelance

Ứng dụng máy tính (Desktop App) cao cấp dành cho Freelancer, Lập trình viên và Nhà sáng tạo nội dung nhằm theo dõi chi tiết thời gian làm việc, tự động tính thành tiền theo đơn giá từng dự án và quản lý dòng tiền, công nợ lũy kế qua các tháng.

---

## 🌟 Tính Năng Nổi Bật

### 1. Quản lý Giờ làm & Dự án Chuyên nghiệp
- **Time Picker chuẩn xác**: Chọn giờ bắt đầu và giờ kết thúc bằng đồng hồ trực quan, tự động tính tổng số giờ làm việc.
- **Hỗ trợ làm ca xuyên đêm (Overnight)**: Tự động phát hiện khi giờ kết thúc nhỏ hơn giờ bắt đầu (ví dụ làm từ 22h00 đến 03h00 sáng hôm sau) và tính đúng thời gian làm thực tế.
- **Đồng hồ bấm giờ trực tiếp (Live Stopwatch)**: Bấm giờ làm việc real-time, tạm dừng và lưu thẳng vào hệ thống khi hoàn thành.
- **Phân loại theo dự án**: Tùy chỉnh đơn giá/giờ theo từng dự án hoặc áp dụng đơn giá chung mặc định.

### 2. Sổ Quản lý Công Nợ & Dư Nợ Lũy Kế
- **Dư nợ chuyển tiếp liên tháng**: Tự động chuyển số dư nợ chưa thanh toán từ tháng trước sang tháng sau để cộng dồn liên tục (không lo sót nợ khi khách thanh toán nửa chừng hoặc nợ gối đầu nhiều tháng).
- **Ghi nhận thanh toán linh hoạt**: Hỗ trợ khách trả nhiều đợt trong tháng, ghi nhận lịch sử ngày giờ và nội dung chuyển khoản chi tiết.
- **Sổ theo dõi công nợ toàn thời gian**: Báo cáo tổng thể toàn bộ doanh thu, số tiền đã nhận và số nợ còn lại của từng khách hàng.

### 3. Tối ưu Trải nghiệm & Tương tác
- **Tự động format tiền tệ**: Nhập số tiền tự động phân cách hàng nghìn (ví dụ: `220.000 đ`).
- **Giao diện Clean Light Theme**: Độ tương phản cao đạt chuẩn trợ năng WCAG 2.1 AA, bố cục đồng nhất chiều cao 100%.
- **Sao chép nhanh 1-Click**:
  - Sao chép dữ liệu dạng bảng (TSV) để dán trực tiếp vào Google Sheets / Excel.
  - Tạo mẫu báo cáo tổng kết chuyên nghiệp gửi khách hàng qua Zalo / Telegram / Email kèm thông tin số tài khoản ngân hàng.

### 4. An toàn & Bảo mật Dữ liệu (Local-First)
- Toàn bộ dữ liệu được lưu trữ trực tiếp trong cơ sở dữ liệu SQLite cục bộ trên máy của bạn.
- Hoạt động 100% Offline, không phụ thuộc vào Internet hay bất kỳ dịch vụ máy chủ bên thứ ba nào.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, React-Select.
- **Desktop Runtime & Backend**: Tauri v2, Rust 2021, SQLite (`rusqlite`).

---

## 📂 Vị Trí Lưu Trữ Dữ Liệu SQLite

File dữ liệu `timetrack.db` được lưu cục bộ theo hệ điều hành:

- **macOS**: `~/Library/Application Support/com.timetrack.app/timetrack.db`
- **Windows**: `%APPDATA%\com.timetrack.app\timetrack.db`
- **Linux**: `~/.local/share/com.timetrack.app/timetrack.db`

---

## 🚀 Hướng Dẫn Phát Triển (Development)

### Yêu cầu môi trường:
- [Node.js](https://nodejs.org/) (phiên bản 18 trở lên)
- [Rust & Cargo](https://www.rust-lang.org/) (phiên bản 1.77 trở lên)

### Cài đặt và khởi chạy:
```bash
# 1. Cài đặt các thư viện Node.js
npm install

# 2. Khởi chạy ứng dụng ở chế độ phát triển
npm run tauri dev
```

---

## 📦 Hướng Dẫn Build File Cài Đặt Để Gửi Cho Mọi Người

Tauri v2 hỗ trợ đóng gói ứng dụng thành file cài đặt độc lập để bạn gửi cho khách hàng, bạn bè hoặc đồng nghiệp sử dụng mà không cần cài đặt Node.js hay Rust.

### 1. Build trên macOS (Tạo file `.dmg` và `.app`)

Chạy lệnh build trong thư mục gốc của dự án:
```bash
npm run tauri build
```

Sau khi build hoàn tất, các file cài đặt sẽ nằm tại thư mục:
- **File cài đặt DMG (để gửi cho người khác cài đặt kéo-thả vào Applications)**:
  `src-tauri/target/release/bundle/dmg/TimeTrack_1.0.0_aarch64.dmg` *(cho máy Mac chip Apple Silicon M1/M2/M3/M4)*
  hoặc
  `src-tauri/target/release/bundle/dmg/TimeTrack_1.0.0_x64.dmg` *(cho máy Mac chip Intel)*
- **File ứng dụng App chạy trực tiếp**:
  `src-tauri/target/release/bundle/macos/TimeTrack.app`

> [!NOTE]
> **Xử lý cảnh báo bảo mật Gatekeeper trên macOS khi gửi file cho người khác**:
> Do ứng dụng nội bộ chưa đăng ký chứng chỉ trả phí Apple Developer ($99/năm), macOS sẽ chặn mở lần đầu với thông báo *"TimeTrack is damaged and can't be opened"* hoặc *"Unidentified Developer"*.
> Người nhận chỉ cần mở ứng dụng **Terminal** trên máy Mac của họ và chạy lệnh gỡ nhãn cách ly sau:
> ```bash
> xattr -cr /Applications/TimeTrack.app
> ```
> Hoặc chuột phải vào ứng dụng trong thư mục Applications $\rightarrow$ chọn **Open** $\rightarrow$ bấm **Open** lần nữa là xong.

---

### 2. Build trên Windows (Tạo file `.exe` và `.msi`)

Để đóng gói file cho Windows, bạn thực hiện lệnh build trực tiếp trên máy tính chạy Windows (hoặc thông qua máy ảo/GitHub Actions):
```powershell
npm run tauri build
```

Sau khi build hoàn tất, các file cài đặt sẽ nằm tại thư mục:
- **File cài đặt NSIS Setup (`.exe` - khuyên dùng để gửi cho mọi người)**:
  `src-tauri/target/release/bundle/nsis/TimeTrack_1.0.0_x64-setup.exe`
- **File cài đặt Windows Installer (`.msi`)**:
  `src-tauri/target/release/bundle/msi/TimeTrack_1.0.0_x64_en-US.msi`

---

### 3. Tự Động Hóa Build Đa Nền Tảng (Khuyên dùng khi muốn phát hành cả Win & Mac)

Bạn có thể đưa mã nguồn lên GitHub và dùng **GitHub Actions** với workflow Tauri Action có sẵn (`tauri-apps/tauri-action`) để tự động biên dịch và tạo link tải cả file `.dmg` cho Mac và `.exe` cho Windows mỗi khi gắn thẻ Release tag mới.

---

## 📄 Bản Quyền & Giấy Phép
Dự án được phát triển riêng bởi **Phan Trung Phú** phục vụ công việc quản lý tài chính và giờ làm việc cá nhân.
