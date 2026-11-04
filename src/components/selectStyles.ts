import { StylesConfig } from "react-select";

export interface SelectOption {
    value: string | number;
    label: string;
    color?: string;
    data?: any;
}

/**
 * Custom styling cho React-Select giao diện Sáng (Clean Light Theme)
 * Đồng nhất chiều cao (38px hoặc 40px) chuẩn khớp với Input và Button
 */
export const cleanSelectStyles: StylesConfig<SelectOption, false> = {
    control: (base, state) => ({
        ...base,
        backgroundColor: "#ffffff",
        borderColor: state.isFocused ? "#4f46e5" : "#cbd5e1", // indigo-600 : slate-300
        borderRadius: "0.5rem",
        padding: "0 4px",
        height: "38px",
        minHeight: "38px",
        boxShadow: state.isFocused ? "0 0 0 1px #4f46e5" : "none",
        "&:hover": {
            borderColor: state.isFocused ? "#4f46e5" : "#94a3b8",
        },
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
    }),
    valueContainer: (base) => ({
        ...base,
        height: "38px",
        padding: "0 8px",
    }),
    indicatorsContainer: (base) => ({
        ...base,
        height: "38px",
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: "#ffffff",
        borderColor: "#e2e8f0",
        borderWidth: "1px",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        zIndex: 50,
        overflow: "hidden",
    }),
    menuList: (base) => ({
        ...base,
        padding: "4px",
        backgroundColor: "#ffffff",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#4f46e5" // indigo-600
            : state.isFocused
            ? "#f1f5f9" // slate-100
            : "transparent",
        color: state.isSelected ? "#ffffff" : "#0f172a",
        borderRadius: "0.375rem",
        margin: "2px 0",
        padding: "8px 12px",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: state.isSelected ? 600 : 400,
        "&:active": {
            backgroundColor: "#4338ca",
        },
    }),
    singleValue: (base) => ({
        ...base,
        color: "#0f172a",
        fontSize: "0.875rem",
        fontWeight: 500,
    }),
    placeholder: (base) => ({
        ...base,
        color: "#94a3b8",
        fontSize: "0.875rem",
    }),
    input: (base) => ({
        ...base,
        color: "#0f172a",
        margin: 0,
        padding: 0,
    }),
};
