"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
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
    // Ghi nhớ đăng nhập giữa các lần tải trang/đóng mở lại trình duyệt
    setPersistence(auth, browserLocalPersistence).catch(() => { });

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
    // prompt: "select_account" bắt Google luôn hiện màn hình chọn tài khoản,
    // thay vì tự động đăng nhập vào tài khoản đã dùng gần nhất trên máy.
    provider.setCustomParameters({ prompt: "select_account" });
    // Dùng popup: ổn định hơn signInWithRedirect với các web không host
    // trên Firebase Hosting (redirect dễ bị trình duyệt di động chặn lưu trạng thái).
    return signInWithPopup(auth, provider);
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