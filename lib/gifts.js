"use client";

import { doc, getDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Chỉ lưu đúng 1 "món quà đang hiệu lực" dùng chung cho cả hai người, giống
// như 1 chiếc hộp quà chung - mỗi lần gửi quà mới sẽ ghi đè lên quà cũ.
const COLLECTION = "gifts";
const CURRENT_GIFT_DOC_ID = "current";

// Quà chỉ còn hiệu lực trong 24 giờ kể từ lúc gửi, sau đó tự động coi như
// "chưa có quà" mà không cần thao tác gì thêm.
export const GIFT_TTL_MS = 24 * 60 * 60 * 1000;

// Bộ sticker (emoji) để chọn khi gửi quà
export const GIFT_STICKERS = [
    "🎁",
    "💐",
    "🌹",
    "🍫",
    "🧸",
    "💌",
    "🎂",
    "🍦",
    "🌷",
    "🎉",
    "😘",
    "🥰",
    "🍭",
    "🍩",
    "🎈",
    "💝",
];

function giftDocRef() {
    return doc(db, COLLECTION, CURRENT_GIFT_DOC_ID);
}

// Sticker giờ có thể là 1 emoji (vd "🎁") hoặc 1 URL ảnh sticker GIF lấy từ
// GIPHY (vd "https://media.giphy.com/..."). Hàm này giúp UI biết nên hiển
// thị bằng <img> hay hiển thị text emoji bình thường.
export function isStickerImage(sticker) {
    return typeof sticker === "string" && sticker.startsWith("http");
}

// Chuẩn hoá dữ liệu quà đọc từ Firestore (convert Timestamp -> Date)
function normalizeGift(data) {
    if (!data) return null;
    return {
        sticker: data.sticker || "🎁",
        message: data.message || "",
        senderEmail: data.senderEmail || "",
        senderName: data.senderName || "",
        sentAt: data.sentAt && data.sentAt.toDate ? data.sentAt.toDate() : null,
    };
}

// Gửi 1 món quà mới (sticker + lời chúc) cho đối phương - ghi đè lên quà
// hiện tại, xem như "hộp quà" chỉ chứa món quà mới nhất tại 1 thời điểm.
export async function sendGift({ sticker, message, sender }) {
    await setDoc(giftDocRef(), {
        sticker: sticker || "🎁",
        message: (message || "").trim(),
        senderEmail: sender?.email || "",
        senderName: sender?.name || "",
        sentAt: serverTimestamp(),
    });
}

// Xoá món quà hiện tại - CHỈ người đã gửi quà mới được xoá. Lưu ý: đây là
// tính năng "gửi nhầm thì thu hồi", KHÔNG hỗ trợ sửa nội dung quà đã gửi -
// nếu muốn đổi sticker/lời chúc, người gửi phải xoá rồi gửi quà mới.
export async function deleteGift(requesterEmail) {
    const snap = await getDoc(giftDocRef());
    if (!snap.exists()) return;

    const data = snap.data();
    if (!requesterEmail || data.senderEmail !== requesterEmail) {
        throw new Error("Chỉ người đã gửi quà mới có thể xoá quà này.");
    }

    await deleteDoc(giftDocRef());
}

// Lấy món quà hiện tại 1 lần (không realtime)
export async function getCurrentGift() {
    const snap = await getDoc(giftDocRef());
    if (!snap.exists()) return null;
    return normalizeGift(snap.data());
}

// Lắng nghe realtime món quà hiện tại - trả về hàm huỷ đăng ký lắng nghe
export function subscribeCurrentGift(callback) {
    return onSnapshot(
        giftDocRef(),
        (snap) => callback(snap.exists() ? normalizeGift(snap.data()) : null),
        (err) => {
            console.error(err);
            callback(null);
        }
    );
}

// Quà còn "hiệu lực" hay không - tức đã gửi trong vòng 24h gần nhất
export function isGiftActive(gift) {
    if (!gift || !gift.sentAt) return false;
    return Date.now() - gift.sentAt.getTime() < GIFT_TTL_MS;
}

// Quà này có phải quà gửi CHO người đang xem hay không (người xem không
// phải là người đã gửi quà)
export function isGiftForViewer(gift, viewerEmail) {
    if (!gift || !viewerEmail) return false;
    return gift.senderEmail !== viewerEmail;
}

// Quà này có phải do CHÍNH người đang xem gửi đi hay không (dùng để hiển
// thị nút "Xoá quà đã gửi" cho đúng người gửi)
export function isGiftFromSender(gift, viewerEmail) {
    if (!gift || !viewerEmail) return false;
    return gift.senderEmail === viewerEmail;
}
