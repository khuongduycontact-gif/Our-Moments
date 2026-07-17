"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import GiftBox from "@/components/GiftBox";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/AuthContext";
import {
    GIFT_STICKERS,
    sendGift,
    deleteGift,
    subscribeCurrentGift,
    isGiftActive,
    isGiftFromSender,
    isStickerImage,
} from "@/lib/gifts";
import { fetchStickers } from "@/lib/giphy";

export default function GiftPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [sticker, setSticker] = useState(GIFT_STICKERS[0]);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState(null);

    // Tab chọn nguồn sticker: "emoji" (bộ có sẵn) hoặc "gif" (tìm từ GIPHY)
    const [stickerTab, setStickerTab] = useState("emoji");
    const [gifQuery, setGifQuery] = useState("");
    const [gifResults, setGifResults] = useState([]);
    const [gifLoading, setGifLoading] = useState(false);
    const [gifError, setGifError] = useState("");

    // Tải sẵn sticker "nổi bật" khi vừa chuyển sang tab GIF, sau đó tìm theo
    // từ khoá người dùng gõ (debounce nhẹ để tránh gọi API dồn dập).
    useEffect(() => {
        if (stickerTab !== "gif") return;
        setGifLoading(true);
        setGifError("");
        const timer = setTimeout(async () => {
            try {
                const stickers = await fetchStickers(gifQuery);
                setGifResults(stickers);
            } catch (err) {
                console.error(err);
                setGifError("Không tải được sticker, thử lại nhé.");
            } finally {
                setGifLoading(false);
            }
        }, gifQuery ? 400 : 0);
        return () => clearTimeout(timer);
    }, [stickerTab, gifQuery]);

    // Theo dõi quà hiện tại để biết đây có phải quà do CHÍNH mình vừa gửi
    // hay không -> chỉ người gửi mới thấy nút xoá (không ai được sửa quà đã gửi).
    const [currentGift, setCurrentGift] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        const unsub = subscribeCurrentGift(setCurrentGift);
        return () => unsub();
    }, []);

    const mySentGiftActive =
        isGiftActive(currentGift) && isGiftFromSender(currentGift, user?.email);

    async function handleDelete() {
        if (deleting) return;
        setDeleting(true);
        try {
            await deleteGift(user?.email || "");
            setToast({ type: "success", message: "Đã xoá quà bạn vừa gửi." });
            setConfirmOpen(false);
        } catch (err) {
            console.error(err);
            setToast({
                type: "error",
                message: "Có lỗi khi xoá quà, vui lòng thử lại.",
            });
        } finally {
            setDeleting(false);
        }
    }

    async function handleSend(e) {
        e.preventDefault();
        if (sending) return;

        setSending(true);
        try {
            await sendGift({
                sticker,
                message,
                sender: {
                    email: user?.email || "",
                    name: user?.displayName || "",
                },
            });
            setMessage("");
            setToast({
                type: "success",
                message: "Đã gửi quà cho đối phương ♡",
            });
        } catch (err) {
            console.error(err);
            setToast({
                type: "error",
                message: "Có lỗi khi gửi quà, vui lòng thử lại.",
            });
        } finally {
            setSending(false);
        }
    }

    return (
        <>
            <Toast toast={toast} />

            <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h1 className="font-display text-2xl font-bold text-brand-700">
                        Quà tặng ♡
                    </h1>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="shrink-0 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                        ← Về trang chủ
                    </button>
                </div>

                {/* Quà nhận được từ đối phương */}
                <div className="mb-6">
                    <p className="mb-2 text-sm font-medium text-slate-600">
                        Quà bạn nhận được hôm nay
                    </p>
                    <GiftBox />
                </div>

                {/* Quà bạn vừa gửi - chỉ hiện khi quà hiện tại là do chính mình gửi.
            Không cho sửa nội dung, chỉ cho thu hồi (xoá) nếu gửi nhầm. */}
                {mySentGiftActive && (
                    <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-5 py-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            {isStickerImage(currentGift.sticker) ? (
                                <img src={currentGift.sticker} alt="" className="h-10 w-10 object-contain" />
                            ) : (
                                <span className="text-3xl leading-none">{currentGift.sticker}</span>
                            )}
                            <div>
                                <p className="text-sm font-medium text-slate-600">
                                    Quà bạn vừa gửi cho đối phương
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setConfirmOpen(true)}
                            className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                            Xoá quà
                        </button>
                    </div>
                )}

                <ConfirmDialog
                    open={confirmOpen}
                    title="Xoá quà đã gửi?"
                    message="Quà sẽ bị xoá hoàn toàn và đối phương sẽ không còn thấy nữa. Hành động này không thể hoàn tác."
                    confirmLabel="Xoá quà"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmOpen(false)}
                />

                {/* Gửi quà cho đối phương */}
                <form
                    onSubmit={handleSend}
                    className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
                >
                    <div>
                        <p className="mb-1 text-sm font-medium text-slate-600">
                            Gửi quà cho đối phương
                        </p>
                        <p className="mb-3 text-xs text-slate-400">
                            Chọn 1 sticker và viết lời chúc nho nhỏ, quà sẽ hiển thị cho đối
                            phương trong 24 giờ.
                        </p>

                        {/* Sticker đang chọn - hiển thị thật to để xem trước */}
                        <div className="mb-4 flex items-center justify-center rounded-2xl bg-brand-50/70 py-6">
                            {isStickerImage(sticker) ? (
                                <img src={sticker} alt="Sticker đã chọn" className="h-32 w-32 object-contain" />
                            ) : (
                                <span className="text-8xl leading-none">{sticker}</span>
                            )}
                        </div>

                        {/* Chuyển đổi giữa bộ emoji có sẵn và tìm sticker GIF từ GIPHY */}
                        <div className="mb-3 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setStickerTab("emoji")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${stickerTab === "emoji"
                                        ? "bg-brand-500 text-white"
                                        : "bg-brand-50/70 text-slate-500 hover:bg-brand-100"
                                    }`}
                            >
                                Emoji
                            </button>
                            <button
                                type="button"
                                onClick={() => setStickerTab("gif")}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${stickerTab === "gif"
                                        ? "bg-brand-500 text-white"
                                        : "bg-brand-50/70 text-slate-500 hover:bg-brand-100"
                                    }`}
                            >
                                Sticker GIF
                            </button>
                        </div>

                        {stickerTab === "emoji" ? (
                            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                                {GIFT_STICKERS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSticker(s)}
                                        aria-label={`Chọn sticker ${s}`}
                                        className={`flex aspect-square items-center justify-center rounded-xl text-4xl transition sm:text-5xl ${sticker === s
                                                ? "bg-brand-500 ring-2 ring-brand-300"
                                                : "bg-brand-50/70 hover:bg-brand-100"
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="text"
                                    value={gifQuery}
                                    onChange={(e) => setGifQuery(e.target.value)}
                                    placeholder="Tìm sticker (vd: yêu, hoa, chúc mừng...)"
                                    className="mb-3 w-full rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                                />

                                {gifError && (
                                    <p className="mb-2 text-xs text-red-500">{gifError}</p>
                                )}

                                {gifLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                                        {gifResults.map((g) => (
                                            <button
                                                key={g.id}
                                                type="button"
                                                onClick={() => setSticker(g.url)}
                                                aria-label="Chọn sticker GIF"
                                                className={`flex aspect-square items-center justify-center overflow-hidden rounded-xl p-1 transition ${sticker === g.url
                                                        ? "bg-brand-500 ring-2 ring-brand-300"
                                                        : "bg-brand-50/70 hover:bg-brand-100"
                                                    }`}
                                            >
                                                <img
                                                    src={g.previewUrl}
                                                    alt=""
                                                    className="h-full w-full object-contain"
                                                />
                                            </button>
                                        ))}
                                        {!gifResults.length && !gifError && (
                                            <p className="col-span-full py-4 text-center text-xs text-slate-400">
                                                Không tìm thấy sticker nào, thử từ khoá khác nhé.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <p className="mt-2 text-[11px] text-slate-400">
                                    Sticker được cung cấp bởi GIPHY.
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-600">
                            Lời chúc
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Viết một lời chúc thật ngọt ngào..."
                            className="w-full resize-y rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={sending}
                        className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-600 disabled:opacity-60"
                    >
                        {sending ? "Đang gửi..." : `${isStickerImage(sticker) ? "🎁" : sticker} Gửi quà`}
                    </button>
                </form>
            </div>
        </>
    );
}
