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
  limit as fsLimit,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "moments";

// Chuẩn hoá dữ liệu 1 album: đảm bảo luôn có mảng `media`.
// Hỗ trợ cả dữ liệu cũ (được tạo trước khi có tính năng album nhiều ảnh/video),
// khi đó mỗi khoảnh khắc chỉ có 1 mục dạng { type, url }.
function normalizeMoment(data) {
  if (!data) return data;
  let normalized = data;
  if (Array.isArray(data.media) && data.media.length > 0) {
    normalized = data;
  } else if (data.type && data.url) {
    normalized = { ...data, media: [{ type: data.type, url: data.url }] };
  } else {
    normalized = { ...data, media: data.media || [] };
  }
  // Đảm bảo luôn có các field liên quan tới tác giả/người xem, kể cả với
  // dữ liệu cũ được tạo trước khi có tính năng này.
  return {
    ...normalized,
    time: normalized.time || "", // Dữ liệu cũ (trước khi có giờ:phút) sẽ không có field này
    author: normalized.author || null,
    editors: Array.isArray(normalized.editors) ? normalized.editors : [],
    viewedBy: Array.isArray(normalized.viewedBy) ? normalized.viewedBy : [],
  };
}

// Tạo mới một album (gồm 1 hoặc nhiều ảnh/video) trong Firestore
export async function createMoment({
  title,
  description,
  date,
  time,
  memorialDate,
  ownerUid,
  media,
  author,
}) {
  const ref = await addDoc(collection(db, COLLECTION), {
    title: title || "",
    description: description || "",
    date, // Ngày đăng tải, chuỗi dạng yyyy-MM-dd - tự động lấy theo thời điểm đăng
    time: time || "", // Giờ:phút đăng tải, chuỗi dạng HH:mm - tự động lấy theo thời điểm đăng
    memorialDate: memorialDate || "", // Ngày kỷ niệm, chuỗi dạng yyyy-MM-dd
    media, // [{ type: "image" | "video", url }, ...]
    ownerUid,
    // Thông tin người đăng (email, tên, ảnh đại diện) - hiển thị ở trang chủ
    author: author
      ? {
        uid: author.uid || "",
        email: author.email || "",
        name: author.name || "",
        photoURL: author.photoURL || "",
      }
      : null,
    editors: [], // Danh sách người khác (email khác người đăng) từng chỉnh sửa album
    viewedBy: [], // Danh sách email người khác (không phải người đăng) đã xem album
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Lấy danh sách album mới nhất (mặc định 4 cái cho trang chủ)
export async function getLatestMoments(count = 4) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"), fsLimit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeMoment({ id: d.id, ...d.data() }));
}

// Lấy toàn bộ album, mới nhất trước
export async function getAllMoments() {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeMoment({ id: d.id, ...d.data() }));
}

// Lấy chi tiết 1 album theo id
export async function getMomentById(id) {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return normalizeMoment({ id: snap.id, ...snap.data() });
}

// Cập nhật album (tiêu đề, mô tả, ngày, danh sách media...)
// `editor`: thông tin người đang chỉnh sửa (email, tên, ảnh đại diện). Chỉ
// truyền vào khi email của người chỉnh sửa KHÁC email người đăng ban đầu -
// khi đó album sẽ được coi là "đồng tác giả" và hiển thị "Nhóm tác giả".
export async function updateMoment(id, data, editor) {
  const ref = doc(db, COLLECTION, id);
  const payload = { ...data };
  if (editor && editor.email) {
    payload.editors = arrayUnion({
      uid: editor.uid || "",
      email: editor.email,
      name: editor.name || "",
      photoURL: editor.photoURL || "",
    });
  }
  await updateDoc(ref, payload);
}

// Đánh dấu 1 album là đã được xem bởi 1 email (chỉ nên gọi khi email này
// khác với email của người đã đăng album).
export async function markMomentViewed(id, email) {
  if (!email) return;
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { viewedBy: arrayUnion(email) });
}

// Xoá cả album
export async function deleteMoment(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}