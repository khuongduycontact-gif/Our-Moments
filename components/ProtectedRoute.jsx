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
    const bars = Array.from({ length: 12 });
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <div className="relative flex h-24 w-24 items-center justify-center">
          {bars.map((_, i) => (
            <span
              key={i}
              className="spinner-dial-bar-wrap"
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <span
                className="spinner-dial-bar"
                style={{ animationDelay: `${(-(12 - i) / 12).toFixed(3)}s` }}
              />
            </span>
          ))}
          <span className="relative z-10 text-3xl">💜</span>
        </div>
      </div>
    );
  }

  return children;
}