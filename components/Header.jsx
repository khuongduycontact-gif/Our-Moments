"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

/**
 * Header dùng chung cho mọi trang (trừ trang /login).
 * - Luôn hiện logo "💌 Our Moments" ở bên trái, bấm vào để về trang chủ.
 * - Bên phải là khối thông tin tài khoản (ảnh đại diện + tên + email),
 *   bấm vào sẽ mở dropdown gồm "Gửi quà" và "Đăng xuất".
 * - Khối tài khoản này hiển thị GIỐNG NHAU trên toàn bộ trang web (không
 *   còn phân biệt trang chủ / trang con nữa).
 * - Header trải rộng hết chiều ngang màn hình (không giới hạn max-width) để
 *   logo và khối tài khoản luôn nằm sát 2 mép trái/phải.
 * - Header dùng `sticky top-0` để luôn đứng yên 1 chỗ khi cuộn trang.
 */
export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // Đóng dropdown khi bấm ra ngoài
    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // Đóng dropdown khi chuyển trang
    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    // Đóng dropdown khi nhấn Esc
    useEffect(() => {
        if (!open) return;
        function handleKeyDown(e) {
            if (e.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    const displayName = user?.displayName || user?.email || "";
    const initial = (user?.displayName || user?.email || "?").charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-40 flex w-full items-center justify-between gap-3 bg-brand-50/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-10">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 text-2xl">💌</span>
                <p className="font-display truncate text-lg font-semibold leading-tight text-brand-600 md:text-xl lg:text-2xl">
                    Our Moments
                </p>
            </Link>

            {user && (
                <div className="relative shrink-0" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        aria-haspopup="true"
                        aria-expanded={open}
                        className="flex items-center gap-2 rounded-full border border-brand-200 bg-white py-1 pl-1 pr-2.5 transition hover:border-brand-300 hover:bg-brand-50 sm:pr-3"
                    >
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                        ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                                {initial}
                            </span>
                        )}
                        <span className="hidden max-w-[9rem] truncate text-sm font-medium text-brand-600 sm:inline">
                            {displayName}
                        </span>
                        <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className={`h-4 w-4 shrink-0 text-brand-400 transition-transform ${open ? "rotate-180" : ""
                                }`}
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>

                    {open && (
                        <div className="absolute right-0 top-[calc(100%+0.5rem)] w-64 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-xl animate-fade-in">
                            <div className="flex items-center gap-3 border-b border-brand-50 px-4 py-3">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt=""
                                        referrerPolicy="no-referrer"
                                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-base font-semibold text-white">
                                        {initial}
                                    </span>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-700">
                                        {user.displayName || "Chưa có tên"}
                                    </p>
                                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                                </div>
                            </div>

                            <nav className="py-1.5">
                                <Link
                                    href="/gift"
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-brand-50"
                                >
                                    <span className="text-lg leading-none">🎁</span>
                                    Gửi quà
                                </Link>
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50"
                                >
                                    <span className="text-lg leading-none">🚪</span>
                                    Đăng xuất
                                </button>
                            </nav>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
