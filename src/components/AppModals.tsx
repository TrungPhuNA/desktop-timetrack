import React from "react";
import { TimeEntryModal } from "./TimeEntryModal";
import { PaymentModal } from "./PaymentModal";
import { ProjectModal } from "./ProjectModal";
import { DebtModal } from "./DebtModal";
import { SettingsModal } from "./SettingsModal";
import { TaskModal } from "./TaskModal";
import { BatchImportTaskModal } from "./BatchImportTaskModal";
import { FocusReminderModal } from "./FocusReminderModal";
import { FocusAlertBanner } from "./FocusAlertBanner";
import { ConfirmModal } from "./ConfirmModal";
import {
    AppSettings,
    BatchCreateWeeklyTasksInput,
    CreatePaymentInput,
    CreateProjectInput,
    CreateTimeEntryInput,
    CreateWeeklyTaskInput,
    FocusSettings,
    Payment,
    Project,
    SaveFocusSettingsInput,
    SaveSettingsInput,
    TimeEntry,
    UpdateProjectInput,
    UpdateTimeEntryInput,
    UpdateWeeklyTaskInput,
    WeeklyTask,
} from "../types";
import { FocusSoundTheme } from "../services/focusScheduler";

export interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
}

interface AppModalsProps {
    // Freelance Modals
    isEntryModalOpen: boolean;
    onCloseEntryModal: () => void;
    editingEntry: TimeEntry | null;
    projects: Project[];
    currencySymbol: string;
    onSaveCreateEntry: (input: CreateTimeEntryInput) => Promise<void>;
    onSaveUpdateEntry: (input: UpdateTimeEntryInput) => Promise<void>;

    isPaymentModalOpen: boolean;
    onClosePaymentModal: () => void;
    payments: Payment[];
    onSavePayment: (input: CreatePaymentInput) => Promise<void>;
    onDeletePayment: (id: number) => void;

    isProjectModalOpen: boolean;
    onCloseProjectModal: () => void;
    onSaveCreateProject: (input: CreateProjectInput) => Promise<void>;
    onSaveUpdateProject: (input: UpdateProjectInput) => Promise<void>;
    onDeleteProject: (id: number) => void;

    isDebtModalOpen: boolean;
    onCloseDebtModal: () => void;

    isSettingsModalOpen: boolean;
    onCloseSettingsModal: () => void;
    settings: AppSettings | null;
    onSaveSettings: (input: SaveSettingsInput) => Promise<void>;

    // Weekly Task Modals
    isTaskModalOpen: boolean;
    onCloseTaskModal: () => void;
    editingTask: WeeklyTask | null;
    currentMonth: string;
    selectedWeekForTask: number;
    onSaveCreateTask: (input: CreateWeeklyTaskInput) => Promise<void>;
    onSaveUpdateTask: (input: UpdateWeeklyTaskInput) => Promise<void>;

    isBatchModalOpen: boolean;
    onCloseBatchModal: () => void;
    onSaveBatchTasks: (input: BatchCreateWeeklyTasksInput) => Promise<void>;

    // Focus & System Modals
    isFocusModalOpen: boolean;
    onCloseFocusModal: () => void;
    focusSettings: FocusSettings | null;
    onSaveFocusSettings: (input: SaveFocusSettingsInput) => Promise<void>;
    onTestFocusNotification: (msg: string, sound: boolean, theme: FocusSoundTheme) => void;
    activeFocusAlert: string | null;
    onDismissFocusAlert: () => void;

    confirmState: ConfirmState;
    onCancelConfirm: () => void;
}

/**
 * Quản lý tập trung toàn bộ các Dialog / Modal của ứng dụng
 */
export const AppModals: React.FC<AppModalsProps> = (props) => {
    return (
        <>
            {/* 1. Modal chấm công / phiên làm việc */}
            <TimeEntryModal
                isOpen={props.isEntryModalOpen}
                onClose={props.onCloseEntryModal}
                onSaveCreate={props.onSaveCreateEntry}
                onSaveUpdate={props.onSaveUpdateEntry}
                editingEntry={props.editingEntry}
                projects={props.projects.filter((p) => !p.is_archived)}
                currencySymbol={props.currencySymbol}
            />

            {/* 2. Modal ghi nhận thanh toán */}
            <PaymentModal
                isOpen={props.isPaymentModalOpen}
                onClose={props.onClosePaymentModal}
                payments={props.payments}
                projects={props.projects.filter((p) => !p.is_archived)}
                currencySymbol={props.currencySymbol}
                onSavePayment={props.onSavePayment}
                onDeletePayment={props.onDeletePayment}
            />

            {/* 3. Modal quản lý dự án */}
            <ProjectModal
                isOpen={props.isProjectModalOpen}
                onClose={props.onCloseProjectModal}
                projects={props.projects}
                currencySymbol={props.currencySymbol}
                onSaveCreate={props.onSaveCreateProject}
                onSaveUpdate={props.onSaveUpdateProject}
                onDeleteProject={props.onDeleteProject}
            />

            {/* 4. Modal sổ theo dõi công nợ */}
            <DebtModal
                isOpen={props.isDebtModalOpen}
                onClose={props.onCloseDebtModal}
                currencySymbol={props.currencySymbol}
            />

            {/* 5. Modal cài đặt hệ thống & ngân hàng */}
            <SettingsModal
                isOpen={props.isSettingsModalOpen}
                onClose={props.onCloseSettingsModal}
                settings={props.settings}
                onSaveSettings={props.onSaveSettings}
            />

            {/* 6. Modal thêm / sửa Task công ty theo tuần */}
            <TaskModal
                isOpen={props.isTaskModalOpen}
                onClose={props.onCloseTaskModal}
                editingTask={props.editingTask}
                currentMonth={props.currentMonth}
                currentWeek={props.selectedWeekForTask}
                onSaveCreate={props.onSaveCreateTask}
                onSaveUpdate={props.onSaveUpdateTask}
            />

            {/* 7. Modal nhập nhanh hàng loạt Task */}
            <BatchImportTaskModal
                isOpen={props.isBatchModalOpen}
                onClose={props.onCloseBatchModal}
                currentMonth={props.currentMonth}
                currentWeek={props.selectedWeekForTask}
                onSaveBatch={props.onSaveBatchTasks}
            />

            {/* 8. Modal cài đặt nhắc nhở tập trung */}
            <FocusReminderModal
                isOpen={props.isFocusModalOpen}
                onClose={props.onCloseFocusModal}
                settings={props.focusSettings}
                onSave={props.onSaveFocusSettings}
                onTestNotification={props.onTestFocusNotification}
            />

            {/* 9. Banner cảnh báo Im lặng làm việc */}
            {props.activeFocusAlert && (
                <FocusAlertBanner
                    message={props.activeFocusAlert}
                    onDismiss={props.onDismissFocusAlert}
                />
            )}

            {/* 10. Modal xác nhận an toàn */}
            <ConfirmModal
                isOpen={props.confirmState.isOpen}
                title={props.confirmState.title}
                message={props.confirmState.message}
                onConfirm={props.confirmState.onConfirm}
                onCancel={props.onCancelConfirm}
            />
        </>
    );
};
