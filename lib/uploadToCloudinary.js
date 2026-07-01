"use client";

// Xin chữ ký từ server (API route) rồi upload trực tiếp file lên Cloudinary.
// Trả về: { url, resourceType } - resourceType là "image" hoặc "video"
export async function uploadFileToCloudinary(file, onProgress) {
  const sigRes = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "our-moments" }),
  });

  if (!sigRes.ok) {
    throw new Error("Không lấy được chữ ký tải lên từ máy chủ");
  }

  const { signature, timestamp, folder, apiKey, cloudName } =
    await sigRes.json();

  if (!cloudName || !apiKey) {
    throw new Error(
      "Thiếu cấu hình Cloudinary (cloud name / api key) trong .env.local"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder", folder);

  // Cloudinary tự nhận diện loại file khi dùng endpoint "auto"
  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const publicUrl = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadEndpoint);
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch (err) {
          reject(new Error("Không đọc được phản hồi từ Cloudinary"));
        }
      } else {
        reject(new Error("Tải lên Cloudinary thất bại"));
      }
    };
    xhr.onerror = () => reject(new Error("Tải lên Cloudinary thất bại"));
    xhr.send(formData);
  });

  return publicUrl;
}
