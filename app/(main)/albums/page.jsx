"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MomentCard from "@/components/MomentCard";
import FullPageLoader from "@/components/FullPageLoader";
import PageDecor from "@/components/PageDecor";
import { ImageStackIcon, VideoIcon } from "@/components/Icons";
import { getAllMoments } from "@/lib/moments";

const ALBUM_PAGE_SIZE = 8;
const MEDIA_PAGE_SIZE = 20;

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

// Sắp xếp theo thời gian. order: "newest" (mới nhất trước) hoặc "oldest" (cũ nhất trước)
function sortByTime(items, order, getTime) {
  const sign = order === "oldest" ? 1 : -1;
  return [...items].sort((a, b) => sign * (getTime(a) - getTime(b)));
}

// 3 mục lọc ở sidebar bên trái (giao diện mới). Giá trị "image"/"video" khớp
// đúng với field `type` lưu trong từng phần tử của mảng `media` của 1 moment
// (xem lib/moments.js) - KHÔNG dùng nhãn hiển thị "Ảnh" làm key vì dữ liệu
// thực tế lưu type là "image", không phải "photo".
const FILTERS = [
  { key: "all", label: "Tất cả album", unit: "album" },
  { key: "image", label: "Ảnh", unit: "ảnh" },
  { key: "video", label: "Video", unit: "video" },
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

// 1 ô ảnh/video đơn lẻ khi đang lọc theo "Ảnh" hoặc "Video" - bấm vào sẽ mở
// đúng album chứa nó (trang chi tiết có sẵn khung xem carousel).
function MediaThumb({ item }) {
  return (
    <Link
      href={`/moment/${item.momentId}`}
      className="group relative block aspect-square overflow-hidden rounded-xl bg-brand-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {item.type === "video" ? (
        <>
          <video
            src={item.url}
            className="h-full w-full object-cover"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-xs text-brand-700 shadow">
              ▶
            </div>
          </div>
        </>
      ) : (
        <img
          src={item.url}
          alt={item.momentTitle || "Khoảnh khắc"}
          className="h-full w-full object-cover"
        />
      )}

      {item.momentTitle && (
        <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
          {item.momentTitle}
        </div>
      )}
    </Link>
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

  // Về lại trang 1 mỗi khi đổi bộ lọc / cách sắp xếp / từ khoá tìm kiếm
  useEffect(() => {
    setPage(1);
  }, [filterKey, sortOrder, query]);

  // Danh sách phẳng toàn bộ ảnh/video (không gộp theo album) - dùng khi lọc
  // theo "Ảnh" hoặc "Video", vì lúc đó người dùng muốn xem TỪNG ảnh/video,
  // không phải xem theo từng album như chế độ "Tất cả album".
  const allMediaItems = useMemo(() => {
    const items = [];
    for (const m of rawMoments) {
      for (const media of m.media || []) {
        items.push({
          key: `${m.id}-${media.url}`,
          type: media.type,
          url: media.url,
          momentId: m.id,
          momentTitle: m.title,
          momentDate: m.date,
        });
      }
    }
    return items;
  }, [rawMoments]);

  const mediaCounts = useMemo(() => {
    let image = 0;
    let video = 0;
    for (const item of allMediaItems) {
      if (item.type === "video") video += 1;
      else image += 1;
    }
    return { image, video };
  }, [allMediaItems]);

  const query_ = query.trim().toLowerCase();

  // Chế độ "Tất cả album": lọc + sắp xếp + phân trang theo ALBUM
  const filteredMoments = useMemo(() => {
    if (!query_) return rawMoments;
    return rawMoments.filter((m) => (m.title || "").toLowerCase().includes(query_));
  }, [rawMoments, query_]);
  const sortedMoments = sortByTime(filteredMoments, sortOrder, getMomentTime);

  // Chế độ "Ảnh" / "Video": lọc + sắp xếp + phân trang theo TỪNG ảnh/video
  const filteredMedia = useMemo(() => {
    let list = allMediaItems.filter((item) => item.type === filterKey);
    if (query_) {
      list = list.filter((item) =>
        (item.momentTitle || "").toLowerCase().includes(query_)
      );
    }
    return list;
  }, [allMediaItems, filterKey, query_]);
  const sortedMedia = sortByTime(filteredMedia, sortOrder, (item) =>
    toMillis(item.momentDate)
  );

  const isAlbumMode = filterKey === "all";
  const activeList = isAlbumMode ? sortedMoments : sortedMedia;
  const pageSize = isAlbumMode ? ALBUM_PAGE_SIZE : MEDIA_PAGE_SIZE;

  const totalPages = Math.max(1, Math.ceil(activeList.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = activeList.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  function handleSortChange(order) {
    setSortOrder(order);
  }

  function handleFilterChange(key) {
    setFilterKey(key);
  }

  function goToPage(p) {
    const clamped = Math.min(Math.max(1, p), totalPages);
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return <FullPageLoader />;
  }

  const activeFilter = FILTERS.find((f) => f.key === filterKey) || FILTERS[0];

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
              count={mediaCounts.image}
              active={filterKey === "image"}
              onClick={() => handleFilterChange("image")}
            />
            <SidebarButton
              icon={<VideoIcon className="h-4 w-4" />}
              label="Video"
              count={mediaCounts.video}
              active={filterKey === "video"}
              onClick={() => handleFilterChange("video")}
            />
          </nav>
        </aside>

        {/* Nội dung chính */}
        <div>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display truncate text-2xl font-bold text-brand-700 md:text-3xl">
                {activeFilter.label}
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

          {activeList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-10 text-center">
              <p className="text-slate-500">
                {query || filterKey !== "all"
                  ? "Không tìm thấy nội dung nào phù hợp."
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
                Trang {safePage}/{totalPages} · {activeList.length}{" "}
                {activeFilter.unit}
              </p>

              {isAlbumMode ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {pageItems.map((m) => (
                    <MomentCard key={m.id} moment={m} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {pageItems.map((item) => (
                    <MediaThumb key={item.key} item={item} />
                  ))}
                </div>
              )}

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
