import React, { useState } from "react";
import { Edit2, FolderKanban, Plus, Trash2, X } from "lucide-react";
import { CreateProjectInput, Project, UpdateProjectInput } from "../types";
import { MoneyInput } from "./MoneyInput";

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    currencySymbol?: string;
    onSaveCreate: (input: CreateProjectInput) => Promise<void>;
    onSaveUpdate: (input: UpdateProjectInput) => Promise<void>;
    onDeleteProject: (id: number) => void;
}

const PRESET_COLORS = [
    "#3b82f6", // Blue
    "#6366f1", // Indigo
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#f43f5e", // Rose
    "#f97316", // Orange
    "#eab308", // Yellow
    "#10b981", // Emerald
    "#06b6d4", // Cyan
];

/**
 * Modal quản lý danh sách Dự án và cấu hình Đơn giá giờ theo từng dự án
 * Giao diện Sáng (Clean Light), Input - Buttons có CHIỀU CAO BẰNG NHAU (40px)
 */
export const ProjectModal: React.FC<ProjectModalProps> = ({
    isOpen,
    onClose,
    projects,
    currencySymbol = "đ",
    onSaveCreate,
    onSaveUpdate,
    onDeleteProject,
}) => {
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [name, setName] = useState<string>("");
    const [hourlyRate, setHourlyRate] = useState<number>(220000);
    const [color, setColor] = useState<string>("#3b82f6");
    const [description, setDescription] = useState<string>("");

    if (!isOpen) return null;

    const formatMoney = (val: number) => {
        return val.toLocaleString("vi-VN") + " " + currencySymbol + "/h";
    };

    const handleStartEdit = (proj: Project) => {
        setEditingProject(proj);
        setName(proj.name);
        setHourlyRate(proj.hourly_rate);
        setColor(proj.color);
        setDescription(proj.description);
    };

    const handleCancelEdit = () => {
        setEditingProject(null);
        setName("");
        setHourlyRate(220000);
        setColor("#3b82f6");
        setDescription("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (editingProject) {
            await onSaveUpdate({
                id: editingProject.id,
                name: name.trim(),
                hourly_rate: hourlyRate,
                color,
                description,
                is_archived: editingProject.is_archived,
            });
        } else {
            await onSaveCreate({
                name: name.trim(),
                hourly_rate: hourlyRate,
                color,
                description,
            });
        }
        handleCancelEdit();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-3.5">
                    <div className="flex items-center space-x-2 shrink-0">
                        <FolderKanban className="h-5 w-5 text-indigo-600 shrink-0" />
                        <h2 className="text-base font-bold text-slate-900 whitespace-nowrap">
                            Quản lý Dự án & Đơn giá / giờ
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng cửa sổ"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Form Thêm / Sửa dự án */}
                    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-2xs">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block whitespace-nowrap">
                            {editingProject ? `Sửa dự án: ${editingProject.name}` : "+ Thêm Dự án Mới"}
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Tên dự án <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="VD: tilo-company, atos..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                    Đơn giá / giờ ({currencySymbol}/h) <span className="text-rose-500">*</span>
                                </label>
                                <MoneyInput
                                    value={hourlyRate}
                                    onChange={setHourlyRate}
                                    placeholder="220.000"
                                    required
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 font-bold font-mono focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                                />
                            </div>
                        </div>

                        {/* Chọn màu nhận diện */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 whitespace-nowrap">
                                Màu nhận diện dự án
                            </label>
                            <div className="flex items-center space-x-2">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        aria-label={`Chọn màu ${c}`}
                                        className={`h-6 w-6 rounded-full transition-transform cursor-pointer ${
                                            color === c ? "scale-125 ring-2 ring-indigo-600 ring-offset-2 ring-offset-white" : "hover:scale-110"
                                        }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 whitespace-nowrap">
                                Mô tả / Ghi chú hợp đồng
                            </label>
                            <input
                                type="text"
                                placeholder="Ghi chú thêm về dự án này..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                            />
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2">
                            {editingProject && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                    Hủy sửa
                                </button>
                            )}
                            <button
                                type="submit"
                                className="inline-flex h-9 items-center space-x-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer whitespace-nowrap"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>{editingProject ? "Cập Nhật" : "Tạo Dự Án"}</span>
                            </button>
                        </div>
                    </form>

                    {/* Danh sách các dự án hiện có */}
                    <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block whitespace-nowrap">
                            Danh sách dự án ({projects.length})
                        </span>

                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                            {projects.map((proj) => (
                                <div
                                    key={proj.id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                                >
                                    <div className="flex items-center space-x-2.5 truncate">
                                        <span
                                            className="h-3 w-3 rounded-full shrink-0"
                                            style={{ backgroundColor: proj.color }}
                                        />
                                        <div className="truncate">
                                            <span className="font-bold text-slate-900 whitespace-nowrap">
                                                {proj.name}
                                            </span>
                                            {proj.description && (
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {proj.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 shrink-0">
                                        <span className="font-mono font-bold text-indigo-700 whitespace-nowrap">
                                            {formatMoney(proj.hourly_rate)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(proj)}
                                            aria-label={`Sửa dự án ${proj.name}`}
                                            className="rounded p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDeleteProject(proj.id)}
                                            aria-label={`Xóa dự án ${proj.name}`}
                                            className="rounded p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
