"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MomentCard from "@/components/MomentCard";
import FullPageLoader from "@/components/FullPageLoader";
import PageDecor from "@/components/PageDecor";
import { ImageStackIcon, VideoIcon, HeartOutlineIcon } from "@/components/Icons";
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

// 3 bộ lọc theo loại nội dung + 1 bộ lọc "Yêu thích", hiển thị ở sidebar bên
// trái (giao diện mới). "Ảnh"/"Video" lọc theo loại của ảnh/video đại diện
// (mục đầu tiên) của từng album; số đếm cạnh mỗi mục là tổng số ảnh/video
// thực tế trong toàn bộ album (không phải số album).
const FILTERS = [
  { key: "all", label: "Tất cả album" },
  { key: "photo", label: "Ảnh" },
  { key: "video", label: "Video" },
  { key: "favorite", label: "Yêu thích" },
];

function SidebarButton({ icon, label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition ${active
        ? "bg-brand-500 font-semibold text-white shadow-sm"
        : "text-slate-500 hover:bg-brand-50"
        }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {typeof count === "number" && (
        <span className={active ? "text-white/80" : "text-slate-400"}>{count}</span>
      )}
    </button>
  );
}

function AllAlbumsPageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [rawMoments, setRawMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"
  const [filterKey, setFilterKey] = useState("all");
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    getAllMoments()
      .then(setRawMoments)
      .finally(() => setLoading(false));
  }, []);

  // Tổng số ảnh/video (không phải số album) để hiện cạnh "Ảnh"/"Video" trong sidebar
  const mediaCounts = useMemo(() => {
    let photo = 0;
    let video = 0;
    for (const m of rawMoments) {
      for (const item of m.media || []) {
        if (item.type === "video") video += 1;
        else photo += 1;
      }
    }
    return { photo, video };
  }, [rawMoments]);

  const favoriteCount = useMemo(
    () => rawMoments.filter((m) => m.favorite).length,
    [rawMoments]
  );

  const filteredByType = useMemo(() => {
    if (filterKey === "all") return rawMoments;
    if (filterKey === "favorite") return rawMoments.filter((m) => m.favorite);
    // "photo" / "video": lọc theo loại của ảnh/video đại diện (mục đầu tiên trong album)
    return rawMoments.filter((m) => {
      const cover = (m.media || [])[0];
      return cover?.type === filterKey;
    });
  }, [rawMoments, filterKey]);

  const filteredByQuery = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredByType;
    return filteredByType.filter((m) => (m.title || "").toLowerCase().includes(q));
  }, [filteredByType, query]);

  const moments = sortMoments(filteredByQuery, sortOrder);

  function handleSortChange(order) {
    if (order === sortOrder) return;
    setSortOrder(order);
    setPage(1);
  }

  function handleFilterChange(key) {
    if (key === filterKey) return;
    setFilterKey(key);
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

  const activeFilterLabel =
    FILTERS.find((f) => f.key === filterKey)?.label || "Tất cả album";

  return (
    <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <PageDecor variant="albums" />

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar bộ lọc */}
        <aside className="h-fit rounded-2xl bg-white p-3 shadow-sm lg:sticky lg:top-20">
          <nav className="flex flex-col gap-1">
            <SidebarButton
              icon={<ImageStackIcon className="h-4 w-4" />}
              label="Tất cả album"
              count={rawMoments.length}
              active={filterKey === "all"}
              onClick={() => handleFilterChange("all")}
            />
            <SidebarButton
              icon={<ImageStackIcon className="h-4 w-4" />}
              label="Ảnh"
              count={mediaCounts.photo}
              active={filterKey === "photo"}
              onClick={() => handleFilterChange("photo")}
            />
            <SidebarButton
              icon={<VideoIcon className="h-4 w-4" />}
              label="Video"
              count={mediaCounts.video}
              active={filterKey === "video"}
              onClick={() => handleFilterChange("video")}
            />
            <SidebarButton
              icon={<HeartOutlineIcon className="h-4 w-4" />}
              label="Yêu thích"
              count={favoriteCount}
              active={filterKey === "favorite"}
              onClick={() => handleFilterChange("favorite")}
            />
          </nav>
        </aside>

        {/* Nội dung chính */}
        <div>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display truncate text-2xl font-bold text-brand-700 md:text-3xl">
                {activeFilterLabel}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Lưu giữ những khoảnh khắc đẹp nhất của chúng ta ♡
              </p>
              {query && (
                <p className="mt-1 text-xs text-slate-400">
                  Kết quả tìm kiếm cho “{query}”{" "}
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="font-medium text-brand-500 hover:underline"
                  >
                    Xoá tìm kiếm
                  </button>
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleSortChange("newest")}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${sortOrder === "newest"
                    ? "bg-brand-500 text-white"
                    : "text-brand-600 hover:bg-brand-50"
                    }`}
                >
                  Mới nhất
                </button>
                <button
                  type="button"
                  onClick={() => handleSortChange("oldest")}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${sortOrder === "oldest"
                    ? "bg-brand-500 text-white"
                    : "text-brand-600 hover:bg-brand-50"
                    }`}
                >
                  Cũ nhất
                </button>
              </div>

              <Link
                href="/add"
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
              >
                + Tạo album
              </Link>
            </div>
          </div>

          {moments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-10 text-center">
              <p className="text-slate-500">
                {query || filterKey !== "all"
                  ? "Không tìm thấy album nào phù hợp."
                  : "Chưa có album nào. Hãy thêm album đầu tiên của hai bạn nhé ♡"}
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
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
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
      </div>
    </div>
  );
}

export default function AllAlbumsPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <AllAlbumsPageInner />
    </Suspense>
  );
}
