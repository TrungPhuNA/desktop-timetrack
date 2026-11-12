import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { FreelanceView } from "./components/FreelanceView";
import { WeeklyTaskView } from "./components/WeeklyTaskView";
import { AppModals, ConfirmState } from "./components/AppModals";
import { checkFocusSchedule, FocusSoundTheme, playFocusChimeSound, sendNativeFocusNotification } from "./services/focusScheduler";
import { api } from "./services/api";
import {
    AppSettings,
    BatchCreateWeeklyTasksInput,
    CreatePaymentInput,
    CreateProjectInput,
    CreateTimeEntryInput,
    CreateWeeklyTaskInput,
    FocusSettings,
    MonthlySummary,
    Payment,
    Project,
    SaveFocusSettingsInput,
    SaveSettingsInput,
    TaskStatus,
    TimeEntry,
    UpdateProjectInput,
    UpdateTimeEntryInput,
    UpdateWeeklyTaskInput,
    WeeklyTask,
} from "./types";

/**
 * Lấy tháng hiện tại theo thời gian thực tế của hệ điều hành (Định dạng "YYYY-MM")
 */
const getCurrentRealMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
};

/**
 * Ứng dụng chính TimeTrack - Giao diện Sáng Sang Trọng (Clean Light Theme)
 */
