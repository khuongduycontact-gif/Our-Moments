import { NextResponse } from "next/server";

// Proxy gọi GIPHY Stickers API - giữ API key ở server, không lộ ra client.
// - Không có q (query rỗng) -> lấy sticker "trending" (nổi bật) để hiện mặc định.
// - Có q -> tìm sticker theo từ khoá (vd: "tình yêu", "hoa hồng", "chúc mừng"...).
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const LIMIT = 24;

export async function GET(req) {
    if (!GIPHY_API_KEY) {
        return NextResponse.json(
            { error: "Chưa cấu hình GIPHY_API_KEY trong .env.local" },
            { status: 500 }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();

        const endpoint = q
            ? `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
                q
            )}&limit=${LIMIT}&rating=g&lang=vi`
            : `https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_API_KEY}&limit=${LIMIT}&rating=g`;

        const res = await fetch(endpoint);
        if (!res.ok) {
            throw new Error(`GIPHY trả về lỗi ${res.status}`);
        }
        const data = await res.json();

        // Chỉ trả về đúng những field cần dùng ở client - gọn nhẹ, không lộ
        // thêm thông tin thừa từ GIPHY.
        const stickers = (data.data || []).map((item) => ({
            id: item.id,
            // Bản xem trước nhỏ, hiển thị trong lưới chọn sticker
            previewUrl: item.images?.fixed_width_small?.url || item.images?.fixed_width?.url,
            // Bản để lưu lại và hiển thị trong hộp quà (chất lượng vừa phải, đủ nét)
            url: item.images?.fixed_width?.url || item.images?.original?.url,
        }));

        return NextResponse.json({ stickers });
    } catch (err) {
        console.error("Lỗi lấy sticker từ GIPHY:", err);
        return NextResponse.json(
            { error: "Không thể tải sticker từ GIPHY, vui lòng thử lại." },
            { status: 500 }
        );
    }
}
