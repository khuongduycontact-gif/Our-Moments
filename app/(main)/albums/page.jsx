"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MomentCard from "@/components/MomentCard";
import FullPageLoader from "@/components/FullPageLoader";
import { getAllMoments } from "@/lib/moments";

const PAGE_SIZE = 8;

// Quy đổi giá trị thời gian của 1 moment về số mili-giây để so sánh.
// Field chính thức lưu ngày là "date" (chuỗi ISO "YYYY-MM-DD", xem trang Thêm album).
// Vẫn hỗ trợ thêm vài định dạng khác (Firestore Timestamp, Date, số mili-giây)
// để phòng trường hợp dữ liệu cũ có field khác.
function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// Lấy mốc thời gian của 1 moment, ưu tiên date (field chính thức) -> createdAt -> timestamp -> updatedAt
function getMomentTime(m) {
  return toMillis(m.date ?? m.createdAt ?? m.timestamp ?? m.updatedAt);
}

// Sắp xếp album theo thời gian. order: "newest" (mới nhất trước) hoặc "oldest" (cũ nhất trước)
function sortMoments(items, order) {
  const sign = order === "oldest" ? 1 : -1;
  return [...items].sort((a, b) => sign * (getMomentTime(a) - getMomentTime(b)));
}

export default function AllAlbumsPage() {
  const [rawMoments, setRawMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"

  useEffect(() => {
    getAllMoments()
      .then(setRawMoments)
      .finally(() => setLoading(false));
  }, []);

  const moments = sortMoments(rawMoments, sortOrder);

  function handleSortChange(order) {
    if (order === sortOrder) return;
    setSortOrder(order);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(moments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageMoments = moments.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function goToPage(p) {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="font-display truncate text-2xl font-bold text-brand-700">
            Tất cả album
          </h1>
        </div>
        <Link
          href="/add"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          aria-label="Thêm album mới"
        >
          +
        </Link>
      </div>

      {moments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-10 text-center">
          <p className="text-slate-500">
            Chưa có album nào. Hãy thêm album đầu tiên của hai bạn nhé ♡
          </p>
          <Link
            href="/add"
            className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
          >
            + Thêm nội dung mới
          </Link>
        </div>
      ) : (
        <>
          {/* Bộ lọc sắp xếp theo thời gian */}
          <div className="mb-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleSortChange("newest")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium shadow-sm transition ${sortOrder === "newest"
                ? "bg-brand-500 text-white"
                : "bg-white text-brand-600 hover:bg-brand-50"
                }`}
            >
              Mới nhất
            </button>
            <button
              type="button"
              onClick={() => handleSortChange("oldest")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium shadow-sm transition ${sortOrder === "oldest"
                ? "bg-brand-500 text-white"
                : "bg-white text-brand-600 hover:bg-brand-50"
                }`}
            >
              Cũ nhất
            </button>
          </div>

          <p className="mb-3 text-center text-xs text-slate-400">
            Trang {safePage}/{totalPages} · {moments.length} album
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {pageMoments.map((m) => (
              <MomentCard key={m.id} moment={m} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm disabled:opacity-40"
                aria-label="Trang trước"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium shadow-sm transition ${p === safePage
                    ? "bg-brand-500 text-white"
                    : "bg-white text-brand-600 hover:bg-brand-50"
                    }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm disabled:opacity-40"
                aria-label="Trang sau"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}