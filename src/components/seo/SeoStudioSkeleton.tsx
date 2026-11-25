import React from "react";

/**
 * Loading Skeleton cho phân hệ SEO Content Studio
 * Mục đích: Mô phỏng 1:1 bố cục sub-toolbar + 3 cột (Danh sách | Workspace | Audit) để chống nhảy layout (CLS)
 */
export const SeoStudioSkeleton: React.FC = () => {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Sub-toolbar Skeleton */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-56 rounded-lg bg-slate-100" />
                    <div className="h-8 w-44 rounded-lg bg-slate-100" />
                </div>
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-36 rounded-lg bg-slate-100" />
                    <div className="h-8 w-40 rounded-lg bg-slate-100" />
                    <div className="h-8 w-32 rounded-lg bg-indigo-100" />
                </div>
            </div>

            {/* 3-Column Studio Skeleton */}
            <div className="grid grid-cols-12 gap-4">
                {/* Cột trái (3/12): Danh sách bài */}
                <div className="col-span-12 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3">
                    <div className="h-9 w-full rounded-lg bg-slate-100" />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="h-9 rounded-lg bg-slate-100" />
                        <div className="h-9 rounded-lg bg-slate-100" />
                    </div>
                    <div className="space-y-2.5 pt-1">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="rounded-xl border border-slate-100 p-3 space-y-2">
                                <div className="flex justify-between">
                                    <div className="h-4 w-16 rounded bg-slate-200" />
                                    <div className="h-4 w-14 rounded-full bg-slate-100" />
                                </div>
                                <div className="h-4 w-full rounded bg-slate-200" />
                                <div className="h-3 w-2/3 rounded bg-slate-100" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cột giữa (6/12): Stepper + Card chính */}
                <div className="col-span-12 lg:col-span-6 space-y-3">
                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
                        <div className="h-9 rounded-lg bg-indigo-100" />
                        <div className="h-9 rounded-lg bg-slate-100" />
                        <div className="h-9 rounded-lg bg-slate-100" />
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="h-10 rounded-lg bg-slate-100" />
                            <div className="h-10 rounded-lg bg-slate-100" />
                        </div>
                        <div className="h-10 w-full rounded-lg bg-slate-100" />
                        <div className="h-10 w-full rounded-lg bg-slate-100" />
                        <div className="h-28 w-full rounded-xl bg-slate-100" />
                        <div className="flex justify-between pt-2">
                            <div className="h-9 w-48 rounded-lg bg-slate-100" />
                            <div className="h-9 w-40 rounded-lg bg-indigo-100" />
                        </div>
                    </div>
                </div>

                {/* Cột phải (3/12): Bảng SEO Audit & Meta */}
                <div className="col-span-12 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                    <div className="h-20 w-full rounded-xl bg-emerald-50" />
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-4 w-full rounded bg-slate-100" />
                        ))}
                    </div>
                    <div className="h-28 w-full rounded-xl bg-slate-100" />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="h-9 rounded-lg bg-indigo-100" />
                        <div className="h-9 rounded-lg bg-slate-100" />
                    </div>
                </div>
            </div>
        </div>
    );
};
