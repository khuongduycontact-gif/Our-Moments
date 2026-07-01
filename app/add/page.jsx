"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Toast from "@/components/Toast";
import DatePicker from "@/components/DatePicker";
import { useAuth } from "@/lib/AuthContext";
import { uploadFileToCloudinary } from "@/lib/uploadToCloudinary";
import { createMoment } from "@/lib/moments";

function AddContent() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  // Danh sách file đang chờ tải lên. Mỗi phần tử: { id, file, previewUrl, isVideo }
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => todayISO());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function handleDateChange(iso) {
    setDate(iso);
  }

  function addFiles(fileList) {
    const newItems = fileList.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
        .toString(36)
        .slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/"),
    }));
    setItems((prev) => [...prev, ...newItems]);
  }

  function handlePickFile(e) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    addFiles(selected);
    // reset để có thể chọn lại cùng 1 file nếu muốn
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    if (!dropped.length) return;
    addFiles(dropped);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  // Tự ẩn toast lỗi sau vài giây (toast thành công sẽ biến mất vì trang chuyển hướng)
  useEffect(() => {
    if (!toast || toast.type !== "error") return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Vui lòng chọn ít nhất 1 ảnh hoặc video để tải lên.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadIndex(0);

    const total = items.length;
    const finalDate = date || todayISO();

    try {
      const media = [];

      for (let i = 0; i < total; i++) {
        setUploadIndex(i + 1);
        const { file, isVideo } = items[i];

        const publicUrl = await uploadFileToCloudinary(file, (p) => {
          const overall = Math.round(((i + p / 100) / total) * 100);
          setProgress(overall);
        });

        media.push({ type: isVideo ? "video" : "image", url: publicUrl });
      }

      // Tất cả ảnh/video vừa chọn được lưu thành 1 album duy nhất
      await createMoment({
        title,
        description,
        date: finalDate,
        media,
        ownerUid: user.uid,
      });

      setToast({
        type: "success",
        message: `Đã lưu album với ${total} ảnh/video ♡`,
      });
      // Đợi một chút để người dùng kịp thấy thông báo rồi mới quay về trang chủ
      setTimeout(() => router.push("/"), 900);
    } catch (err) {
      console.error(err);
      const msg = "Có lỗi khi tải lên, vui lòng thử lại.";
      setError(msg);
      setToast({ type: "error", message: msg });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-50 px-4 py-10">
      <Toast toast={toast} />
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-700">
            Thêm album mới
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lưu giữ thêm khoảnh khắc đẹp của chúng ta nhé ♡ Có thể chọn nhiều
            ảnh và video cùng lúc, tất cả sẽ được lưu vào chung 1 album.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
        >
          {/* Upload */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">
              Tải lên nội dung
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-8 text-center"
            >
              <div className="mb-2 text-3xl text-brand-400">⬆</div>
              <p className="mb-1 text-sm text-slate-500">
                Kéo thả ảnh/video vào đây (có thể chọn nhiều cùng lúc)
              </p>
              <p className="mb-3 text-xs text-slate-400">hoặc</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handlePickFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                + Chọn ảnh/video từ thiết bị
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Hỗ trợ: JPG, PNG, HEIC, MP4 (tối đa 20MB mỗi file)
              </p>
            </div>

            {/* Danh sách preview các file đã chọn */}
            {items.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Đã chọn {items.length} mục
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-brand-100"
                    >
                      {it.isVideo ? (
                        <video
                          src={it.previewUrl}
                          className="h-full w-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={it.previewUrl}
                          alt="Xem trước"
                          className="h-full w-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        aria-label="Xoá file này"
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      >
                        ✕
                      </button>
                      {it.isVideo && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                          🎬
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Tiêu đề album (không bắt buộc)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề cho những khoảnh khắc này..."
              className="w-full rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Mô tả (không bắt buộc)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="Viết một chút gì đó về khoảnh khắc này..."
              className="w-full resize-none rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {description.length}/200
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Ngày chụp/quay
            </label>
            <DatePicker
              value={date}
              onChange={handleDateChange}
              max={todayISO()}
            />
            <p className="mt-1 text-xs text-slate-400">
              Mặc định là ngày hôm nay. Không thể chọn ngày trong tương lai.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {uploading && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                <div
                  className="h-full bg-brand-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-slate-400">
                Đang tải mục {uploadIndex}/{items.length}... {progress}%
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-600 disabled:opacity-60"
          >
            {uploading
              ? `Đang tải lên... ${progress}%`
              : `♡ Lưu album ${items.length > 0 ? `(${items.length} mục)` : ""}`}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            Huỷ bỏ
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AddPage() {
  return (
    <ProtectedRoute>
      <AddContent />
    </ProtectedRoute>
  );
}
