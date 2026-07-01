"use client";

// Thông báo nổi (toast) hiển thị thành công / thất bại.
// Dùng: const [toast, setToast] = useState(null);
// setToast({ type: "success" | "error", message: "..." })
export default function Toast({ toast }) {
  if (!toast) return null;

  const isSuccess = toast.type === "success";

  return (
    <div className="pointer-events-none fixed left-1/2 top-5 z-50 w-full max-w-sm -translate-x-1/2 px-4">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-toast-in ${
          isSuccess ? "bg-green-600" : "bg-red-600"
        }`}
      >
        <span>{isSuccess ? "✓" : "✕"}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
