"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import MomentCard from "@/components/MomentCard";
import { getAllMoments } from "@/lib/moments";

const PAGE_SIZE = 8;

function AllAlbumsContent() {
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getAllMoments()
      .then(setMoments)
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="min-h-screen bg-brand-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm"
          >
            ←
          </Link>
          <h1 className="font-display text-lg font-semibold text-brand-700">
            Tất cả album 💜
          </h1>
          <Link
            href="/add"
            className="flex h-9 items-center justify-center rounded-full bg-brand-500 px-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            +
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-sm text-slate-400">Đang tải album...</p>
        ) : moments.length === 0 ? (
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
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium shadow-sm transition ${
                      p === safePage
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
    </div>
  );
}

export default function AllAlbumsPage() {
  return (
    <ProtectedRoute>
      <AllAlbumsContent />
    </ProtectedRoute>
  );
}
