"use client";

import { useEffect, useState } from "react";
import Confetti from "@/components/Confetti";
import { getPersonLabel } from "@/lib/authorDisplay";
import { useAuth } from "@/lib/AuthContext";
import {
    subscribeCurrentGift,
    isGiftActive,
    isGiftForViewer,
    isStickerImage,
} from "@/lib/gifts";

function formatTimeVN(dateObj) {
    if (!dateObj) return "";
    return dateObj.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Hiển thị "hộp quà" quà đối phương gửi cho bạn:
// - Nếu có quà còn hiệu lực (gửi trong vòng 24h) từ đối phương -> hiện hộp
//   quà, bấm vào sẽ mở ra sticker + lời chúc kèm hiệu ứng tung hoa.
// - Nếu không có quà (hoặc quà đã quá 24h) -> hiện dòng chữ thông báo.
export default function GiftBox() {
    const { user } = useAuth();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [burstKey, setBurstKey] = useState(0);

    useEffect(() => {
        const unsub = subscribeCurrentGift((g) => {
            setGift(g);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Đóng modal tự động nếu quà vừa hết hiệu lực trong lúc đang mở
    const active = isGiftActive(gift) && isGiftForViewer(gift, user?.email);

    useEffect(() => {
        if (!active && open) setOpen(false);
    }, [active, open]);

    useEffect(() => {
        if (!open) return;
        function handleKeyDown(e) {
            if (e.key === "Escape") setOpen(false);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    function handleOpenGift() {
        setBurstKey((k) => k + 1);
        setOpen(true);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center rounded-2xl bg-white/70 px-6 py-8 shadow-sm">
                <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/70 px-6 py-8 text-center shadow-sm">
                {active ? (
                    <>
                        <button
                            type="button"
                            onClick={handleOpenGift}
                            aria-label="Mở hộp quà"
                            className="animate-gift-bounce text-7xl transition hover:scale-110 sm:text-8xl"
                        >
                            🎁
                        </button>
                        <p className="text-sm font-medium text-brand-600">
                            Bạn có 1 món quà mới từ đối phương ♡
                        </p>
                        <p className="text-xs text-slate-400">Bấm vào hộp quà để mở nhé</p>
                    </>
                ) : (
                    <>
                        <span className="text-5xl opacity-40 grayscale">🎁</span>
                        <p className="text-sm text-slate-500">
                            Hôm nay bạn chưa nhận được quà từ đối phương.
                        </p>
                    </>
                )}
            </div>

            {open && active && gift && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 px-4 backdrop-blur-sm animate-fade-in"
                    onClick={() => setOpen(false)}
                >
                    <Confetti burstKey={burstKey} />

                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl animate-pop-in"
                    >
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Đóng"
                            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                        >
                            ✕
                        </button>

                        <div className="mb-3 flex justify-center leading-none">
                            {isStickerImage(gift.sticker) ? (
                                <img
                                    src={gift.sticker}
                                    alt="Sticker quà tặng"
                                    className="h-40 w-40 object-contain sm:h-48 sm:w-48"
                                />
                            ) : (
                                <span className="text-8xl sm:text-9xl">{gift.sticker}</span>
                            )}
                        </div>
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-400">
                            Quà từ {getPersonLabel({ name: gift.senderName, email: gift.senderEmail })}
                        </p>
                        <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                            {gift.message || "Gửi tặng cậu một món quà nho nhỏ ♡"}
                        </p>
                        {gift.sentAt && (
                            <p className="text-xs text-slate-400">
                                Đã gửi lúc {formatTimeVN(gift.sentAt)}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
