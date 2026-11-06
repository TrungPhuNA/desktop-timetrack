import { invoke } from "@tauri-apps/api/core";
import {
    AppSettings,
    CreatePaymentInput,
    CreateProjectInput,
    CreateTimeEntryInput,
    FocusSettings,
    MonthlySummary,
    Payment,
    Project,
    ProjectDebtItem,
    SaveFocusSettingsInput,
    SaveSettingsInput,
    TimeEntry,
    UpdatePaymentInput,
    UpdateProjectInput,
    UpdateTimeEntryInput,
} from "../types";

/**
 * Service API giao tiếp với Rust Backend qua Tauri IPC
 */
export const api = {
    // Projects
    getProjects: async (includeArchived = false): Promise<Project[]> => {
        return invoke<Project[]>("cmd_get_projects", { includeArchived });
    },
    createProject: async (input: CreateProjectInput): Promise<Project> => {
        return invoke<Project>("cmd_create_project", { input });
    },
    updateProject: async (input: UpdateProjectInput): Promise<void> => {
        return invoke<void>("cmd_update_project", { input });
    },
    deleteProject: async (id: number): Promise<void> => {
        return invoke<void>("cmd_delete_project", { id });
    },

    // Time Entries
    getTimeEntries: async (month?: string, projectId?: number): Promise<TimeEntry[]> => {
        return invoke<TimeEntry[]>("cmd_get_time_entries", {
            month: month || null,
            projectId: projectId || null,
        });
    },
    createTimeEntry: async (input: CreateTimeEntryInput): Promise<TimeEntry> => {
        return invoke<TimeEntry>("cmd_create_time_entry", { input });
    },
    updateTimeEntry: async (input: UpdateTimeEntryInput): Promise<void> => {
        return invoke<void>("cmd_update_time_entry", { input });
    },
    deleteTimeEntry: async (id: number): Promise<void> => {
        return invoke<void>("cmd_delete_time_entry", { id });
    },

    // Payments
    getPayments: async (month?: string, projectId?: number): Promise<Payment[]> => {
        return invoke<Payment[]>("cmd_get_payments", {
            month: month || null,
            projectId: projectId || null,
        });
    },
    createPayment: async (input: CreatePaymentInput): Promise<Payment> => {
        return invoke<Payment>("cmd_create_payment", { input });
    },
    updatePayment: async (input: UpdatePaymentInput): Promise<void> => {
        return invoke<void>("cmd_update_payment", { input });
    },
    deletePayment: async (id: number): Promise<void> => {
        return invoke<void>("cmd_delete_payment", { id });
    },

    // Summary & Reports
    getMonthlySummary: async (month: string, projectId?: number): Promise<MonthlySummary> => {
        return invoke<MonthlySummary>("cmd_get_monthly_summary", {
            month,
            projectId: projectId || null,
        });
    },
    getProjectDebtSummary: async (): Promise<ProjectDebtItem[]> => {
        return invoke<ProjectDebtItem[]>("cmd_get_project_debt_summary");
    },

    // Settings
    getSettings: async (): Promise<AppSettings> => {
        return invoke<AppSettings>("cmd_get_settings");
    },
    saveSettings: async (input: SaveSettingsInput): Promise<void> => {
        return invoke<void>("cmd_save_settings", { input });
    },

    // Focus Reminder Settings
    getFocusSettings: async (): Promise<FocusSettings> => {
        return invoke<FocusSettings>("cmd_get_focus_settings");
    },
    saveFocusSettings: async (input: SaveFocusSettingsInput): Promise<void> => {
        return invoke<void>("cmd_save_focus_settings", { input });
    },
};
