"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

const AuthContext = createContext(null);

// Chỉ những email này mới được phép vào ứng dụng
const ALLOWED_EMAILS = [
  "duynk.contact@gmail.com",
  "celinenguyen2207@gmail.com",
  "thuuyen22072002@gmail.com",
];

// Trên điện thoại, signInWithPopup hay bị lỗi "missing initial state" do
// trình duyệt mobile chặn cookie/state của popup -> dùng redirect thay thế.
function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    // Bắt lỗi (nếu có) từ luồng đăng nhập redirect trên mobile
    getRedirectResult(auth).catch((err) => {
      if (err?.code && err.code !== "auth/no-current-user") {
        console.error(err);
        setAuthError("Có lỗi khi đăng nhập, vui lòng thử lại.");
      }
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
    if (isMobileDevice()) {
      // Trên mobile: chuyển hướng cả trang thay vì mở popup
      return signInWithRedirect(auth, provider);
    }
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