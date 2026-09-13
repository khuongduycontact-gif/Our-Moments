"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
    HomeIcon,
    CameraIcon,
    SearchIcon,
    ChevronDownIcon,
} from "@/components/Icons";

/**
 * Header dùng chung cho mọi trang (trừ trang /login).
 * - Logo "💌 The Love Chapter" bên trái, bấm vào để về trang chủ.
 * - Thanh điều hướng chính ở giữa: Trang chủ / Album (giao diện mới).
 *   Ẩn trên màn hình nhỏ để tránh rối, chỉ còn logo + tài khoản.
 * - Bên phải: nút tìm kiếm nhanh (điều hướng sang /albums?q=...) — CHỈ hiện
 *   khi đang ở trong phần Album (trang /albums, /moment/[id] hoặc /add),
 *   ẩn ở các trang khác vì không có gì để tìm — và khối
 *   tài khoản (ảnh đại diện + tên + email), bấm vào mở dropdown "Gửi quà" / "Đăng xuất".
 * - Khối tài khoản hiển thị GIỐNG NHAU trên toàn bộ trang web.
 * - Header dùng `sticky top-0` để luôn đứng yên 1 chỗ khi cuộn trang.
 */
const NAV_ITEMS = [
    { href: "/", label: "Trang chủ", icon: HomeIcon, match: (p) => p === "/" },
    {
        href: "/albums",
        label: "Album",
        icon: CameraIcon,
        match: (p) => p.startsWith("/albums") || p.startsWith("/moment") || p === "/add",
    },
];

function NavLink({ href, label, Icon, active }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-1.5 border-b-2 px-0.5 pb-0.5 text-sm font-medium transition ${active
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-slate-500 hover:text-brand-600"
                }`}
        >
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{label}</span>
        </Link>
    );
}

export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const menuRef = useRef(null);
    const searchInputRef = useRef(null);

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

    // Đóng dropdown + ô tìm kiếm khi chuyển trang
    useEffect(() => {
        setOpen(false);
        setSearchOpen(false);
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

    useEffect(() => {
        if (searchOpen) searchInputRef.current?.focus();
    }, [searchOpen]);

    function handleSearchSubmit(e) {
        e.preventDefault();
        const q = searchValue.trim();
        router.push(q ? `/albums?q=${encodeURIComponent(q)}` : "/albums");
        setSearchOpen(false);
    }

    const displayName = user?.displayName || user?.email || "";
    const initial = (user?.displayName || user?.email || "?").charAt(0).toUpperCase();
    // Chỉ hiện thanh tìm kiếm khi đang ở trong phần Album — dùng lại đúng
    // điều kiện "active" của mục nav Album để 2 nơi luôn khớp nhau.
    const albumNavItem = NAV_ITEMS.find((item) => item.href === "/albums");
    const showSearch = albumNavItem ? albumNavItem.match(pathname) : false;

    return (
        <header className="sticky top-0 z-40 flex w-full items-center justify-between gap-3 bg-brand-50/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-10">
            <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-brand-500 text-base shadow-sm">
                    💌
                </span>
                <p className="font-display truncate text-lg font-bold leading-tight text-brand-600 md:text-xl">
                    The Love Chapter
                </p>
            </Link>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-6 lg:flex xl:gap-8">
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        Icon={item.icon}
                        active={item.match(pathname)}
                    />
                ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
                {showSearch && (
                    <div className="relative hidden sm:block">
                        {searchOpen ? (
                            <form onSubmit={handleSearchSubmit} className="flex items-center">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onBlur={() => !searchValue && setSearchOpen(false)}
                                    placeholder="Tìm album theo tiêu đề..."
                                    className="w-40 rounded-full border border-brand-200 bg-white py-1.5 pl-3 pr-8 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 md:w-56"
                                />
                                <button
                                    type="submit"
                                    aria-label="Tìm kiếm"
                                    className="absolute right-2 text-brand-400 hover:text-brand-600"
                                >
                                    <SearchIcon className="h-4 w-4" />
                                </button>
                            </form>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setSearchOpen(true)}
                                aria-label="Tìm kiếm"
                                className="flex h-9 w-9 items-center justify-center rounded-full text-brand-500 transition hover:bg-white"
                            >
                                <SearchIcon className="h-[18px] w-[18px]" />
                            </button>
                        )}
                    </div>
                )}

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
                            <ChevronDownIcon
                                className={`h-4 w-4 shrink-0 text-brand-400 transition-transform ${open ? "rotate-180" : ""
                                    }`}
                            />
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

                                <nav className="py-1.5 lg:hidden">
                                    {NAV_ITEMS.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-brand-50"
                                        >
                                            <item.icon className="h-4 w-4 text-brand-400" />
                                            {item.label}
                                        </Link>
                                    ))}
                                    <div className="my-1 border-t border-brand-50" />
                                </nav>

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
            </div>
        </header>
    );
}