export default function App() {
    // Phân hệ đang hoạt động (Chấm công freelance hoặc Task công ty theo tuần)
    const [activeTab, setActiveTab] = useState<"freelance" | "tasks">("freelance");

    // Tháng hiện tại được chọn (Tự động lấy tháng thực tế hiện tại của hệ thống)
    const [currentMonth, setCurrentMonth] = useState<string>(getCurrentRealMonth);

    // Trạng thái dữ liệu Freelance
    const [projects, setProjects] = useState<Project[]>([]);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [summary, setSummary] = useState<MonthlySummary | null>(null);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Trạng thái dữ liệu Task Công Ty Theo Tuần
    const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
    const [editingTask, setEditingTask] = useState<WeeklyTask | null>(null);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
    const [selectedWeekForTask, setSelectedWeekForTask] = useState<number>(2);

    // Trạng thái các Modals Freelance
    const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
    const [isDebtModalOpen, setIsDebtModalOpen] = useState<boolean>(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
    const [isFocusModalOpen, setIsFocusModalOpen] = useState<boolean>(false);

    // Trạng thái Nhắc nhở tập trung (Focus Reminder: Im lặng làm việc)
    const [focusSettings, setFocusSettings] = useState<FocusSettings | null>(null);
    const [activeFocusAlert, setActiveFocusAlert] = useState<string | null>(null);
    const lastTriggeredSlotRef = useRef<string | null>(null);

    // Trạng thái ConfirmModal (Xác nhận xóa an toàn)
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: async () => {},
    });

    // Tải toàn bộ dữ liệu cần thiết theo tháng (Hỗ trợ tải ngầm không chớp màn hình)
    const loadData = async (showSkeleton = true) => {
        try {
            if (showSkeleton) setLoading(true);
            const [projData, entryData, payData, sumData, settData, focusData, tasksData] = await Promise.all([
                api.getProjects(true),
                api.getTimeEntries(currentMonth, selectedProjectId || undefined),
                api.getPayments(currentMonth, selectedProjectId || undefined),
                api.getMonthlySummary(currentMonth, selectedProjectId || undefined),
                api.getSettings(),
                api.getFocusSettings(),
                api.getWeeklyTasks(currentMonth),
            ]);

            setProjects(projData);
            setEntries(entryData);
            setPayments(payData);
            setSummary(sumData);
            setSettings(settData);
            setFocusSettings(focusData);
            setWeeklyTasks(tasksData);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu TimeTrack:", error);
        } finally {
            if (showSkeleton) setLoading(false);
        }
    };

    // Tự động tải lại khi đổi tháng hoặc đổi bộ lọc dự án
    useEffect(() => {
        loadData();
    }, [currentMonth, selectedProjectId]);

    // Bộ đếm kiểm tra định kỳ tính năng nhắc nhở "Im lặng làm việc" (chạy mỗi 20 giây)
    useEffect(() => {
        if (!focusSettings || !focusSettings.enabled) return;

        const checkInterval = () => {
            const { shouldTrigger, currentSlotKey } = checkFocusSchedule(focusSettings, lastTriggeredSlotRef.current);
            if (shouldTrigger && currentSlotKey) {
                lastTriggeredSlotRef.current = currentSlotKey;

                // 1. Âm thanh chuông dịu nhẹ nếu bật
                if (focusSettings.sound_enabled) {
                    playFocusChimeSound();
                }

                // 2. Gửi thông báo hệ thống Native OS
                sendNativeFocusNotification("TimeTrack - Nhắc Nhở Tập Trung", `🤫 ${focusSettings.message}`);

                // 3. Hiển thị alert banner trên giao diện
                setActiveFocusAlert(focusSettings.message);
            }
        };

        checkInterval();
        const intervalId = setInterval(checkInterval, 20000);
        return () => clearInterval(intervalId);
    }, [focusSettings]);

    // Xử lý lưu cấu hình nhắc nhở tập trung
    const handleSaveFocusSettings = async (input: SaveFocusSettingsInput) => {
        await api.saveFocusSettings(input);
        const updated = await api.getFocusSettings();
        setFocusSettings(updated);
    };

    // Xử lý thử nghiệm bắn thông báo ngay lập tức
    const handleTestFocusNotification = (testMsg: string, sound: boolean, theme: FocusSoundTheme = "crystal") => {
        if (sound) {
            playFocusChimeSound(theme);
        }
        sendNativeFocusNotification("TimeTrack - Thử Nghiệm Nhắc Nhở", `🤫 ${testMsg}`);
        setActiveFocusAlert(testMsg);
    };

    // ==========================================
    // CÁC THAO TÁC CRUD PHIÊN LÀM VIỆC (TIME ENTRY)
    // ==========================================

    const handleOpenCreateEntry = () => {
        setEditingEntry(null);
        setIsEntryModalOpen(true);
    };

    const handleOpenEditEntry = (entry: TimeEntry) => {
        setEditingEntry(entry);
        setIsEntryModalOpen(true);
    };

    const handleDuplicateEntry = async (entry: TimeEntry) => {
        try {
            await api.createTimeEntry({
                project_id: entry.project_id,
                work_date: new Date().toISOString().split("T")[0],
                start_time: entry.start_time,
                end_time: entry.end_time,
                time_range_display: entry.time_range_display,
                duration_hours: entry.duration_hours,
                hourly_rate: entry.hourly_rate,
                total_amount: entry.total_amount,
                note: entry.note,
            });
            await loadData(false);
        } catch (error) {
            console.error("Lỗi nhân bản phiên làm việc:", error);
        }
    };

    const handleSaveCreateEntry = async (input: CreateTimeEntryInput) => {
        await api.createTimeEntry(input);
        await loadData(false);
    };

    const handleSaveUpdateEntry = async (input: UpdateTimeEntryInput) => {
        await api.updateTimeEntry(input);
        await loadData(false);
    };

    const handleDeleteEntry = (id: number) => {
        setConfirmState({
            isOpen: true,
            title: "Xác nhận xóa giờ làm",
            message: "Bạn có chắc chắn muốn xóa phiên làm việc này khỏi hệ thống không?",
            onConfirm: async () => {
                await api.deleteTimeEntry(id);
                setConfirmState((prev) => ({ ...prev, isOpen: false }));
                await loadData(false);
            },
        });
    };

    // ==========================================
    // CÁC THAO TÁC CRUD THANH TOÁN (PAYMENTS)
    // ==========================================

    const handleSavePayment = async (input: CreatePaymentInput) => {
        await api.createPayment(input);
        await loadData(false);
    };

    const handleDeletePayment = (id: number) => {
        setConfirmState({
            isOpen: true,
            title: "Xác nhận xóa đợt thanh toán",
            message: "Bạn có chắc chắn muốn xóa khoản tiền thanh toán này không?",
            onConfirm: async () => {
                await api.deletePayment(id);
                setConfirmState((prev) => ({ ...prev, isOpen: false }));
                await loadData(false);
            },
        });
    };

    // ==========================================
    // CÁC THAO TÁC CRUD DỰ ÁN (PROJECTS)
    // ==========================================

    const handleSaveCreateProject = async (input: CreateProjectInput) => {
        await api.createProject(input);
        await loadData(false);
    };

    const handleSaveUpdateProject = async (input: UpdateProjectInput) => {
        await api.updateProject(input);
        await loadData(false);
    };

    const handleDeleteProject = (id: number) => {
        const target = projects.find((p) => p.id === id);
        const projName = target?.name || "Dự án";

        setConfirmState({
            isOpen: true,
            title: `Xác nhận xóa dự án "${projName}"`,
            message: `Hành động này sẽ xóa vĩnh viễn dự án "${projName}" cùng toàn bộ lịch sử giờ làm việc và thanh toán liên quan. Bạn có chắc chắn muốn tiếp tục?`,
            onConfirm: async () => {
                await api.deleteProject(id);
                if (selectedProjectId === id) {
                    setSelectedProjectId(null);
                }
                setConfirmState((prev) => ({ ...prev, isOpen: false }));
                await loadData(false);
            },
        });
    };

    // ==========================================
    // CÀI ĐẶT HỆ THỐNG
    // ==========================================

    const handleSaveSettings = async (input: SaveSettingsInput) => {
        await api.saveSettings(input);
        await loadData(false);
    };

    // ==========================================
    // CÁC THAO TÁC TASK CÔNG TY THEO TUẦN
    // ==========================================

    const handleOpenCreateTask = (week: number) => {
        setSelectedWeekForTask(week);
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const handleOpenBatchImport = (week: number) => {
        setSelectedWeekForTask(week);
        setIsBatchModalOpen(true);
    };

    const handleEditTask = (task: WeeklyTask) => {
        setEditingTask(task);
        setSelectedWeekForTask(task.week_of_month);
        setIsTaskModalOpen(true);
    };

    const handleDeleteTask = (id: number, taskKey: string) => {
        setConfirmState({
            isOpen: true,
            title: `Xác nhận xóa task ${taskKey}`,
            message: `Bạn có chắc chắn muốn xóa task "${taskKey}" không? Thao tác này không thể hoàn tác.`,
            onConfirm: async () => {
                await api.deleteWeeklyTask(id);
                const updated = await api.getWeeklyTasks(currentMonth);
                setWeeklyTasks(updated);
                setConfirmState((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    const handleUpdateTaskStatus = async (id: number, status: TaskStatus) => {
        await api.updateTaskStatus(id, status);
        const updated = await api.getWeeklyTasks(currentMonth);
        setWeeklyTasks(updated);
    };

    const handleSaveCreateTask = async (input: CreateWeeklyTaskInput) => {
        await api.createWeeklyTask(input);
        const updated = await api.getWeeklyTasks(currentMonth);
        setWeeklyTasks(updated);
    };

    const handleSaveUpdateTask = async (input: UpdateWeeklyTaskInput) => {
        await api.updateWeeklyTask(input);
        const updated = await api.getWeeklyTasks(currentMonth);
        setWeeklyTasks(updated);
    };

    const handleSaveBatchTasks = async (input: BatchCreateWeeklyTasksInput) => {
        await api.batchCreateWeeklyTasks(input);
        const updated = await api.getWeeklyTasks(currentMonth);
        setWeeklyTasks(updated);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
            {/* Header điều hướng & chọn tháng */}
            <Header
                activeTab={activeTab}
                onTabChange={setActiveTab}
                currentMonth={currentMonth}
                onChangeMonth={setCurrentMonth}
                onOpenCreateEntry={handleOpenCreateEntry}
                onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
                onOpenProjectModal={() => setIsProjectModalOpen(true)}
                onOpenDebtModal={() => setIsDebtModalOpen(true)}
                onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
                onOpenFocusModal={() => setIsFocusModalOpen(true)}
                isFocusEnabled={focusSettings?.enabled}
            />

            {/* Nội dung chính */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
                {activeTab === "freelance" ? (
                    <FreelanceView
                        loading={loading}
                        summary={summary}
                        entries={entries}
                        projects={projects}
                        settings={settings}
                        currentMonth={currentMonth}
                        selectedProjectId={selectedProjectId}
                        onSelectProject={setSelectedProjectId}
                        onEditEntry={handleOpenEditEntry}
                        onDeleteEntry={handleDeleteEntry}
                        onDuplicateEntry={handleDuplicateEntry}
                    />
                ) : (
                    <WeeklyTaskView
                        currentMonth={currentMonth}
                        onChangeMonth={setCurrentMonth}
                        tasks={weeklyTasks}
                        onRefresh={async () => {
                            const updated = await api.getWeeklyTasks(currentMonth);
                            setWeeklyTasks(updated);
                        }}
                        onOpenCreateTask={handleOpenCreateTask}
                        onOpenBatchImport={handleOpenBatchImport}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        onUpdateStatus={handleUpdateTaskStatus}
                    />
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-3.5 text-center text-xs text-slate-500 whitespace-nowrap shadow-2xs">
                TimeTrack &copy; {new Date().getFullYear()} - Quản lý giờ làm việc & Task công ty theo tuần
            </footer>

            {/* Quản lý tập trung toàn bộ Modal của ứng dụng */}
            <AppModals
                isEntryModalOpen={isEntryModalOpen}
                onCloseEntryModal={() => setIsEntryModalOpen(false)}
                editingEntry={editingEntry}
                projects={projects}
                currencySymbol={settings?.currency_symbol || "đ"}
                onSaveCreateEntry={handleSaveCreateEntry}
                onSaveUpdateEntry={handleSaveUpdateEntry}
                isPaymentModalOpen={isPaymentModalOpen}
                onClosePaymentModal={() => setIsPaymentModalOpen(false)}
                payments={payments}
                onSavePayment={handleSavePayment}
                onDeletePayment={handleDeletePayment}
                isProjectModalOpen={isProjectModalOpen}
                onCloseProjectModal={() => setIsProjectModalOpen(false)}
                onSaveCreateProject={handleSaveCreateProject}
                onSaveUpdateProject={handleSaveUpdateProject}
                onDeleteProject={handleDeleteProject}
                isDebtModalOpen={isDebtModalOpen}
                onCloseDebtModal={() => setIsDebtModalOpen(false)}
                isSettingsModalOpen={isSettingsModalOpen}
                onCloseSettingsModal={() => setIsSettingsModalOpen(false)}
                settings={settings}
                onSaveSettings={handleSaveSettings}
                isTaskModalOpen={isTaskModalOpen}
                onCloseTaskModal={() => setIsTaskModalOpen(false)}
                editingTask={editingTask}
                currentMonth={currentMonth}
                selectedWeekForTask={selectedWeekForTask}
                onSaveCreateTask={handleSaveCreateTask}
                onSaveUpdateTask={handleSaveUpdateTask}
                isBatchModalOpen={isBatchModalOpen}
                onCloseBatchModal={() => setIsBatchModalOpen(false)}
                onSaveBatchTasks={handleSaveBatchTasks}
                isFocusModalOpen={isFocusModalOpen}
                onCloseFocusModal={() => setIsFocusModalOpen(false)}
                focusSettings={focusSettings}
                onSaveFocusSettings={handleSaveFocusSettings}
                onTestFocusNotification={handleTestFocusNotification}
                activeFocusAlert={activeFocusAlert}
                onDismissFocusAlert={() => setActiveFocusAlert(null)}
                confirmState={confirmState}
                onCancelConfirm={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}
