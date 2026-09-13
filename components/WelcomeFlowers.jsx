"use client";

import { useMemo } from "react";

const FLOWER_EMOJI = ["🌸", "🌺", "🌷", "🌼", "💮", "🌹"];

// Hiệu ứng "thả hoa" chào mừng, hiện đúng 1 lần vào lần đầu đăng nhập của
// mỗi tài khoản trên mỗi thiết bị (xem chỗ gọi ở app/(main)/page.jsx).
// Dùng lại animation "confetti-fall" có sẵn trong globals.css nhưng phủ toàn
// màn hình (fixed, z cao hơn Header) thay vì chỉ nằm trong 1 khối như
// <Confetti /> (hộp quà).
export default function WelcomeFlowers({ count = 40 }) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.6 + Math.random() * 1.8,
      drift: `${Math.round((Math.random() - 0.5) * 200)}px`,
      spin: `${Math.round(360 + Math.random() * 360)}deg`,
      size: 16 + Math.round(Math.random() * 14),
      emoji: FLOWER_EMOJI[Math.floor(Math.random() * FLOWER_EMOJI.length)],
    }));
  }, [count]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--confetti-drift": p.drift,
            "--confetti-spin": p.spin,
          }}
        >
          {p.emoji}
        </span>
      ))}

      <div className="animate-fade-in absolute left-1/2 top-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-5 py-2.5 shadow-lg sm:top-24">
        <p className="font-display text-sm font-semibold text-brand-600 sm:text-base">
          Chào mừng bạn đến với The Love Chapter ♡
        </p>
      </div>
    </div>
  );
}
