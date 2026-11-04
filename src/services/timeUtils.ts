/**
 * Các hàm tiện ích tính toán và chuẩn hóa thời gian làm việc
 */

/**
 * Chuyển đổi chuỗi giờ tự do (VD: "21h40", "21:40") thành chuẩn "HH:mm" cho input type="time"
 */
export function normalizeToTimeInput(val: string): string {
    if (!val) return "";
    const clean = val.replace("h", ":").trim();
    const parts = clean.split(":");
    if (parts.length >= 2) {
        const h = parts[0].padStart(2, "0");
        const m = parts[1].padStart(2, "0");
        return `${h}:${m}`;
    }
    return val;
}

/**
 * Chuyển từ "HH:mm" thành định dạng "HHhMM" (VD: "21:40" -> "21h40")
 */
export function formatToDisplayHour(val: string): string {
    if (!val) return "";
    const [h, m] = val.split(":");
    if (h !== undefined && m !== undefined) {
        return `${h}h${m}`;
    }
    return val;
}

/**
 * Tính toán số giờ làm việc giữa 2 mốc thời gian, tự động nhận diện ca làm xuyên đêm
 */
export function calculateHoursDiff(startStr: string, endStr: string): { hours: number; isOvernight: boolean } {
    if (!startStr || !endStr) return { hours: 0, isOvernight: false };

    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);

    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
        return { hours: 0, isOvernight: false };
    }

    const startTotal = sh * 60 + sm;
    const endTotal = eh * 60 + em;

    let diffMinutes = endTotal - startTotal;
    let isOvernight = false;

    // Ca làm việc xuyên đêm qua ngày hôm sau (VD: 21:40 tối đến 02:40 sáng hôm sau)
    if (diffMinutes < 0) {
        diffMinutes = 1440 - startTotal + endTotal;
        isOvernight = true;
    }

    const rawHours = diffMinutes / 60;
    const roundedHours = Math.round(rawHours * 100) / 100;
    return { hours: roundedHours, isOvernight };
}
