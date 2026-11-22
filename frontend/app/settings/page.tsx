"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import {
  CheckCircle2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  useSceneStore,
  type SupportedCurrency,
} from "@/lib/useSceneStore";

type SettingsTab = "profile" | "preferences" | "notifications" | "security";
type AmbientMode = "morning" | "rainy" | "midnight";
type MeasurementUnit = "metric" | "imperial";

const STORAGE_KEY = "rwaq_user_settings";

interface NotificationPrefs {
  projectUpdatesApp: boolean;
  projectUpdatesEmail: boolean;
  clientCommentsApp: boolean;
  clientCommentsEmail: boolean;
  aiCompletionApp: boolean;
  aiCompletionEmail: boolean;
}

interface PersistedUserSettings {
  displayName: string;
  email: string;
  bio: string;
  roomWidth: number;
  roomDepth: number;
  wallHeight: number;
  primaryCurrency: SupportedCurrency;
  budgetLimit: number;
  ambientMode: AmbientMode;
  unit: MeasurementUnit;
  notifications: NotificationPrefs;
}

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  projectUpdatesApp: true,
  projectUpdatesEmail: false,
  clientCommentsApp: true,
  clientCommentsEmail: false,
  aiCompletionApp: true,
  aiCompletionEmail: true,
};

const CURRENCY_OPTIONS: { value: SupportedCurrency; label: string }[] = [
  { value: "SAR", label: "ريال سعودي (SAR)" },
  { value: "AED", label: "درهم إماراتي (AED)" },
  { value: "KWD", label: "دينار كويتي (KWD)" },
  { value: "EGP", label: "جنيه مصري (EGP)" },
  { value: "USD", label: "دولار أمريكي (USD)" },
];

const AMBIENT_OPTIONS: { value: AmbientMode; label: string; desc: string }[] = [
  { value: "morning", label: "صباح مشرق", desc: "ضوء نهاري طبيعي متوازن" },
  { value: "rainy", label: "ممطر هادئ", desc: "إضاءة ناعمة منتشرة" },
  { value: "midnight", label: "ليلي دافئ", desc: "أجواء مسائية بإضاءة مخفية" },
];

