"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import Toast from "@/components/Toast";
import { useAuth } from "@/lib/AuthContext";
import { getSiteSettings } from "@/lib/settings";

/**
 * Header dùng chung cho mọi trang (trừ trang /login).
 * - Luôn hiện logo "💌 Our Moments" ở bên trái, bấm vào để về trang chủ.
 * - Trang chủ: thêm nút Đổi màu nền + Đăng xuất ở bên phải.
 * - Các trang khác: không có gì ở bên phải, để logo luôn nằm cố định bên
 *   trái giống hệt trang chủ (không bị "nhảy" ra giữa).
 * - Nút quay lại của từng trang con (VD trang Thêm album, Tất cả album,
 *   Chi tiết album) được đặt NGAY TRONG nội dung trang đó, không còn nằm ở
 *   Header dùng chung nữa.
 * - Header trải rộng hết chiều ngang màn hình (không giới hạn max-width) để
 *   logo và các nút luôn nằm sát 2 mép trái/phải.
 * - Header dùng `sticky top-0` để luôn đứng yên 1 chỗ khi cuộn trang.
 */
export default function Header({ showLogout = false }) {
    const { logout } = useAuth();
    const [bgTheme, setBgTheme] = useState("purple");
    const [toast, setToast] = useState(null);

    useEffect(() => {
        getSiteSettings().then((s) => {
            const savedTheme = s.bgTheme || "purple";
            setBgTheme(savedTheme);
            if (savedTheme === "purple") {
                document.documentElement.removeAttribute("data-theme");
            } else {
                document.documentElement.setAttribute("data-theme", savedTheme);
            }
            try {
                localStorage.setItem("bgTheme", savedTheme);
            } catch (e) { }
        });
    }, []);

    useEffect(() => {
        if (!toast) return;
        const duration = toast.type === "success" ? 1000 : 4000;
        const t = setTimeout(() => setToast(null), duration);
        return () => clearTimeout(t);
    }, [toast]);

    return (
        <>
            <Toast toast={toast} />
            <header className="sticky top-0 z-40 flex w-full items-center justify-between gap-3 bg-brand-50/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-10">
                <Link href="/" className="flex min-w-0 items-center gap-2.5">
                    <span className="shrink-0 text-2xl">💌</span>
                    <p className="font-display truncate text-lg font-semibold leading-tight text-brand-600 md:text-xl lg:text-2xl">
                        Our Moments
                    </p>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                    {/* Nút vào trang Quà tặng - hiện ở mọi trang, không chỉ trang chủ */}
                    <Link
                        href="/gift"
                        aria-label="Gửi quà"
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50 hover:border-brand-300"
                    >
                        <span className="text-xl leading-none">🎁</span>
                        <span className="hidden sm:inline">Gửi quà</span>
                    </Link>

                    {showLogout && (
                        <>
                            <ThemeSwitcher
                                initialTheme={bgTheme}
                                onChanged={({ ok, themeId }) => {
                                    setBgTheme(themeId);
                                    setToast(
                                        ok
                                            ? { type: "success", message: "Đã đổi màu nền ♡" }
                                            : {
                                                type: "error",
                                                message:
                                                    "Đổi màu nền cục bộ thành công, nhưng chưa lưu được lên hệ thống.",
                                            }
                                    );
                                }}
                            />
                            <button
                                onClick={logout}
                                className="rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50 hover:border-brand-400"
                            >
                                Đăng xuất
                            </button>
                        </>
                    )}
                </div>
            </header>
        </>
    );
}
