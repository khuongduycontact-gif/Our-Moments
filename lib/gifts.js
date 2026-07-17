"use client";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Lưu TOÀN BỘ lịch sử quà tặng giữa 2 người (không còn ghi đè lên nhau như
// trước) - mỗi món quà là 1 document riêng trong collection này, giống như
// một cuốn sổ lưu lại hết những lời chúc đã từng gửi/nhận.
const COLLECTION = "gifts";

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

// Quà chỉ được lưu đến hết 23:59:59 CÙNG NGÀY (giờ máy người dùng), sau đó
// coi như hết hạn và sẽ bị xoá hẳn khỏi Firestore.
function giftDocRef(id) {
    return doc(db, COLLECTION, id);
}

// Trả về "yyyy-mm-dd" theo giờ ĐỊA PHƯƠNG (không dùng toISOString vì nó quy
// về UTC, dễ lệch ngày với giờ Việt Nam).
export function getLocalDateKey(date = new Date()) {
    return date.toLocaleDateString("en-CA");
}

// Quà này có phải được gửi trong ngày hôm nay hay không. Quà vừa gửi mà
// serverTimestamp() chưa kịp đồng bộ về (sentAt tạm thời là null) vẫn được
// coi là "hôm nay" để không bị ẩn nhầm ngay sau khi gửi.
export function isGiftFromToday(gift, todayKey) {
    if (!gift) return false;
    if (!gift.sentAt) return true;
    return getLocalDateKey(gift.sentAt) === (todayKey || getLocalDateKey());
}

// Sticker giờ có thể là 1 emoji (vd "🎁") hoặc 1 URL ảnh sticker GIF lấy từ
// GIPHY (vd "https://media.giphy.com/..."). Hàm này giúp UI biết nên hiển
// thị bằng <img> hay hiển thị text emoji bình thường.
export function isStickerImage(sticker) {
    return typeof sticker === "string" && sticker.startsWith("http");
}

// Chuẩn hoá dữ liệu quà đọc từ Firestore (convert Timestamp -> Date)
function normalizeGift(id, data) {
    if (!data) return null;
    return {
        id,
        sticker: data.sticker || "🎁",
        message: data.message || "",
        senderEmail: data.senderEmail || "",
        senderName: data.senderName || "",
        opened: !!data.opened,
        sentAt: data.sentAt && data.sentAt.toDate ? data.sentAt.toDate() : null,
    };
}

// Gửi 1 món quà mới (sticker + lời chúc) cho đối phương - lưu thành 1 bản
// ghi mới trong lịch sử, không đụng tới các quà đã gửi/nhận trước đó.
export async function sendGift({ sticker, message, sender }) {
    const ref = await addDoc(collection(db, COLLECTION), {
        sticker: sticker || "🎁",
        message: (message || "").trim(),
        senderEmail: sender?.email || "",
        senderName: sender?.name || "",
        opened: false, // Đối phương chưa mở quà này
        sentAt: serverTimestamp(),
    });
    return ref.id;
}

// Xoá 1 món quà theo id - CHỈ người đã gửi quà đó mới được xoá.
export async function deleteGift(giftId, requesterEmail) {
    const snap = await getDoc(giftDocRef(giftId));
    if (!snap.exists()) return;

    const data = snap.data();
    if (!requesterEmail || data.senderEmail !== requesterEmail) {
        throw new Error("Chỉ người đã gửi quà mới có thể xoá quà này.");
    }

    await deleteDoc(giftDocRef(giftId));
}

// Đánh dấu 1 món quà là đã được mở (dùng khi người nhận bấm "Mở quà")
export async function markGiftOpened(giftId) {
    if (!giftId) return;
    try {
        await updateDoc(giftDocRef(giftId), { opened: true });
    } catch (err) {
        console.error(err);
    }
}

// Lấy toàn bộ lịch sử quà 1 lần (không realtime), mới nhất trước
export async function getAllGifts() {
    const q = query(collection(db, COLLECTION), orderBy("sentAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => normalizeGift(d.id, d.data()));
}

// Lắng nghe realtime toàn bộ lịch sử quà (mới nhất trước) - trả về hàm huỷ
// đăng ký lắng nghe
export function subscribeAllGifts(callback) {
    const q = query(collection(db, COLLECTION), orderBy("sentAt", "desc"));
    return onSnapshot(
        q,
        (snap) => callback(snap.docs.map((d) => normalizeGift(d.id, d.data()))),
        (err) => {
            console.error(err);
            callback([]);
        }
    );
}

// Xoá HẲN khỏi Firestore những món quà không còn thuộc ngày hôm nay (giờ
// địa phương). Gọi hàm này mỗi khi trang gift được mở, và mỗi khi đồng hồ
// vừa sang ngày mới trong lúc trang vẫn đang mở, để dọn sạch quà cũ đúng
// tinh thần "chỉ lưu trong ngày, qua 00:00:00 là tự xoá".
export async function cleanupExpiredGifts() {
    const snap = await getDocs(collection(db, COLLECTION));
    const todayKey = getLocalDateKey();

    const expiredIds = snap.docs
        .filter((d) => {
            const data = d.data();
            const sentAt = data.sentAt && data.sentAt.toDate ? data.sentAt.toDate() : null;
            if (!sentAt) return false; // Quà vừa tạo, serverTimestamp chưa đồng bộ -> chưa xoá
            return getLocalDateKey(sentAt) !== todayKey;
        })
        .map((d) => d.id);

    if (!expiredIds.length) return;
    await Promise.all(expiredIds.map((id) => deleteDoc(giftDocRef(id))));
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
