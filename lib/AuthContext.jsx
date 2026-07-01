"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "./firebase";

const AuthContext = createContext(null);

// Chỉ những email trong danh sách này mới được phép vào ứng dụng
// Thêm/xoá email bằng cách sửa mảng dưới đây.
const ALLOWED_EMAILS = [
  "duynk.contact@gmail.com",
  // "email-thu-2@gmail.com", // <-- thêm email thứ 2 vào đây
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Ghi nhớ đăng nhập giữa các lần tải trang - quan trọng với luồng
    // signInWithRedirect trên di động (trang bị tải lại sau khi quay về từ Google).
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    // Xử lý kết quả trả về ngay sau khi Google chuyển hướng lại trang web
    // (bắt buộc phải gọi hàm này khi dùng signInWithRedirect).
    getRedirectResult(auth).catch((err) => {
      console.error("Lỗi khi xử lý kết quả đăng nhập Google:", err);
      setAuthError("Đăng nhập thất bại, vui lòng thử lại.");
    });

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && !ALLOWED_EMAILS.includes(u.email)) {
        // Đăng nhập đúng nhưng không phải tài khoản được phép -> đăng xuất ngay
        await signOut(auth);
        setUser(null);
        setAuthError("Tài khoản này không có quyền truy cập.");
        setLoading(false);
        return;
      }
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    // Gợi ý sẵn tài khoản đầu tiên trong danh sách được phép
    provider.setCustomParameters({ login_hint: ALLOWED_EMAILS[0] });
    // Dùng redirect (chuyển hẳn sang trang đăng nhập Google) thay vì popup,
    // vì popup rất dễ bị chặn/lỗi trên trình duyệt di động.
    return signInWithRedirect(auth, provider);
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, loading, authError, setAuthError, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong AuthProvider");
  return ctx;
}