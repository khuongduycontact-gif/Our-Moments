"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import GiftBox from "@/components/GiftBox";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAuth } from "@/lib/AuthContext";
import {
    sendGift,
    deleteGift,
    markGiftOpened,
    subscribeAllGifts,
    cleanupExpiredGifts,
    isGiftFromToday,
    isGiftForViewer,
    isGiftFromSender,
    isStickerImage,
} from "@/lib/gifts";
import { fetchStickers } from "@/lib/giphy";

function formatGiftTime(dateObj) {
    if (!dateObj) return "";
    const time = dateObj.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
    const date = dateObj.toLocaleDateString("vi-VN");
    return `${time} - ${date}`;
}

export default function GiftPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [sticker, setSticker] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState(null);

    // Tự ẩn toast sau 1s
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 1000);
        return () => clearTimeout(t);
    }, [toast]);

    const [gifQuery, setGifQuery] = useState("");
    const [gifResults, setGifResults] = useState([]);
    const [gifLoading, setGifLoading] = useState(false);
    const [gifError, setGifError] = useState("");

    // Tải sẵn sticker "nổi bật" khi vừa vào trang, sau đó tìm theo từ khoá
    // người dùng gõ (debounce nhẹ để tránh gọi API dồn dập).
    useEffect(() => {
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
    }, [gifQuery]);

    // Toàn bộ lịch sử quà (mới nhất trước) - tách ra thành quà nhận được từ
    // đối phương và quà chính mình đã gửi đi.
    const [allGifts, setAllGifts] = useState([]);
    const [loadingGifts, setLoadingGifts] = useState(true);

    useEffect(() => {
        const unsub = subscribeAllGifts((gifts) => {
            setAllGifts(gifts);
            setLoadingGifts(false);
        });
        return () => unsub();
    }, []);

    // Dọn sạch quà đã qua ngày (Firestore) ngay khi mở trang, và mỗi khi
    // đồng hồ vừa điểm sang 00:00:00 ngày mới trong lúc trang vẫn đang mở.
    // `todayKey` dùng để buộc danh sách hiển thị re-render lại đúng lúc
    // sang ngày mới, kể cả khi Firestore chưa kịp xoá xong dữ liệu cũ.
    const [todayKey, setTodayKey] = useState(() => new Date().toLocaleDateString("en-CA"));

    useEffect(() => {
        cleanupExpiredGifts().catch((err) => console.error(err));

        let dailyInterval;
        function scheduleMidnightRollover() {
            const now = new Date();
            const nextMidnight = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0, 0, 0, 0
            );
            const msUntilMidnight = nextMidnight.getTime() - now.getTime();

            const timeout = setTimeout(() => {
                setTodayKey(new Date().toLocaleDateString("en-CA"));
                cleanupExpiredGifts().catch((err) => console.error(err));
                // Sau lần đầu, lặp lại đều đặn mỗi 24h
                dailyInterval = setInterval(() => {
                    setTodayKey(new Date().toLocaleDateString("en-CA"));
                    cleanupExpiredGifts().catch((err) => console.error(err));
                }, 24 * 60 * 60 * 1000);
            }, msUntilMidnight);

            return timeout;
        }

        const midnightTimeout = scheduleMidnightRollover();
        return () => {
            clearTimeout(midnightTimeout);
            if (dailyInterval) clearInterval(dailyInterval);
        };
    }, []);

    // Chỉ hiển thị quà được gửi trong NGÀY HÔM NAY - qua 00:00:00 là coi như
    // hết hạn, không còn hiển thị nữa (kể cả nếu việc xoá thật trong
    // Firestore chưa kịp chạy xong).
    const todaysGifts = allGifts.filter((g) => isGiftFromToday(g, todayKey));
    const receivedGifts = todaysGifts.filter((g) => isGiftForViewer(g, user?.email));
    const sentGifts = todaysGifts.filter((g) => isGiftFromSender(g, user?.email));
    // Mặc định hộp quà nổi bật ở trên đầu trang là quà MỚI NHẤT mà đối
    // phương gửi cho bạn.
    const latestReceivedGift = receivedGifts[0] || null;

    // Nội dung quà đang được "mở" hiển thị ngay tại vị trí hộp quà mặc định
    // ở đầu trang - dùng chung cho cả nút mở ở hộp quà lẫn nút "Mở quà"
    // trong danh sách lịch sử bên dưới.
    const [openedGift, setOpenedGift] = useState(null);
    const [burstKey, setBurstKey] = useState(0);
    const heroRef = useRef(null);

    function handleOpenGift(gift) {
        if (!gift) return;
        setBurstKey((k) => k + 1);
        setOpenedGift(gift);
        if (!gift.opened) markGiftOpened(gift.id);

        // Cuộn tới hộp quà, có trừ đi chiều cao của header (đang "sticky" đè
        // lên đầu trang) để phần trên của hộp quà không bị header che mất.
        const heroEl = heroRef.current;
        if (heroEl) {
            const headerEl = document.querySelector("header");
            const headerHeight = headerEl?.getBoundingClientRect().height || 0;
            const top =
                heroEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
            window.scrollTo({ top, behavior: "smooth" });
        }
    }

    useEffect(() => {
        if (!openedGift) return;
        function handleKeyDown(e) {
            if (e.key === "Escape") setOpenedGift(null);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [openedGift]);

    // Modal gửi quà
    const [sendModalOpen, setSendModalOpen] = useState(false);

    useEffect(() => {
        if (!sendModalOpen) return;
        function handleKeyDown(e) {
            if (e.key === "Escape" && !sending) setSendModalOpen(false);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [sendModalOpen, sending]);

    // Xoá 1 quà đã gửi - xác định quà cần xoá qua id
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        if (deleting || !deleteTarget) return;
        setDeleting(true);
        try {
            await deleteGift(deleteTarget.id, user?.email || "");
            setToast({ type: "success", message: "Đã xoá quà bạn vừa gửi." });
            setDeleteTarget(null);
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

        if (!sticker) {
            setToast({ type: "error", message: "Chọn 1 sticker trước đã nhé." });
            return;
        }

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
            setSticker("");
            setToast({
                type: "success",
                message: "Đã gửi quà cho đối phương ♡",
            });
            // Gửi xong thì ẩn modal đi
            setSendModalOpen(false);
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

                {/* Hộp quà nổi bật ở đầu trang - mặc định là quà mới nhất mà đối
            phương gửi cho bạn. Khi mở ra (từ đây hoặc từ danh sách bên
            dưới), nội dung quà sẽ hiển thị thay thế ngay tại đây. */}
                <div ref={heroRef} className="mb-6">
                    <GiftBox
                        gift={latestReceivedGift}
                        openedGift={openedGift}
                        burstKey={burstKey}
                        onOpen={handleOpenGift}
                        onClose={() => setOpenedGift(null)}
                    />
                </div>

                {/* Nút gửi quà */}
                <button
                    type="button"
                    onClick={() => setSendModalOpen(true)}
                    className="mb-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/70 px-4 py-4 text-center shadow-sm transition hover:bg-white"
                >
                    <span className="text-2xl leading-none">💌</span>
                    <span className="text-sm font-semibold text-brand-700">
                        Gửi quà cho đối phương
                    </span>
                </button>

                {/* Danh sách quà đối phương đã gửi cho bạn */}
                <section className="mb-8">
                    <h2 className="mb-3 text-sm font-semibold text-brand-700">
                        Quà đối phương đã gửi cho bạn
                    </h2>
                    {loadingGifts ? (
                        <div className="flex items-center justify-center py-8">
                            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
                        </div>
                    ) : receivedGifts.length ? (
                        <div className="space-y-2.5">
                            {receivedGifts.map((g) => (
                                <div
                                    key={g.id}
                                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="text-2xl leading-none">🎁</span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-600">
                                                {g.opened ? "Quà đã mở" : "Quà chưa mở"}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatGiftTime(g.sentAt)}
                                                {!g.opened && (
                                                    <span className="ml-1.5 font-medium text-brand-500">
                                                        · Mới
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenGift(g)}
                                        className="shrink-0 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
                                    >
                                        Mở quà
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl bg-white/50 px-4 py-6 text-center text-xs text-slate-400">
                            Đối phương chưa gửi quà nào cho bạn.
                        </p>
                    )}
                </section>

                {/* Danh sách quà bạn đã gửi cho đối phương */}
                <section className="mb-6">
                    <h2 className="mb-3 text-sm font-semibold text-brand-700">
                        Quà bạn đã gửi cho đối phương
                    </h2>
                    {loadingGifts ? null : sentGifts.length ? (
                        <div className="space-y-2.5">
                            {sentGifts.map((g) => (
                                <div
                                    key={g.id}
                                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-sm"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        {isStickerImage(g.sticker) ? (
                                            <img
                                                src={g.sticker}
                                                alt=""
                                                className="h-9 w-9 shrink-0 object-contain"
                                            />
                                        ) : (
                                            <span className="text-2xl leading-none">{g.sticker}</span>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-600">
                                                {g.message || "Một món quà nho nhỏ ♡"}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatGiftTime(g.sentAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteTarget(g)}
                                        className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                                    >
                                        Xoá quà
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl bg-white/50 px-4 py-6 text-center text-xs text-slate-400">
                            Bạn chưa gửi quà nào cho đối phương.
                        </p>
                    )}
                </section>

                <ConfirmDialog
                    open={!!deleteTarget}
                    title="Xoá quà đã gửi?"
                    message="Quà sẽ bị xoá hoàn toàn và đối phương sẽ không còn thấy nữa. Hành động này không thể hoàn tác."
                    confirmLabel="Xoá quà"
                    loading={deleting}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />

                {/* Modal gửi quà cho đối phương - cuộn nội dung bên trong để
            không bao giờ vượt quá chiều cao màn hình. */}
                {sendModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm animate-fade-in"
                        onClick={() => !sending && setSendModalOpen(false)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative flex w-full max-w-xl animate-pop-in flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
                            style={{ maxHeight: "calc(100vh - 4rem)" }}
                        >
                            {/* Tiêu đề modal - cố định ở trên, không cuộn theo nội dung */}
                            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
                                <h3 className="font-display text-base font-semibold text-slate-800">
                                    Gửi quà cho đối phương
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => !sending && setSendModalOpen(false)}
                                    aria-label="Đóng"
                                    disabled={sending}
                                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 disabled:opacity-60"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Nội dung modal - cuộn được, giới hạn chiều cao */}
                            <form
                                onSubmit={handleSend}
                                className="flex-1 space-y-5 overflow-y-auto px-6 py-5"
                            >
                                <div>
                                    <p className="mb-3 text-xs text-slate-400">
                                        Chọn 1 sticker và viết lời chúc nho nhỏ, quà sẽ được lưu lại
                                        trong lịch sử của cả hai người.
                                    </p>

                                    {/* Sticker đang chọn - hiển thị để xem trước */}
                                    <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-brand-50/70 py-4">
                                        {sticker ? (
                                            <img
                                                src={sticker}
                                                alt="Sticker đã chọn"
                                                className="h-32 w-32 object-contain"
                                            />
                                        ) : (
                                            <span className="text-7xl leading-none opacity-30">🎁</span>
                                        )}
                                    </div>

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
                                            <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
                                                {gifResults.map((g) => (
                                                    <button
                                                        key={g.id}
                                                        type="button"
                                                        onClick={() => setSticker(g.url)}
                                                        aria-label="Chọn sticker"
                                                        className={`flex aspect-square items-center justify-center overflow-hidden rounded-lg p-1 transition ${sticker === g.url
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
                                    </div>
                                </div>

                                <div>
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
                                    {sending ? "Đang gửi..." : "🎁 Gửi quà"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
