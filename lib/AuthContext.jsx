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

const ALLOWED_EMAILS = [
  "duynk.contact@gmail.com",
  "celinenguyen2207@gmail.com",
  "thuuyen22072002@gmail.com",
];

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      if (err?.code && err.code !== "auth/no-current-user") {
        console.error(err);
        setAuthError(`Lỗi đăng nhập: ${err.code || err.message}`);
      }
    });

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && !ALLOWED_EMAILS.includes(u.email)) {
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