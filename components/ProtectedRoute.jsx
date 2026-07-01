"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <div className="flex flex-col items-center gap-3 text-brand-600">
          <span className="text-3xl animate-pulse">💜</span>
          <p className="font-body text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  return children;
}
