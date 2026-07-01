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
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "moments";

// Chuẩn hoá dữ liệu 1 album: đảm bảo luôn có mảng `media`.
// Hỗ trợ cả dữ liệu cũ (được tạo trước khi có tính năng album nhiều ảnh/video),
// khi đó mỗi khoảnh khắc chỉ có 1 mục dạng { type, url }.
function normalizeMoment(data) {
  if (!data) return data;
  if (Array.isArray(data.media) && data.media.length > 0) {
    return data;
  }
  if (data.type && data.url) {
    return { ...data, media: [{ type: data.type, url: data.url }] };
  }
  return { ...data, media: data.media || [] };
}

// Tạo mới một album (gồm 1 hoặc nhiều ảnh/video) trong Firestore
export async function createMoment({ title, description, date, ownerUid, media }) {
  const ref = await addDoc(collection(db, COLLECTION), {
    title: title || "",
    description: description || "",
    date, // chuỗi dạng yyyy-MM-dd do người dùng nhập
    media, // [{ type: "image" | "video", url }, ...]
    ownerUid,
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
export async function updateMoment(id, data) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, data);
}

// Xoá cả album
export async function deleteMoment(id) {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}
