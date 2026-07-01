"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const { user, loading, authError, setAuthError, loginWithGoogle } =
    useAuth();
  const router = useRouter();
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  // Hiển thị lỗi từ AuthContext (ví dụ: đăng nhập đúng nhưng sai tài khoản được phép)
  useEffect(() => {
    if (authError) {
      setError(authError);
      setAuthError("");
    }
  }, [authError, setAuthError]);

  async function handleGoogleLogin() {
    setError("");
    setGoogleSubmitting(true);

    try {
      await loginWithGoogle();

      // Chỉ chuyển trang khi dùng Popup (PC)
      if (!/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
        router.replace("/");
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(mapFirebaseError(err.code));
      }
    } finally {
      setGoogleSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-600">
            💜
          </div>
          <h1 className="font-display text-2xl font-bold text-brand-700">
            Our Moments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Đăng nhập để xem lại những kỷ niệm của chúng ta
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleSubmitting}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <GoogleIcon />
          {googleSubmitting ? "Đang mở Google..." : "Đăng nhập bằng Google"}
        </button>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

function mapFirebaseError(code) {
  switch (code) {
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ đăng nhập, vui lòng cho phép popup.";
    case "auth/cancelled-popup-request":
    case "auth/popup-closed-by-user":
      return "Bạn đã đóng cửa sổ đăng nhập.";
    default:
      return "Có lỗi xảy ra, vui lòng thử lại.";
  }
}
