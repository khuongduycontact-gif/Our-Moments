"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MomentCard from "@/components/MomentCard";
import FullPageLoader from "@/components/FullPageLoader";
import PageDecor from "@/components/PageDecor";
import { ImageStackIcon } from "@/components/Icons";
import { getAllMoments } from "@/lib/moments";
import { ALBUM_TYPES } from "@/lib/albumTypes";

const ALBUM_PAGE_SIZE = 8;
const VALID_TYPE_KEYS = ALBUM_TYPES.map((t) => t.key);

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

// Các mục lọc ở sidebar bên trái: "Tất cả album" + 3 loại album. Key của từng
// loại khớp đúng với field `albumType` lưu trong mỗi album (xem lib/albumTypes.js).
const FILTERS = [{ key: "all", label: "Tất cả album" }, ...ALBUM_TYPES];

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
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          {icon}
        </span>
        <span className="text-left leading-snug">{label}</span>
      </span>
      {typeof count === "number" && (
        <span className={`shrink-0 ${active ? "text-white/80" : "text-slate-400"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function AllAlbumsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Trang hiện tại, bộ lọc loại album, cách sắp xếp và từ khoá tìm kiếm được
  // lưu ngay trên URL (vd: /albums?page=2&type=outing&sort=oldest&q=biển).
  // Nhờ vậy khi mở 1 album rồi bấm quay lại, trình duyệt trở về đúng URL này
  // và giữ nguyên trang đang xem thay vì về trang 1.
  const query = searchParams.get("q") || "";
  const sortOrder = searchParams.get("sort") === "oldest" ? "oldest" : "newest"; // "newest" | "oldest"
  const typeParam = searchParams.get("type");
  const filterKey = VALID_TYPE_KEYS.includes(typeParam) ? typeParam : "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [rawMoments, setRawMoments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMoments()
      .then(setRawMoments)
      .finally(() => setLoading(false));
  }, []);

  // Cập nhật URL với các thay đổi (giá trị null/rỗng = bỏ tham số đó). Dùng
  // replace thay vì push để mỗi lần đổi trang/bộ lọc không sinh thêm 1 mục
  // trong lịch sử, nút quay lại vẫn đi thẳng về màn hình trước đó.
  function updateUrl(changes) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, String(value));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Số album của từng loại (hiện bên cạnh nút lọc ở sidebar)
  const typeCounts = useMemo(() => {
    const counts = {};
    for (const m of rawMoments) {
      counts[m.albumType] = (counts[m.albumType] || 0) + 1;
    }
    return counts;
  }, [rawMoments]);

  const query_ = query.trim().toLowerCase();

  // Lọc theo loại album + từ khoá tìm kiếm, rồi sắp xếp và phân trang theo ALBUM
  const filteredMoments = useMemo(() => {
    return rawMoments.filter((m) => {
      if (filterKey !== "all" && m.albumType !== filterKey) return false;
      if (query_ && !(m.title || "").toLowerCase().includes(query_)) return false;
      return true;
    });
  }, [rawMoments, filterKey, query_]);
  const sortedMoments = sortByTime(filteredMoments, sortOrder, getMomentTime);

  const totalPages = Math.max(1, Math.ceil(sortedMoments.length / ALBUM_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = sortedMoments.slice(
    (safePage - 1) * ALBUM_PAGE_SIZE,
    safePage * ALBUM_PAGE_SIZE
  );

  // Đổi cách sắp xếp / bộ lọc / từ khoá thì về lại trang 1
  function handleSortChange(order) {
    updateUrl({ sort: order === "oldest" ? "oldest" : null, page: null });
  }

  function handleFilterChange(key) {
    updateUrl({ type: key === "all" ? null : key, page: null });
  }

  function clearQuery() {
    updateUrl({ q: null, page: null });
  }

  function goToPage(p) {
    const clamped = Math.min(Math.max(1, p), totalPages);
    updateUrl({ page: clamped === 1 ? null : clamped });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return <FullPageLoader />;
  }

  const activeFilter = FILTERS.find((f) => f.key === filterKey) || FILTERS[0];

  return (
    <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <PageDecor variant="albums" />

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[250px_1fr]">
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
            {ALBUM_TYPES.map((type) => (
              <SidebarButton
                key={type.key}
                icon={
                  <span aria-hidden="true" className="text-base leading-none">
                    {type.emoji}
                  </span>
                }
                label={type.label}
                count={typeCounts[type.key] || 0}
                active={filterKey === type.key}
                onClick={() => handleFilterChange(type.key)}
              />
            ))}
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
                    onClick={clearQuery}
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

          {sortedMoments.length === 0 ? (
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
                Trang {safePage}/{totalPages} · {sortedMoments.length} album
              </p>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {pageItems.map((m) => (
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
