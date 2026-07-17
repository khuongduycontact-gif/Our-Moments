"use client";

import { useMemo } from "react";

const CONFETTI_EMOJI = ["🎉", "💜", "✨", "🎊", "💐", "🌸"];

// Hiệu ứng "tung hoa" đơn giản bằng CSS, không cần thêm thư viện ngoài.
// `burstKey` đổi giá trị (vd: mỗi lần bấm mở quà) sẽ khiến hiệu ứng chạy lại
// từ đầu vì toàn bộ danh sách mảnh confetti được tạo mới.
export default function Confetti({ burstKey = 0, count = 26 }) {
    const pieces = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => ({
            id: `${burstKey}-${i}`,
            left: Math.random() * 100,
            delay: Math.random() * 0.4,
            duration: 2.2 + Math.random() * 1.4,
            drift: `${Math.round((Math.random() - 0.5) * 160)}px`,
            spin: `${Math.round(360 + Math.random() * 360)}deg`,
            size: 14 + Math.round(Math.random() * 10),
            emoji: CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)],
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }));
    }, [burstKey, count]);

    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
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
        </div>
    );
}
