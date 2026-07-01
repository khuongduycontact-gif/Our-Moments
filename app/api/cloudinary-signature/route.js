import { NextResponse } from "next/server";
import crypto from "crypto";

// Tạo chữ ký (signature) để trình duyệt có thể upload thẳng lên Cloudinary
// mà không cần lộ API secret ra client.
export async function POST(req) {
  try {
    const { folder } = await req.json().catch(() => ({}));

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      timestamp,
      folder: folder || "our-moments",
    };

    // Cloudinary yêu cầu ký các tham số theo thứ tự alphabet: key=value&key=value...
    const sortedKeys = Object.keys(paramsToSign).sort();
    const stringToSign = sortedKeys
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(stringToSign + process.env.CLOUDINARY_API_SECRET)
      .digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      folder: paramsToSign.folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error("Lỗi tạo chữ ký Cloudinary:", err);
    return NextResponse.json(
      { error: "Không thể tạo chữ ký tải lên" },
      { status: 500 }
    );
  }
}