const VALID_CURRENCIES = new Set<SupportedCurrency>(["SAR", "USD", "AED", "EGP", "KWD"]);
const VALID_AMBIENT = new Set<AmbientMode>(["morning", "rainy", "midnight"]);

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function readSavedSettings(): Partial<PersistedUserSettings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Partial<PersistedUserSettings>) : null;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");

  const storeRoomWidth = useSceneStore((s) => s.roomWidth);
  const storeRoomDepth = useSceneStore((s) => s.roomDepth);
  const storeWallHeight = useSceneStore((s) => s.wallHeight);
  const storeCurrency = useSceneStore((s) => s.primaryCurrency);
  const storeBudgetLimit = useSceneStore((s) => s.budgetLimit);
  const storeAmbientMode = useSceneStore((s) => s.ambientMode);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState(
    "مصمم متخصص في المساحات السكنية العصرية مع التركيز على الاستدامة والمواد الطبيعية."
  );

  const [roomWidth, setRoomWidth] = useState<number>(storeRoomWidth);
  const [roomDepth, setRoomDepth] = useState<number>(storeRoomDepth);
  const [wallHeight, setWallHeight] = useState<number>(storeWallHeight);
  const [primaryCurrency, setPrimaryCurrency] = useState<SupportedCurrency>(storeCurrency);
  const [budgetLimit, setBudgetLimit] = useState<number>(storeBudgetLimit);
  const [ambientMode, setAmbientMode] = useState<AmbientMode>(storeAmbientMode);
  const [unit, setUnit] = useState<MeasurementUnit>("metric");
  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);

  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "info";
    message: string;
  } | null>(null);

  const showBanner = (message: string, type: "success" | "info" = "success") => {
    setStatusBanner({ type, message });
    window.setTimeout(() => {
      setStatusBanner((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Load saved preferences from localStorage (rwaq_user_settings) & sync with useSceneStore on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = readSavedSettings();
      const store = useSceneStore.getState();

      if (saved) {
        const nextWidth = clampNumber(Number(saved.roomWidth), 2.5, 15, store.roomWidth);
        const nextDepth = clampNumber(Number(saved.roomDepth), 2.5, 15, store.roomDepth);
        const nextHeight = clampNumber(Number(saved.wallHeight), 2.2, 6, store.wallHeight);
        const nextBudget = clampNumber(Number(saved.budgetLimit), 0, 10000000, store.budgetLimit);
        const nextCurrency =
          saved.primaryCurrency && VALID_CURRENCIES.has(saved.primaryCurrency)
            ? saved.primaryCurrency
            : store.primaryCurrency;
        const nextAmbient =
          saved.ambientMode && VALID_AMBIENT.has(saved.ambientMode)
            ? saved.ambientMode
            : store.ambientMode;

        setDisplayName(
          typeof saved.displayName === "string" && saved.displayName
            ? saved.displayName
            : user?.fullName || ""
        );
        setEmail(
          typeof saved.email === "string" && saved.email
            ? saved.email
            : user?.primaryEmailAddress?.emailAddress || ""
        );
        if (typeof saved.bio === "string") setBio(saved.bio);
        setRoomWidth(nextWidth);
        setRoomDepth(nextDepth);
        setWallHeight(nextHeight);
        setPrimaryCurrency(nextCurrency);
        setBudgetLimit(nextBudget);
        setAmbientMode(nextAmbient);
        setUnit(saved.unit === "imperial" ? "imperial" : "metric");
        if (saved.notifications && typeof saved.notifications === "object") {
          setNotifications({ ...DEFAULT_NOTIFICATIONS, ...saved.notifications });
        }

        store.setRoomWidth(nextWidth);
        store.setRoomDepth(nextDepth);
        store.setWallHeight(nextHeight);
        store.setPrimaryCurrency(nextCurrency);
        store.setBudgetLimit(nextBudget);
        store.setAmbientMode(nextAmbient);
      } else {
        setDisplayName(user?.fullName || "");
        setEmail(user?.primaryEmailAddress?.emailAddress || "");
        setRoomWidth(store.roomWidth);
        setRoomDepth(store.roomDepth);
        setWallHeight(store.wallHeight);
        setPrimaryCurrency(store.primaryCurrency);
        setBudgetLimit(store.budgetLimit);
        setAmbientMode(store.ambientMode);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user]);

  const handleSaveAll = (event?: React.FormEvent) => {
    event?.preventDefault();

    const safeWidth = clampNumber(Number(roomWidth), 2.5, 15, 5.5);
    const safeDepth = clampNumber(Number(roomDepth), 2.5, 15, 4.8);
    const safeHeight = clampNumber(Number(wallHeight), 2.2, 6, 3.0);
    const safeBudget = clampNumber(Number(budgetLimit), 0, 10000000, 20000);

    setRoomWidth(safeWidth);
    setRoomDepth(safeDepth);
    setWallHeight(safeHeight);
    setBudgetLimit(safeBudget);

    const store = useSceneStore.getState();
    store.setRoomWidth(safeWidth);
    store.setRoomDepth(safeDepth);
    store.setWallHeight(safeHeight);
    store.setPrimaryCurrency(primaryCurrency);
    store.setBudgetLimit(safeBudget);
    store.setAmbientMode(ambientMode);

    const payload: PersistedUserSettings = {
      displayName: displayName.trim(),
      email: email.trim(),
      bio: bio.trim(),
      roomWidth: safeWidth,
      roomDepth: safeDepth,
      wallHeight: safeHeight,
      primaryCurrency,
      budgetLimit: safeBudget,
      ambientMode,
      unit,
      notifications,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors in restricted browsing modes
    }

    showBanner("تم حفظ التغييرات وتحديث إعدادات الاستوديو بنجاح.", "success");
  };

  const handleRevertUnsaved = () => {
    const saved = readSavedSettings();
    const store = useSceneStore.getState();
    setDisplayName(saved?.displayName ?? user?.fullName ?? "");
    setEmail(saved?.email ?? user?.primaryEmailAddress?.emailAddress ?? "");
    setBio(
      saved?.bio ??
        "مصمم متخصص في المساحات السكنية العصرية مع التركيز على الاستدامة والمواد الطبيعية."
    );
    setRoomWidth(saved?.roomWidth ?? store.roomWidth);
    setRoomDepth(saved?.roomDepth ?? store.roomDepth);
    setWallHeight(saved?.wallHeight ?? store.wallHeight);
    setPrimaryCurrency(saved?.primaryCurrency ?? store.primaryCurrency);
    setBudgetLimit(saved?.budgetLimit ?? store.budgetLimit);
    setAmbientMode(saved?.ambientMode ?? store.ambientMode);
    setUnit(saved?.unit === "imperial" ? "imperial" : "metric");
    setNotifications(
      saved?.notifications ? { ...DEFAULT_NOTIFICATIONS, ...saved.notifications } : DEFAULT_NOTIFICATIONS
    );
    showBanner("تم التراجع عن التعديلات غير المحفوظة.", "info");
  };

  const handleResetDefaults = () => {
    const store = useSceneStore.getState();
    store.resetToDefaults();
    store.setBudgetLimit(20000);
    store.setPrimaryCurrency("SAR");

    setRoomWidth(5.5);
    setRoomDepth(4.8);
    setWallHeight(3.0);
    setPrimaryCurrency("SAR");
    setBudgetLimit(20000);
    setAmbientMode("morning");
    setUnit("metric");
    setNotifications(DEFAULT_NOTIFICATIONS);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }

    showBanner("تمت استعادة الإعدادات الافتراضية ومسح التفضيلات المحلية.", "info");
  };

  const tabClass = (id: SettingsTab) => {
    const active = activeTab === id;
    return `flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all shrink-0 md:w-full text-right ${
      active
        ? "bg-secondary-container text-secondary"
        : "text-on-surface-variant hover:bg-surface-container"
    }`;
  };

  return (
    <main className="fixed top-[64px] left-0 right-0 md:right-[280px] bottom-0 bg-surface overflow-y-auto" dir="rtl">
      <div className="p-4 sm:p-6 md:p-8 max-w-5xl">
        <div className="mb-6 md:mb-8">
          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface">
            إعدادات الحساب والاستوديو
          </h2>
          <p className="text-on-surface-variant font-body-md text-sm sm:text-base mt-1">
            تحكم في أبعاد الغرفة الافتراضية، العملة والميزانية، والإضاءة وتفاصيل الجلسة.
          </p>
        </div>

        {statusBanner && (
          <div
            role="status"
            className={`mb-6 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-bold ${
              statusBanner.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-secondary-container/60 border-secondary/30 text-on-surface"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusBanner.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Tabs */}
          <div className="md:col-span-3 flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "preferences" as const, icon: "palette", label: "تفضيلات الاستوديو" },
              { id: "profile" as const, icon: "person", label: "الملف الشخصي" },
              { id: "notifications" as const, icon: "notifications", label: "الإشعارات" },
              { id: "security" as const, icon: "shield", label: "الأمان والجلسة" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={tabClass(tab.id)}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="md:col-span-9">
            {activeTab === "preferences" && (
              <form
                onSubmit={handleSaveAll}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6 space-y-6"
              >
                <div>
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                    تفضيلات الاستوديو الافتراضية
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    تُطبّق هذه القيم مباشرة على الاستوديو ثلاثي الأبعاد وتُحفظ محلياً في متصفحك.
                  </p>
                </div>

                {/* Default Room Dimensions */}
                <div>
                  <p className="text-sm font-bold text-on-surface mb-3">أبعاد الغرفة الافتراضية (بالمتر)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="room-width" className="text-xs font-bold text-on-surface-variant block">
                        العرض (م)
                      </label>
                      <input
                        id="room-width"
                        type="number"
                        step="0.1"
                        min={2.5}
                        max={15}
                        value={roomWidth}
                        onChange={(e) => setRoomWidth(Number(e.target.value))}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="room-depth" className="text-xs font-bold text-on-surface-variant block">
                        العمق (م)
                      </label>
                      <input
                        id="room-depth"
                        type="number"
                        step="0.1"
                        min={2.5}
                        max={15}
                        value={roomDepth}
                        onChange={(e) => setRoomDepth(Number(e.target.value))}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="wall-height" className="text-xs font-bold text-on-surface-variant block">
                        ارتفاع الجدران (م)
                      </label>
                      <input
                        id="wall-height"
                        type="number"
                        step="0.1"
                        min={2.2}
                        max={6}
                        value={wallHeight}
                        onChange={(e) => setWallHeight(Number(e.target.value))}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Currency & Budget */}
                <div>
                  <p className="text-sm font-bold text-on-surface mb-3">العملة والميزانية الافتراضية</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="primary-currency" className="text-xs font-bold text-on-surface-variant block">
                        العملة الأساسية
                      </label>
                      <select
                        id="primary-currency"
                        value={primaryCurrency}
                        onChange={(e) => setPrimaryCurrency(e.target.value as SupportedCurrency)}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      >
                        {CURRENCY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="budget-limit" className="text-xs font-bold text-on-surface-variant block">
                        حد الميزانية ({primaryCurrency})
                      </label>
                      <input
                        id="budget-limit"
                        type="number"
                        step={500}
                        min={0}
                        value={budgetLimit}
                        onChange={(e) => setBudgetLimit(Number(e.target.value))}
                        className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Ambient Lighting Mode */}
                <div>
                  <p className="text-sm font-bold text-on-surface mb-3">الوضع الجوي والإضاءة الافتراضية</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {AMBIENT_OPTIONS.map((mode) => {
                      const active = ambientMode === mode.value;
                      return (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setAmbientMode(mode.value)}
                          className={`p-3.5 rounded-xl border text-right transition-all ${
                            active
                              ? "border-secondary bg-secondary-container/40 text-on-surface"
                              : "border-outline-variant bg-surface-container-low/50 text-on-surface-variant hover:border-secondary/40"
                          }`}
                        >
                          <span className="block text-sm font-bold text-on-surface">{mode.label}</span>
                          <span className="block text-[11px] text-on-surface-variant mt-1">{mode.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Measurement Unit */}
                <div>
                  <p className="text-sm font-bold text-on-surface mb-3">وحدات القياس</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: "metric" as const, label: "نظام متري (م، سم)" },
                      { id: "imperial" as const, label: "نظام إمبراطوري (قدم، بوصة)" },
                    ].map((opt) => {
                      const active = unit === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setUnit(opt.id)}
                          className={`p-3.5 border rounded-xl flex justify-between items-center transition-all text-right ${
                            active
                              ? "border-secondary bg-secondary-container/30 text-on-surface font-bold"
                              : "border-outline-variant text-on-surface-variant hover:border-secondary/40"
                          }`}
                        >
                          <span className="text-sm">{opt.label}</span>
                          {active && <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-outline-variant">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-bold hover:bg-surface-container transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    استعادة الافتراضي
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-secondary text-white text-sm font-bold hover:bg-secondary/90 transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            )}

            {activeTab === "profile" && (
              <form
                onSubmit={handleSaveAll}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6"
              >
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6">
                  المعلومات الشخصية
                </h3>

                {/* Avatar + Name */}
                <div className="flex items-center gap-4 sm:gap-6 mb-6 p-4 sm:p-5 bg-surface-container-low rounded-xl border border-outline-variant">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-outline-variant bg-surface-container flex items-center justify-center shrink-0">
                    {user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-on-surface-variant">
                        {(displayName || user?.firstName || "ر").charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline-sm font-bold text-on-surface truncate">
                      {displayName || user?.fullName || "مصمم رواق"}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      {isSignedIn ? "حساب موثّق عبر Clerk" : "جلسة محلية (وضع تجريبي)"}
                    </p>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1.5">
                    <label htmlFor="profile-name" className="text-xs font-bold text-on-surface-variant block">
                      الاسم الكامل
                    </label>
                    <input
                      id="profile-name"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="اسم المصمم"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="profile-email" className="text-xs font-bold text-on-surface-variant block">
                      البريد الإلكتروني
                    </label>
                    <input
                      id="profile-email"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="designer@example.com"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label htmlFor="profile-bio" className="text-xs font-bold text-on-surface-variant block">
                      نبذة تعريفية
                    </label>
                    <textarea
                      id="profile-bio"
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all resize-none"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                  <button
                    type="button"
                    onClick={handleRevertUnsaved}
                    className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-secondary text-white text-sm font-bold hover:bg-secondary/90 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            )}

            {activeTab === "notifications" && (
              <form
                onSubmit={handleSaveAll}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6"
              >
                <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-6">
                  إشعارات النظام
                </h3>
                <div className="divide-y divide-outline-variant mb-6">
                  {[
                    {
                      label: "تحديثات المشروع",
                      desc: "تنبيهات عند حفظ أو تعديل حالة التصميم",
                      appKey: "projectUpdatesApp" as const,
                      emailKey: "projectUpdatesEmail" as const,
                    },
                    {
                      label: "ملاحظات العملاء",
                      desc: "تنبيهات عند استلام ملاحظات على عروض الأسعار",
                      appKey: "clientCommentsApp" as const,
                      emailKey: "clientCommentsEmail" as const,
                    },
                    {
                      label: "الذكاء الاصطناعي",
                      desc: "عند اكتمال توليد الغرف والتدقيق المكاني",
                      appKey: "aiCompletionApp" as const,
                      emailKey: "aiCompletionEmail" as const,
                    },
                  ].map((item) => (
                    <div
                      key={item.appKey}
                      className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                    >
                      <div>
                        <p className="text-sm font-bold text-on-surface">{item.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                      </div>
                      <div className="flex gap-5 shrink-0">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.appKey]}
                            onChange={(e) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [item.appKey]: e.target.checked,
                              }))
                            }
                            className="rounded border-outline-variant text-secondary focus:ring-secondary"
                          />
                          تطبيق
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.emailKey]}
                            onChange={(e) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [item.emailKey]: e.target.checked,
                              }))
                            }
                            className="rounded border-outline-variant text-secondary focus:ring-secondary"
                          />
                          إيميل
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                  <button
                    type="button"
                    onClick={handleRevertUnsaved}
                    className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-secondary text-white text-sm font-bold hover:bg-secondary/90 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6 space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-secondary" />
                      الأمان وحالة الجلسة
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      معلومات المصادقة وتخزين البيانات في مساحة عمل رواق.
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isSignedIn
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-secondary-container text-secondary border-secondary/20"
                    }`}
                  >
                    {!isLoaded
                      ? "جاري التحقق..."
                      : isSignedIn
                        ? "جلسة Clerk نشطة"
                        : "الوضع التجريبي المحلي"}
                  </span>
                </div>

                {/* Account & Session Status Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                    <p className="text-xs font-bold text-on-surface-variant mb-1">حالة المصادقة</p>
                    <p className="text-sm font-bold text-on-surface">
                      {isSignedIn
                        ? `مسجّل الدخول (${user?.primaryEmailAddress?.emailAddress || user?.fullName || "مستخدم"})`
                        : "استخدام محلي بدون تسجيل دخول"}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                      {isSignedIn
                        ? "تتم حماية جلستك عبر Clerk مع إمكانية حفظ المشاريع سحابياً في Supabase."
                        : "في الوضع التجريبي المحلي تُحفظ أبعاد الغرفة وتفضيلات الاستوديو داخل المتصفح فقط (localStorage). سجّل الدخول لتفعيل المزامنة السحابية للمشاريع."}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
                    <p className="text-xs font-bold text-on-surface-variant mb-1">تفاصيل الأمان والتخزين</p>
                    <ul className="text-xs text-on-surface space-y-1.5 mt-1">
                      <li className="flex justify-between gap-2">
                        <span className="text-on-surface-variant">التحقق الثنائي (2FA):</span>
                        <span className="font-bold">
                          {isSignedIn ? (user?.twoFactorEnabled ? "مفعّل" : "غير مفعّل") : "يتطلب حساب Clerk"}
                        </span>
                      </li>
                      <li className="flex justify-between gap-2">
                        <span className="text-on-surface-variant">آخر نشاط:</span>
                        <span className="font-mono">
                          {isSignedIn && user?.lastSignInAt
                            ? new Date(user.lastSignInAt).toLocaleDateString("ar-SA")
                            : "الجلسة الحالية"}
                        </span>
                      </li>
                      <li className="flex justify-between gap-2">
                        <span className="text-on-surface-variant">تخزين التفضيلات:</span>
                        <span className="font-mono">localStorage</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-outline-variant">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-4 py-2.5 rounded-xl border border-error/30 text-error text-xs sm:text-sm font-bold hover:bg-error-container/40 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    مسح التفضيلات المحلية
                  </button>

                  <Link
                    href="/studio"
                    className="px-5 py-2.5 rounded-xl bg-secondary text-white text-xs sm:text-sm font-bold hover:bg-secondary/90 transition-colors flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    العودة للاستوديو 3D
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
