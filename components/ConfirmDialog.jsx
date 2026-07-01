"use client";

import { useEffect } from "react";

// Modal xác nhận đẹp, thay cho window.confirm() mặc định của trình duyệt.
// Dùng:
// <ConfirmDialog
//   open={showConfirm}
//   title="Xoá album?"
//   message="Bạn có chắc muốn xoá cả album này không? Hành động này không thể hoàn tác."
//   confirmLabel="Xoá album"
//   onConfirm={...}
//   onCancel={...}
// />
export default function ConfirmDialog({
  open,
  title = "Xác nhận",
  message = "",
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  // Cho phép nhấn Esc để đóng modal
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape" && !loading) onCancel?.();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-fade-in"
      onClick={() => !loading && onCancel?.()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl animate-pop-in"
      >
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
            danger ? "bg-red-50 text-red-500" : "bg-brand-100 text-brand-600"
          }`}
        >
          {danger ? "🗑" : "❓"}
        </div>

        <h3 className="font-display mb-1.5 text-lg font-semibold text-slate-800">
          {title}
        </h3>
        <p className="mb-6 text-sm leading-relaxed text-slate-500">
          {message}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white shadow transition disabled:opacity-60 ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-brand-500 hover:bg-brand-600"
            }`}
          >
            {loading ? "Đang xoá..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
