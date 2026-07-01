"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

// Lưu các cấu hình chung của trang (không thuộc về 1 album cụ thể)
// trong collection "settings", chỉ có đúng 1 document tên "site".
const COLLECTION = "settings";
const SITE_DOC_ID = "site";

// Lấy toàn bộ cấu hình trang (ví dụ: heroImageUrl)
export async function getSiteSettings() {
  const ref = doc(db, COLLECTION, SITE_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  return snap.data();
}

// Cập nhật ảnh đại diện (hero) hiển thị ở trang chủ
export async function updateHeroImage(url) {
  const ref = doc(db, COLLECTION, SITE_DOC_ID);
  await setDoc(ref, { heroImageUrl: url }, { merge: true });
}
