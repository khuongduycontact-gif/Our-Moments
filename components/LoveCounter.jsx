"use client";

import { useEffect, useState } from "react";
import { getLoveDays, formatLoveStartDateVN } from "@/lib/loveCounter";
import { CalendarIcon } from "@/components/Icons";

// Thẻ "Ngày kỷ niệm" hiển thị ở góc phải khối Hero trang chủ (giao diện mới):
// ngày bắt đầu yêu nhau + số ngày đã bên nhau, tự cập nhật khi qua ngày mới
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
    <div className="w-full max-w-[220px] rounded-2xl bg-white p-5 text-center shadow-sm sm:text-left">
      <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 sm:justify-start">
        <CalendarIcon className="h-3.5 w-3.5 text-brand-400" />
        Ngày kỷ niệm
      </p>
      <p className="font-display mt-1 text-lg font-bold text-brand-700">
        {formatLoveStartDateVN()}
      </p>

      <div className="my-3 h-px w-full bg-brand-100" />

      <p className="text-xs font-medium text-slate-400">Đã bên nhau</p>
      <p className="font-display mt-1 flex items-center justify-center gap-1.5 text-2xl font-bold text-brand-600 sm:justify-start">
        {days.toLocaleString("vi-VN")} ngày
        <span aria-hidden="true">♡</span>
      </p>
      <p className="mt-2 text-[11px] text-slate-400">
        ...và còn tiếp tục mỗi ngày ♡
      </p>
    </div>
  );
}
