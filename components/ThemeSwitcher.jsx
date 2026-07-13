"use client";

import { useEffect, useRef, useState } from "react";
import { updateBgTheme } from "@/lib/settings";

const THEMES = [
    { id: "purple", label: "Tím", swatch: "#8b5cf6" },
    { id: "pink", label: "Hồng nhạt", swatch: "#ec4899" },
    { id: "red", label: "Đỏ nhạt", swatch: "#ef4444" },
];

// Nút đổi màu nền của trang. Lựa chọn được lưu vào localStorage (áp dụng ngay,
// không nháy màu khi tải lại trang) và đồng bộ lên Firestore để dùng chung
// giữa cả hai người.
export default function ThemeSwitcher({ initialTheme = "purple", onChanged }) {
    const [open, setOpen] = useState(false);
    const [theme, setTheme] = useState(initialTheme);
    const wrapRef = useRef(null);

    useEffect(() => {
        setTheme(initialTheme);
    }, [initialTheme]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function applyThemeToDom(themeId) {
        if (themeId === "purple") {
            document.documentElement.removeAttribute("data-theme");
        } else {
            document.documentElement.setAttribute("data-theme", themeId);
        }
        try {
            localStorage.setItem("bgTheme", themeId);
        } catch (e) { }
    }

    async function handleSelect(themeId) {
        if (themeId === theme) {
            setOpen(false);
            return;
        }
        setTheme(themeId);
        applyThemeToDom(themeId);
        setOpen(false);

        try {
            await updateBgTheme(themeId);
            onChanged?.({ ok: true, themeId });
        } catch (err) {
            console.error(err);
            onChanged?.({ ok: false, themeId });
        }
    }

    const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

    return (
        <div className="relative" ref={wrapRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label="Đổi màu nền"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50 hover:border-brand-400"
            >
                <span
                    className="h-4 w-4 rounded-full border border-black/10"
                    style={{ backgroundColor: current.swatch }}
                />
                <span className="hidden sm:inline">Màu nền</span>
            </button>

            {open && (
                <div className="animate-pop-in absolute right-0 z-20 mt-2 w-44 rounded-xl border border-brand-100 bg-white p-2 shadow-lg">
                    <p className="px-2 pb-1.5 pt-1 text-xs font-medium text-slate-400">
                        Chọn màu nền
                    </p>
                    <div className="flex flex-col gap-1">
                        {THEMES.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => handleSelect(t.id)}
                                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-brand-50 ${t.id === theme ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-600"
                                    }`}
                            >
                                <span
                                    className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                                    style={{ backgroundColor: t.swatch }}
                                />
                                <span className="flex-1 text-left">{t.label}</span>
                                {t.id === theme && <span className="text-brand-500">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
