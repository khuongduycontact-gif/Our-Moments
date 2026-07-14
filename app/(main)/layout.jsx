"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Khung sườn chung: Header (đăng xuất chỉ ở trang chủ, nút quay lại ở các
// trang khác) + nội dung trang + Footer. Tiêu đề riêng của từng trang được
// hiển thị ngay trong nội dung trang đó (không còn qua Header nữa).
function Shell({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-brand-50">
      <Header showLogout={isHome} />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  );
}

// Layout này áp dụng cho mọi trang trong nhóm (main) - tức mọi trang TRỪ
// /login (nằm ngoài route group nên không bị layout này bọc).
// Nhờ đó chỉ cần khai báo ProtectedRoute + Header + Footer đúng 1 lần ở đây.
export default function MainLayout({ children }) {
  return (
    <ProtectedRoute>
      <Shell>{children}</Shell>
    </ProtectedRoute>
  );
}
