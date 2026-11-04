import React from "react";

/**
 * Loading Skeleton mô phỏng chính xác tỷ lệ 1:1 layout thực tế giao diện Sáng
 * Tuân thủ Rule 7 (Chống giật và nhảy layout CLS)
 */
export const TimeTableSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Skeleton 4 Thẻ chỉ số Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <div className="h-3.5 w-24 rounded bg-slate-200" />
                            <div className="h-8 w-8 rounded-lg bg-slate-100" />
                        </div>
                        <div className="h-7 w-36 rounded bg-slate-200/80" />
                        <div className="h-3 w-28 rounded bg-slate-100" />
                    </div>
                ))}
            </div>

            {/* Skeleton Bảng dữ liệu */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                        <div className="h-[38px] w-48 rounded-lg bg-slate-100" />
                        <div className="h-[38px] w-40 rounded-lg bg-slate-100" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="h-[38px] w-32 rounded-lg bg-slate-100" />
                        <div className="h-[38px] w-36 rounded-lg bg-slate-100" />
                    </div>
                </div>

                {/* Table Header & Rows */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="h-10 border-b border-slate-200 bg-slate-50 px-4 flex items-center justify-between">
                        <div className="h-3.5 w-10 bg-slate-200 rounded" />
                        <div className="h-3.5 w-20 bg-slate-200 rounded" />
                        <div className="h-3.5 w-16 bg-slate-200 rounded" />
                        <div className="h-3.5 w-12 bg-slate-200 rounded" />
                        <div className="h-3.5 w-24 bg-slate-200 rounded" />
                        <div className="h-3.5 w-20 bg-slate-200 rounded" />
                        <div className="h-3.5 w-20 bg-slate-200 rounded" />
                        <div className="h-3.5 w-32 bg-slate-200 rounded" />
                        <div className="h-3.5 w-16 bg-slate-200 rounded" />
                    </div>

                    <div className="divide-y divide-slate-100 p-2 space-y-2">
                        {[1, 2, 3, 4, 5].map((row) => (
                            <div key={row} className="h-10 flex items-center justify-between px-3">
                                <div className="h-3 w-6 bg-slate-100 rounded" />
                                <div className="h-5 w-24 bg-slate-100 rounded-full" />
                                <div className="h-3 w-20 bg-slate-100 rounded" />
                                <div className="h-3 w-10 bg-slate-100 rounded" />
                                <div className="h-3 w-28 bg-slate-100 rounded" />
                                <div className="h-3 w-16 bg-slate-100 rounded" />
                                <div className="h-4 w-20 bg-slate-200/70 rounded" />
                                <div className="h-3 w-36 bg-slate-100 rounded" />
                                <div className="h-5 w-16 bg-slate-100 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
