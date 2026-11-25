import React, { useEffect, useState } from "react";
import Select from "react-select";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, X, XCircle, Zap } from "lucide-react";
import { cleanSelectStyles, SelectOption } from "../selectStyles";
import { seoApi } from "../../services/seoApi";
import {
    AiProvider,
    CLAUDE_MODELS,
    GEMINI_MODELS,
    SeoAiConfig,
    SeoUsageSummary,
    TestAiConnectionResult,
} from "../../types/seo";

interface SeoAiConfigModalProps {
    isOpen: boolean;
    configs: SeoAiConfig[];
    usageSummary: SeoUsageSummary | null;
    onClose: () => void;
    onSaved: () => Promise<void>;
}

interface ProviderFormState {
    id?: number;
    apiKey: string;
    baseUrl: string;
    model: string;
    customModel: string;
    isActive: boolean;
}

/**
 * Modal cấu hình API Key & Model mặc định cho Anthropic Claude và Google Gemini
 * Hỗ trợ Test kết nối trực tiếp từ Rust Backend và xem thống kê chi phí Token tháng
 */
export const SeoAiConfigModal: React.FC<SeoAiConfigModalProps> = ({
    isOpen,
    configs,
    usageSummary,
    onClose,
    onSaved,
}) => {
    const [claudeForm, setClaudeForm] = useState<ProviderFormState>({
        apiKey: "",
        baseUrl: "",
        model: CLAUDE_MODELS[0].value,
        customModel: "",
        isActive: true,
    });

    const [geminiForm, setGeminiForm] = useState<ProviderFormState>({
        apiKey: "",
        baseUrl: "",
        model: GEMINI_MODELS[0].value,
        customModel: "",
        isActive: true,
    });

    const [showClaudeKey, setShowClaudeKey] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [testingProvider, setTestingProvider] = useState<AiProvider | null>(null);
    const [testResults, setTestResults] = useState<Record<string, TestAiConnectionResult>>({});
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const cCfg = configs.find((c) => c.provider === "claude");
        if (cCfg) {
            const isPreset = CLAUDE_MODELS.some((m) => m.value === cCfg.default_model);
            setClaudeForm({
                id: cCfg.id,
                apiKey: cCfg.api_key,
                baseUrl: cCfg.base_url,
                model: isPreset ? cCfg.default_model : "custom",
                customModel: isPreset ? "" : cCfg.default_model,
                isActive: cCfg.is_active,
            });
        }
        const gCfg = configs.find((c) => c.provider === "gemini");
        if (gCfg) {
            const isPreset = GEMINI_MODELS.some((m) => m.value === gCfg.default_model);
            setGeminiForm({
                id: gCfg.id,
                apiKey: gCfg.api_key,
                baseUrl: gCfg.base_url,
                model: isPreset ? gCfg.default_model : "custom",
                customModel: isPreset ? "" : gCfg.default_model,
                isActive: gCfg.is_active,
            });
        }
        setTestResults({});
        setErrorMsg(null);
    }, [isOpen, configs]);

    if (!isOpen) return null;

    const resolveModel = (form: ProviderFormState) =>
        form.model === "custom" ? form.customModel.trim() : form.model;

    const handleTest = async (provider: AiProvider) => {
        const form = provider === "claude" ? claudeForm : geminiForm;
        const model = resolveModel(form);
        if (!form.apiKey.trim() || !model) {
            setErrorMsg(`Vui lòng nhập đủ API Key và Model cho ${provider.toUpperCase()} trước khi test.`);
            return;
        }
        setErrorMsg(null);
        setTestingProvider(provider);
        try {
            const res = await seoApi.testAiConnection({
                provider,
                api_key: form.apiKey.trim(),
                base_url: form.baseUrl.trim() || undefined,
                model,
            });
            setTestResults((prev) => ({ ...prev, [provider]: res }));
        } catch (err) {
            setErrorMsg(String(err));
        } finally {
            setTestingProvider(null);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setErrorMsg(null);
        try {
            if (claudeForm.apiKey.trim()) {
                await seoApi.saveAiConfig({
                    id: claudeForm.id,
                    provider: "claude",
                    label: "Anthropic Claude Default",
                    api_key: claudeForm.apiKey.trim(),
                    base_url: claudeForm.baseUrl.trim(),
                    default_model: resolveModel(claudeForm) || CLAUDE_MODELS[0].value,
                    is_active: claudeForm.isActive,
                    is_default: true,
                });
            }
            if (geminiForm.apiKey.trim()) {
                await seoApi.saveAiConfig({
                    id: geminiForm.id,
                    provider: "gemini",
                    label: "Google Gemini Default",
                    api_key: geminiForm.apiKey.trim(),
                    base_url: geminiForm.baseUrl.trim(),
                    default_model: resolveModel(geminiForm) || GEMINI_MODELS[0].value,
                    is_active: geminiForm.isActive,
                    is_default: true,
                });
            }
            await onSaved();
            onClose();
        } catch (err) {
            setErrorMsg(String(err));
        } finally {
            setSaving(false);
        }
    };

    const renderProviderBlock = (
        provider: AiProvider,
        title: string,
        badgeTone: string,
        form: ProviderFormState,
        setForm: React.Dispatch<React.SetStateAction<ProviderFormState>>,
        showKey: boolean,
        setShowKey: (val: boolean) => void,
        presetModels: typeof CLAUDE_MODELS
    ) => {
        const modelOptions: SelectOption[] = [
            ...presetModels.map((m) => ({ value: m.value, label: m.label })),
            { value: "custom", label: "Nhập Model ID tùy chỉnh..." },
        ];
        const testRes = testResults[provider];

        return (
            <div className={`rounded-xl border p-4 space-y-3 ${badgeTone}`}>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{title}</span>
                    {form.apiKey.trim() ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                            Đã nhập Key
                        </span>
                    ) : (
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                            Chưa cấu hình
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">API Key</label>
                        <div className="relative">
                            <input
                                type={showKey ? "text" : "password"}
                                value={form.apiKey}
                                onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
                                placeholder={provider === "claude" ? "sk-ant-api03-..." : "AIzaSy..."}
                                className="w-full h-[38px] rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                aria-label={showKey ? `Ẩn API Key ${provider}` : `Hiện API Key ${provider}`}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Model mặc định
                        </label>
                        <Select<SelectOption, false>
                            aria-label={`Chọn Model mặc định cho ${provider}`}
                            value={modelOptions.find((o) => o.value === form.model) || modelOptions[0]}
                            options={modelOptions}
                            onChange={(opt) =>
                                setForm((p) => ({ ...p, model: String(opt?.value || presetModels[0].value) }))
                            }
                            styles={cleanSelectStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>
                </div>

                {form.model === "custom" && (
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                            Model ID tùy chỉnh
                        </label>
                        <input
                            type="text"
                            value={form.customModel}
                            onChange={(e) => setForm((p) => ({ ...p, customModel: e.target.value }))}
                            placeholder="Ví dụ: claude-sonnet-4-5-20250929 hoặc gemini-2.5-pro-preview"
                            className="w-full h-[36px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-mono"
                        />
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <input
                        type="text"
                        value={form.baseUrl}
                        onChange={(e) => setForm((p) => ({ ...p, baseUrl: e.target.value }))}
                        placeholder="Custom Base URL / Proxy (để trống nếu gọi trực tiếp)"
                        aria-label={`Custom Base URL cho ${provider}`}
                        className="flex-1 min-w-[200px] h-[34px] rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-mono text-slate-700"
                    />
                    <button
                        type="button"
                        onClick={() => handleTest(provider)}
                        disabled={testingProvider !== null}
                        aria-label={`Kiểm tra kết nối ${provider}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                        {testingProvider === provider ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Zap className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        <span>Test kết nối</span>
                    </button>
                </div>

                {testRes && (
                    <div
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            testRes.success
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-rose-100 text-rose-900"
                        }`}
                    >
                        {testRes.success ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                        ) : (
                            <XCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{testRes.message}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-indigo-600" />
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                Cấu Hình API Claude & Google Gemini
                            </h2>
                            <p className="text-xs text-slate-600">
                                Lưu an toàn trong SQLite cục bộ trên máy, gọi trực tiếp từ Rust không qua trung gian.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng cửa sổ cấu hình API"
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    {usageSummary && (
                        <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                            <div>
                                <div className="text-slate-600">Lượt gọi tháng {usageSummary.month}</div>
                                <div className="text-sm font-bold text-slate-900">
                                    {usageSummary.total_requests} lượt
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-600">Tổng Token In / Out</div>
                                <div className="text-sm font-bold text-slate-900">
                                    {(usageSummary.total_input_tokens / 1000).toFixed(1)}k /{" "}
                                    {(usageSummary.total_output_tokens / 1000).toFixed(1)}k
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-600">Chi phí ước tính</div>
                                <div className="text-sm font-bold text-indigo-700">
                                    ${usageSummary.total_cost_usd.toFixed(4)} (~
                                    {Math.round(usageSummary.total_cost_usd * 25500).toLocaleString("vi-VN")} đ)
                                </div>
                            </div>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-800">
                            {errorMsg}
                        </div>
                    )}

                    {renderProviderBlock(
                        "claude",
                        "Anthropic Claude (Khuyên dùng viết bài tự nhiên)",
                        "border-amber-200 bg-amber-50/30",
                        claudeForm,
                        setClaudeForm,
                        showClaudeKey,
                        setShowClaudeKey,
                        CLAUDE_MODELS
                    )}

                    {renderProviderBlock(
                        "gemini",
                        "Google Gemini (Khuyên dùng phân tích & lập dàn ý)",
                        "border-indigo-200 bg-indigo-50/30",
                        geminiForm,
                        setGeminiForm,
                        showGeminiKey,
                        setShowGeminiKey,
                        GEMINI_MODELS
                    )}
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                    >
                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>Lưu Cấu Hình API</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
