import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { FocusSettings } from "../types";

export type FocusSoundTheme = "crystal" | "marimba" | "zen";

/**
 * Phát giai điệu chuông du dương, êm tai bằng Web Audio API
 * Thiết kế các hợp âm cao cấp (Crystal Arpeggio, Marimba vui vẻ, Zen thiền định)
 */
export const playFocusChimeSound = (theme: FocusSoundTheme = "crystal") => {
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // Cấu hình các nốt giai điệu (Tần số, thời điểm bắt đầu, độ vang)
        let notes: { freq: number; delay: number; duration: number; gain: number }[] = [];

        if (theme === "marimba") {
            // Giai điệu Đàn Gỗ Marimba / Kalimba: Tươi vui, rộn ràng, bắt tai
            notes = [
                { freq: 523.25, delay: 0.0, duration: 0.5, gain: 0.22 },  // C5
                { freq: 659.25, delay: 0.11, duration: 0.5, gain: 0.24 }, // E5
                { freq: 783.99, delay: 0.22, duration: 0.6, gain: 0.26 }, // G5
                { freq: 880.0, delay: 0.33, duration: 0.6, gain: 0.28 },  // A5
                { freq: 1046.5, delay: 0.44, duration: 1.2, gain: 0.30 }, // C6
            ];
        } else if (theme === "zen") {
            // Giai điệu Chuông Xoay Tây Tạng: Tĩnh lặng, trầm ấm, thư giãn sâu
            notes = [
                { freq: 432.0, delay: 0.0, duration: 2.5, gain: 0.28 },   // A4 chuẩn tần số chữa lành 432Hz
                { freq: 864.0, delay: 0.05, duration: 2.0, gain: 0.15 },  // Bồi âm 2
                { freq: 1296.0, delay: 0.1, duration: 1.6, gain: 0.08 },  // Bồi âm 3
            ];
        } else {
            // Mặc định "crystal": Chuông Pha Lê (Crystal Wind Chime) du dương cao cấp (Hợp âm E Major Arpeggio)
            notes = [
                { freq: 659.25, delay: 0.0, duration: 0.8, gain: 0.20 },   // E5
                { freq: 830.61, delay: 0.12, duration: 0.8, gain: 0.22 },  // G#5
                { freq: 987.77, delay: 0.24, duration: 0.9, gain: 0.24 },  // B5
                { freq: 1318.51, delay: 0.36, duration: 1.4, gain: 0.26 }, // E6
                { freq: 1661.22, delay: 0.50, duration: 1.8, gain: 0.28 }, // G#6
            ];
        }

        notes.forEach(({ freq, delay, duration, gain: peakGain }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Phối sóng âm thanh: Marimba dùng sóng triangle ấm áp, Crystal/Zen dùng sine tinh khiết
            osc.type = theme === "marimba" ? "triangle" : "sine";
            osc.frequency.setValueAtTime(freq, now + delay);

            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(peakGain, now + delay + 0.02); // Tấn công âm sắc 20ms
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration); // Độ ngân vang mượt mà

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + duration);
        });
    } catch {
        // Trình duyệt có thể hạn chế autoplay nếu chưa có tương tác
    }
};

/**
 * Gửi thông báo hệ thống Native Notification (macOS Banner / Windows Notification)
 */
export const sendNativeFocusNotification = async (title: string, body: string): Promise<boolean> => {
    try {
        let granted = await isPermissionGranted();
        if (!granted) {
            const permission = await requestPermission();
            granted = permission === "granted";
        }

        if (granted) {
            sendNotification({ title, body });
            return true;
        }
    } catch (e) {
        console.warn("Không thể kích hoạt thông báo Native OS:", e);
    }
    return false;
};

/**
 * Kiểm tra xem thời điểm hiện tại có thỏa mãn điều kiện thông báo không
 * @param settings Cấu hình Focus Settings hiện tại
 * @param lastTriggeredKey Slot thời gian đã thông báo gần nhất
 */
export const checkFocusSchedule = (
    settings: FocusSettings,
    lastTriggeredKey: string | null
): { shouldTrigger: boolean; currentSlotKey: string | null } => {
    if (!settings.enabled) {
        return { shouldTrigger: false, currentSlotKey: null };
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0: CN, 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7

    // 1. Kiểm tra ngày trong tuần
    const allowedDays = settings.days_of_week.split(",").map((d) => d.trim());
    if (!allowedDays.includes(String(currentDay))) {
        return { shouldTrigger: false, currentSlotKey: null };
    }

    // 2. Kiểm tra khung giờ (VD: 09:00 -> 18:00)
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = settings.start_time.split(":").map(Number);
    const [endH, endM] = settings.end_time.split(":").map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return { shouldTrigger: false, currentSlotKey: null };
    }

    // 3. Kiểm tra chu kỳ (30 phút hoặc 60 phút)
    const minute = now.getMinutes();
    const interval = settings.interval_minutes || 30;

    // Tính mốc slot hiện tại
    const slotBucket = Math.floor(minute / interval) * interval;
    const isAtSlotMinute = minute % interval === 0;

    const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const slotKey = `${dateKey}_${now.getHours()}:${String(slotBucket).padStart(2, "0")}`;

    // Nếu vừa đúng mốc phút của chu kỳ và chưa báo trong slot này
    if (isAtSlotMinute && slotKey !== lastTriggeredKey) {
        return { shouldTrigger: true, currentSlotKey: slotKey };
    }

    return { shouldTrigger: false, currentSlotKey: null };
};
