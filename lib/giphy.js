"use client";

// Gọi API route nội bộ /api/giphy-stickers (không gọi thẳng GIPHY từ client
// để không lộ API key). query rỗng -> lấy sticker nổi bật (trending).
export async function fetchStickers(query = "") {
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    const res = await fetch(`/api/giphy-stickers${params}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data?.error || "Không thể tải sticker");
    }
    return data.stickers || [];
}
