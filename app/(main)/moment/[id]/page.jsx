"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import DatePicker from "@/components/DatePicker";
import HeartIcon from "@/components/HeartIcon";
import FullPageLoader from "@/components/FullPageLoader";
import { useAuth } from "@/lib/AuthContext";
import { getAuthorDisplay, getPersonLabel } from "@/lib/authorDisplay";
import {
  getMomentById,
  updateMoment,
  deleteMoment,
  markMomentViewed,
} from "@/lib/moments";
import { uploadFileToCloudinary } from "@/lib/uploadToCloudinary";

function getToday() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}

function formatDateVN(dateString) {
  if (!dateString) return "Chưa có ngày";
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MomentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [moment, setMoment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Thông tin chung của album
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [memorialDate, setMemorialDate] = useState("");

  // Media đang chỉnh sửa: các mục cũ còn giữ lại + các file mới thêm vào
  const [existingMedia, setExistingMedia] = useState([]); // [{ type, url }]
  const [newItems, setNewItems] = useState([]); // [{ id, file, previewUrl, isVideo }]

  // Xem ảnh/video theo dạng carousel khi không ở chế độ chỉnh sửa
  const [viewIndex, setViewIndex] = useState(0);
  // Theo dõi ảnh/video hiện tại đã tải xong chưa, để hiện khung loading đẹp
  const [mediaReady, setMediaReady] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Theo dõi các thumbnail đã tải xong (để hiện hiệu ứng mờ dần khi load)
  const [loadedThumbs, setLoadedThumbs] = useState(() => new Set());

  function markThumbLoaded(key) {
    setLoadedThumbs((prev) => new Set(prev).add(key));
  }

  const today = getToday();

  useEffect(() => {
    getMomentById(id).then((m) => {
      setMoment(m);
      if (m) {
        setTitle(m.title || "");
        setDescription(m.description || "");
        setDate(m.date || "");
        setMemorialDate(m.memorialDate || "");
        setExistingMedia(m.media || []);

        // Nếu người đang xem có email KHÁC email người đã đăng album, thì
        // đánh dấu album này là "đã xem" để người đăng biết đối phương đã xem.
        const viewerEmail = user?.email;
        const authorEmail = m.author?.email;
        const alreadyViewed = Array.isArray(m.viewedBy) && m.viewedBy.includes(viewerEmail);
        if (viewerEmail && authorEmail && viewerEmail !== authorEmail && !alreadyViewed) {
          markMomentViewed(id, viewerEmail).catch((err) => console.error(err));
          setMoment((prev) =>
            prev ? { ...prev, viewedBy: [...(prev.viewedBy || []), viewerEmail] } : prev
          );
        }
      }
      setLoading(false);
    });
  }, [id, user?.email]);

  // Tự ẩn toast lỗi sau vài giây (toast thành công sẽ biến mất vì trang chuyển hướng)
  useEffect(() => {
    if (!toast || toast.type !== "error") return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Số lượng ảnh/video của album (hiển thị trong nhãn tiêu đề trên trang)
  const viewMediaCount = moment?.media?.length || 0;

  // Mỗi khi chuyển sang ảnh/video khác thì hiện lại khung loading
  useEffect(() => {
    setMediaReady(false);
  }, [viewIndex, moment?.id]);

  const totalMediaCount = existingMedia.length + newItems.length;

  // Không giới hạn dung lượng file - nhận mọi file ảnh/video được chọn
  function addFiles(fileList) {
    const items = fileList.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
        .toString(36)
        .slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/"),
    }));
    setNewItems((prev) => [...prev, ...items]);
  }

  function handlePickFile(e) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    addFiles(selected);
    e.target.value = "";
  }

  function removeExistingMedia(index) {
    if (existingMedia.length + newItems.length <= 1) {
      setToast({
        type: "error",
        message: "Album phải có ít nhất 1 ảnh hoặc video.",
      });
      return;
    }
    setExistingMedia((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewItem(itemId) {
    setNewItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  function startEditing() {
    setExistingMedia(moment.media || []);
    setNewItems([]);
    setTitle(moment.title || "");
    setDescription(moment.description || "");
    setDate(moment.date || "");
    setMemorialDate(moment.memorialDate || "");
    setEditing(true);
  }

  function cancelEditing() {
    setExistingMedia(moment.media || []);
    setNewItems([]);
    setDate(moment.date || "");
    setMemorialDate(moment.memorialDate || "");
    setEditing(false);
  }

  async function handleSave() {
    if (!date) {
      setToast({ type: "error", message: "Vui lòng chọn ngày đăng tải." });
      return;
    }
    if (date > today) {
      setToast({
        type: "error",
        message: "Ngày đăng tải không được lớn hơn ngày hiện tại.",
      });
      return;
    }
    if (memorialDate && memorialDate > today) {
      setToast({
        type: "error",
        message: "Ngày kỷ niệm không được lớn hơn ngày hiện tại.",
      });
      return;
    }
    if (existingMedia.length + newItems.length === 0) {
      setToast({
        type: "error",
        message: "Album phải có ít nhất 1 ảnh hoặc video.",
      });
      return;
    }

    setSaving(true);

    try {
      let uploadedMedia = [];

      if (newItems.length > 0) {
        setUploading(true);
        setProgress(0);
        const total = newItems.length;

        for (let i = 0; i < total; i++) {
          const { file, isVideo } = newItems[i];
          const publicUrl = await uploadFileToCloudinary(file, (p) => {
            const overall = Math.round(((i + p / 100) / total) * 100);
            setProgress(overall);
          });
          uploadedMedia.push({ type: isVideo ? "video" : "image", url: publicUrl });
        }
        setUploading(false);
      }

      const finalMedia = [...existingMedia, ...uploadedMedia];

      // Nếu người đang chỉnh sửa có email KHÁC email người đã đăng album ban
      // đầu, ghi nhận họ là đồng tác giả -> album sẽ hiển thị "Nhóm tác giả".
      const authorEmail = moment?.author?.email;
      const editorInfo =
        user?.email && authorEmail && user.email !== authorEmail
          ? {
            uid: user.uid,
            email: user.email,
            name: user.displayName || "",
            photoURL: user.photoURL || "",
          }
          : null;

      await updateMoment(
        id,
        {
          title,
          description,
          date,
          memorialDate,
          media: finalMedia,
        },
        editorInfo
      );

      setMoment((prev) => ({
        ...prev,
        title,
        description,
        date,
        memorialDate,
        media: finalMedia,
        editors:
          editorInfo && Array.isArray(prev?.editors)
            ? [...prev.editors.filter((e) => e.email !== editorInfo.email), editorInfo]
            : prev?.editors || [],
      }));
      setExistingMedia(finalMedia);
      setNewItems([]);
      setViewIndex(0);

      setEditing(false);
      setToast({ type: "success", message: "Đã lưu thay đổi thành công ♡" });
      setTimeout(() => router.push("/"), 900);
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        message: "Có lỗi khi lưu thay đổi, vui lòng thử lại.",
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteMoment(id);
      router.push("/");
    } catch (err) {
      console.error(err);
      setDeleting(false);
      setShowDeleteConfirm(false);
      setToast({
        type: "error",
        message: "Có lỗi khi xoá album, vui lòng thử lại.",
      });
    }
  }

  if (loading) {
    return <FullPageLoader />;
  }

  if (!moment) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-slate-500">Không tìm thấy album này.</p>
        <button
          onClick={() => router.push("/")}
          className="text-sm font-semibold text-brand-600 hover:underline"
        >
          ← Về trang chủ
        </button>
      </div>
    );
  }

  const viewMedia = moment.media && moment.media.length > 0 ? moment.media : [];
  const currentView = viewMedia[viewIndex] || viewMedia[0];
  const { author, editors, isGroup } = getAuthorDisplay(moment);
  const hasBeenSeen = Array.isArray(moment.viewedBy) && moment.viewedBy.length > 0;

  return (
    <>
      <Toast toast={toast} />
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        {!editing ? (
          <>
            <div className="mb-3 flex items-center justify-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">
                Chi tiết album{viewMediaCount > 1 ? ` · ${viewMediaCount} mục` : ""}
              </p>
            </div>

            {/* Media viewer (carousel nếu có nhiều mục) - luôn cùng 1 kích thước khung */}
            <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-2xl bg-black shadow-sm">
              {/* Khung loading đẹp, hiện khi ảnh/video chưa tải xong */}
              {!mediaReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-100 to-brand-50">
                  <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-500" />
                  <p className="text-xs font-medium text-brand-400">
                    Đang tải {currentView?.type === "video" ? "video" : "ảnh"}...
                  </p>
                </div>
              )}

              {currentView?.type === "video" ? (
                <video
                  key={currentView.url}
                  src={currentView.url}
                  className={`h-full w-full object-contain transition-opacity duration-300 ${mediaReady ? "opacity-100" : "opacity-0"
                    }`}
                  controls
                  onLoadedData={() => setMediaReady(true)}
                />
              ) : (
                <img
                  key={currentView?.url}
                  src={currentView?.url}
                  alt={moment.title}
                  className={`h-full w-full object-contain transition-opacity duration-300 ${mediaReady ? "opacity-100" : "opacity-0"
                    }`}
                  onLoad={() => setMediaReady(true)}
                />
              )}
            </div>

            {viewMedia.length > 1 && (
              <div className="mb-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setViewIndex((i) => (i - 1 + viewMedia.length) % viewMedia.length)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm"
                  aria-label="Ảnh/video trước"
                >
                  ‹
                </button>
                <div className="flex gap-1.5">
                  {viewMedia.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setViewIndex(i)}
                      aria-label={`Xem mục ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${i === viewIndex ? "w-6 bg-brand-500" : "w-2 bg-brand-200"
                        }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setViewIndex((i) => (i + 1) % viewMedia.length)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm"
                  aria-label="Ảnh/video tiếp theo"
                >
                  ›
                </button>
              </div>
            )}

            {/* Info */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-display flex items-center gap-1.5 text-lg font-semibold text-brand-700">
                  {moment.title || "Chưa có tiêu đề"}
                </h2>
                {hasBeenSeen && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">
                    ✓ Đã xem
                  </span>
                )}
              </div>

              {author && (
                <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
                  {isGroup ? (
                    <>
                      <span className="flex -space-x-1.5">
                        {[author, editors[0]].map((person, i) => (
                          <span
                            key={i}
                            className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-200 text-[10px] font-semibold text-brand-700 ring-2 ring-white"
                          >
                            {person?.photoURL ? (
                              <img
                                src={person.photoURL}
                                alt={getPersonLabel(person)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getPersonLabel(person).trim().charAt(0).toUpperCase()
                            )}
                          </span>
                        ))}
                      </span>
                      <span className="text-xs font-medium">Cậu và Người yêu đã cùng nhau chia sẻ câu chuyện này</span>
                    </>
                  ) : (
                    <>
                      {author.photoURL ? (
                        <img
                          src={author.photoURL}
                          alt={getPersonLabel(author)}
                          className="h-6 w-6 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-200 text-[10px] font-semibold text-brand-700">
                          {getPersonLabel(author).trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs">
                        Đăng bởi <span className="font-medium">{getPersonLabel(author)}</span>
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="mb-2 flex items-start gap-2 text-sm text-slate-600">
                <span>📅</span>
                <div>
                  <p className="text-xs text-slate-400">Ngày đăng tải</p>
                  <p>{formatDateVN(moment.date)}</p>
                </div>
              </div>
              {moment.memorialDate && (
                <div className="mb-2 flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-brand-500">
                    <HeartIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Ngày kỷ niệm</p>
                    <p>{formatDateVN(moment.memorialDate)}</p>
                  </div>
                </div>
              )}
              <div className="mb-4 flex items-start gap-2 text-sm text-slate-600">
                <span>📝</span>
                <div>
                  <p className="text-xs text-slate-400">Ghi chú</p>
                  <p>{moment.description || "Chưa có ghi chú nào."}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Xoá album
                </button>
                <button
                  onClick={startEditing}
                  className="flex-1 rounded-xl bg-brand-100 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-200"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            {/* Quản lý ảnh/video trong album */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Ảnh/video trong album ({totalMediaCount})
              </label>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {existingMedia.map((mediaItem, index) => {
                  const thumbKey = `existing-${index}-${mediaItem.url}`;
                  const isLoaded = loadedThumbs.has(thumbKey);
                  return (
                    <div
                      key={thumbKey}
                      className="group relative aspect-square overflow-hidden rounded-lg bg-brand-100"
                    >
                      {!isLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-brand-100" />
                      )}
                      {mediaItem.type === "video" ? (
                        <video
                          src={mediaItem.url}
                          className={`h-full w-full object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"
                            }`}
                          muted
                          onLoadedData={() => markThumbLoaded(thumbKey)}
                        />
                      ) : (
                        <img
                          src={mediaItem.url}
                          alt="Ảnh trong album"
                          className={`h-full w-full object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"
                            }`}
                          onLoad={() => markThumbLoaded(thumbKey)}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(index)}
                        aria-label="Xoá mục này"
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                      >
                        ✕
                      </button>
                      {mediaItem.type === "video" && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                          🎬
                        </span>
                      )}
                    </div>
                  );
                })}

                {newItems.map((it) => (
                  <div
                    key={it.id}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-brand-100 ring-2 ring-brand-300"
                  >
                    {it.isVideo ? (
                      <video src={it.previewUrl} className="h-full w-full object-cover" muted />
                    ) : (
                      <img
                        src={it.previewUrl}
                        alt="Xem trước"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeNewItem(it.id)}
                      aria-label="Xoá file này"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] text-white">
                      Mới{it.isVideo ? " 🎬" : ""}
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-brand-300 bg-brand-50/50 text-brand-500 hover:bg-brand-100"
                >
                  <span className="text-2xl">+</span>
                  <span className="text-[11px]">Thêm ảnh/video</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handlePickFile}
                className="hidden"
              />
              <p className="mt-2 text-xs text-slate-400">
                Album phải còn lại ít nhất 1 ảnh hoặc video.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Tiêu đề
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Ghi chú
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full resize-none rounded-xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Ngày đăng tải
                </label>
                <DatePicker value={date} onChange={setDate} max={today} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">
                  Ngày kỷ niệm
                </label>
                <DatePicker
                  value={memorialDate}
                  onChange={setMemorialDate}
                  max={today}
                  placeholder="dd/mm/yyyy"
                />
              </div>
            </div>

            {uploading && (
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                  <div
                    className="h-full bg-brand-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-slate-400">
                  Đang tải ảnh/video mới lên... {progress}%
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                Huỷ
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Xoá album này?"
        message="Toàn bộ ảnh/video, tiêu đề và ghi chú trong album sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác."
        confirmLabel="Xoá album"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
