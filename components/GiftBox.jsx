"use client";

import Confetti from "@/components/Confetti";
import { getPersonLabel } from "@/lib/authorDisplay";
import { isStickerImage } from "@/lib/gifts";

function formatGiftTime(dateObj) {
    if (!dateObj) return "";
    const time = dateObj.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
    const date = dateObj.toLocaleDateString("vi-VN");
    return `${time} - ${date}`;
}

// Hộp quà nổi bật ở đầu trang.
// - Mặc định: hiện hộp quà ĐÓNG (luôn lắc lư để thu hút chú ý) đại diện cho
//   món quà mới nhất mà đối phương gửi cho bạn (`gift`), bấm vào sẽ gọi
//   `onOpen`.
// - Khi có `openedGift` (do bấm "Mở quà" ở hộp quà này HOẶC ở bất kỳ mục nào
//   trong danh sách lịch sử bên dưới) -> hộp quà đóng được THAY THẾ bằng nội
//   dung quà đã mở (sticker to + lời chúc) kèm hiệu ứng tung hoa, ngay tại vị
//   trí này. Bấm "Đóng" (hoặc onClose) để quay lại hộp quà mặc định.
export default function GiftBox({ gift, openedGift, burstKey = 0, onOpen, onClose }) {
    if (openedGift) {
        return (
            <div className="relative overflow-hidden rounded-2xl bg-white/70 px-6 py-8 text-center shadow-sm animate-pop-in">
                <Confetti burstKey={burstKey} />

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Đóng"
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                >
                    ✕
                </button>

                <div className="mb-3 flex justify-center leading-none">
                    {isStickerImage(openedGift.sticker) ? (
                        <img
                            src={openedGift.sticker}
                            alt="Sticker quà tặng"
                            className="h-32 w-32 object-contain"
                        />
                    ) : (
                        <span className="text-7xl">{openedGift.sticker}</span>
                    )}
                </div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-400">
                    Quà từ{" "}
                    {getPersonLabel({
                        name: openedGift.senderName,
                        email: openedGift.senderEmail,
                    })}
                </p>
                <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {openedGift.message || "Gửi tặng cậu một món quà nho nhỏ ♡"}
                </p>
                {openedGift.sentAt && (
                    <p className="text-xs text-slate-400">
                        Đã gửi lúc {formatGiftTime(openedGift.sentAt)}
                    </p>
                )}
            </div>
        );
    }

    const active = !!gift;

    return (
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-white/70 px-6 py-12 text-center shadow-sm">
            {active ? (
                <>
                    <button
                        type="button"
                        onClick={() => onOpen?.(gift)}
                        aria-label="Mở hộp quà"
                        className="animate-gift-bounce text-7xl transition hover:scale-110 sm:text-8xl"
                    >
                        🎁
                    </button>
                    <p className="text-sm font-medium text-brand-600">
                        Bạn có 1 món quà từ đối phương ♡
                    </p>
                    <p className="text-xs text-slate-400">Bấm vào hộp quà để mở nhé</p>
                </>
            ) : (
                <>
                    <span className="text-5xl opacity-40 grayscale">🎁</span>
                    <p className="text-sm text-slate-500">
                        Bạn chưa nhận được quà nào từ đối phương.
                    </p>
                </>
            )}
        </div>
    );
}
