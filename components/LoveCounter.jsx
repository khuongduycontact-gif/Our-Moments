"use client";

import { useEffect, useState } from "react";
import { getLoveDays, formatLoveStartDateVN } from "@/lib/loveCounter";

// Hiển thị số ngày yêu nhau, tự cập nhật khi qua ngày mới
// (không cần refresh trang nếu người dùng mở trang xuyên đêm).
export default function LoveCounter() {
  const [days, setDays] = useState(() => getLoveDays());

  useEffect(() => {
    setDays(getLoveDays());

    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      5
    );
    const msUntilMidnight = nextMidnight - now;

    const timeout = setTimeout(function tick() {
      setDays(getLoveDays());
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="mx-auto flex max-w-fit flex-col items-center gap-1 rounded-2xl bg-white/70 px-6 py-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">
        Ngày chúng mình chính thức {formatLoveStartDateVN()} 💕
      </p>
      <p className="font-display text-2xl font-bold text-brand-600 md:text-3xl">
        {days.toLocaleString("vi-VN")} ngày
      </p>
      <p className="text-xs text-slate-400">...và còn tiếp tục mỗi ngày ♡</p>
    </div>
  );
}
