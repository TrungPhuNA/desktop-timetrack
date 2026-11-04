import React, { useEffect, useState } from "react";

interface MoneyInputProps {
    value: number;
    onChange: (val: number) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
}

/**
 * Format số nguyên thành chuỗi có dấu chấm phân cách hàng nghìn (VD: 200000 -> "200.000")
 */
function formatNumberWithDots(val: number): string {
    if (val === 0) return "0";
    if (!val || isNaN(val)) return "";
    return val.toLocaleString("vi-VN");
}

/**
 * Component Input nhập số tiền tự động phân cách hàng nghìn
 * Mục đích: Hiển thị đẹp mắt kiểu 200.000, 2.500.000 khi người dùng nhập liệu
 */
export const MoneyInput: React.FC<MoneyInputProps> = ({
    value,
    onChange,
    placeholder = "0",
    className = "",
    required = false,
    autoFocus = false,
    disabled = false,
    ariaLabel = "Nhập số tiền",
}) => {
    const [displayStr, setDisplayStr] = useState<string>(() => formatNumberWithDots(value));

    // Đồng bộ giá trị hiển thị khi props value từ ngoài thay đổi
    useEffect(() => {
        setDisplayStr(formatNumberWithDots(value));
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawText = e.target.value;
        // Loại bỏ mọi ký tự không phải số (bao gồm dấu chấm, phẩy, khoảng trắng)
        const cleanDigits = rawText.replace(/\D/g, "");

        if (!cleanDigits) {
            setDisplayStr("");
            onChange(0);
            return;
        }

        const numVal = parseInt(cleanDigits, 10);
        setDisplayStr(numVal.toLocaleString("vi-VN"));
        onChange(numVal);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            required={required}
            autoFocus={autoFocus}
            disabled={disabled}
            value={displayStr}
            onChange={handleInputChange}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={`cursor-text ${className}`}
        />
    );
};
