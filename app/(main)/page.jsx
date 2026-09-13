"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LoveCounter from "@/components/LoveCounter";
import FeaturedMoment from "@/components/FeaturedMoment";
import MomentListItem from "@/components/MomentListItem";
import Toast from "@/components/Toast";
import HeartIcon from "@/components/HeartIcon";
import FullPageLoader from "@/components/FullPageLoader";
import { CameraIcon } from "@/components/Icons";
import { getAllMoments } from "@/lib/moments";
import { getSiteSettings, updateHeroImage } from "@/lib/settings";
import { uploadFileToCloudinary } from "@/lib/uploadToCloudinary";

export default function HomePage() {
  const [moments, setMoments] = useState([]);
  const [loadingMoments, setLoadingMoments] = useState(true);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const [toast, setToast] = useState(null);
  // Trạng thái loading tổng của trang: chỉ tắt khi CẢ moments lẫn site
  // settings đều đã tải xong, để tránh hiện nội dung "nhấp nháy" từng phần.
  const [initialLoading, setInitialLoading] = useState(true);
  const heroFileInputRef = useRef(null);

  useEffect(() => {
    let momentsDone = false;
    let settingsDone = false;

    function checkAllDone() {
      if (momentsDone && settingsDone) setInitialLoading(false);
    }

    getAllMoments()
      .then(setMoments)
      .finally(() => {
        setLoadingMoments(false);
        momentsDone = true;
        checkAllDone();
      });

    getSiteSettings()
      .then((s) => {
        setHeroImageUrl(s.heroImageUrl || "");
      })
      .finally(() => {
        settingsDone = true;
        checkAllDone();
      });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleHeroFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", message: "Vui lòng chọn 1 file ảnh." });
      return;
    }

    setHeroUploading(true);
    try {
      const publicUrl = await uploadFileToCloudinary(file);
      await updateHeroImage(publicUrl);
      setHeroImageUrl(publicUrl);
      setToast({ type: "success", message: "Đã đổi ảnh thành công ♡" });
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        message: "Có lỗi khi đổi ảnh, vui lòng thử lại.",
      });
    } finally {
      setHeroUploading(false);
    }
  }

  if (initialLoading) {
    return <FullPageLoader />;
  }

  const featuredMoment = moments[0] || null;
  // Hiện toàn bộ khoảnh khắc còn lại (trừ album nổi bật), danh sách sẽ tự
  // scroll dọc bên trong khối thay vì làm phình chiều cao cả trang.
  const listMoments = moments.slice(1);

  return (
    <>
      <Toast toast={toast} />

      {/*
        Wrapper canh giữa + padding ngang DUY NHẤT cho toàn bộ trang.
        Mọi section bên trong chỉ khai báo padding dọc (py/pb) và layout
        riêng của nó — tuyệt đối không tự set mx-auto/max-w/px nữa, để
        tránh lệch lề như trước.
      */}
      <div className="mx-auto max-w-6xl px-4">
        {/* Hero */}
        <section className="flex flex-col items-center gap-8 py-10 lg:flex-row lg:items-center lg:justify-between md:py-16">
          <div className="w-full text-center lg:flex-1 lg:text-left">
            <p className="mb-2 text-sm text-slate-500">Chào mừng đến với</p>
            <h1 className="font-display mb-3 text-4xl font-bold text-brand-700 md:text-5xl">
              The Love Chapter
            </h1>
            <p className="mb-6 text-slate-500">
              Nơi lưu giữ những khoảnh khắc đẹp nhất của chúng ta ♡
            </p>
            <div className="flex justify-center lg:justify-start">
              <Link
                href="/add"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-600"
              >
                + Thêm nội dung mới
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center">
            <button
              type="button"
              onClick={() => !heroUploading && heroFileInputRef.current?.click()}
              disabled={heroUploading}
              aria-label="Đổi ảnh đại diện"
              className="group relative flex h-56 w-56 items-center justify-center rounded-full border-8 border-brand-200/60 bg-white shadow-inner transition hover:border-brand-300 disabled:cursor-wait md:h-64 md:w-64"
            >
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt="Ảnh đại diện"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <HeartIcon className="h-20 w-20 text-brand-500" />
              )}

              {/* Overlay gợi ý đổi ảnh */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/50 text-white transition-opacity ${heroUploading
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
                  }`}
              >
                <span className="text-2xl">{heroUploading ? "⏳" : "✎"}</span>
                <span className="text-xs font-medium">
                  {heroUploading ? "Đang tải lên..." : "Đổi ảnh"}
                </span>
              </div>

              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeroFileChange}
                className="hidden"
              />
            </button>
          </div>

          <div className="flex w-full justify-center shrink-0 lg:w-auto lg:justify-end">
            <LoveCounter />
          </div>
        </section>

        {/* Album nổi bật + Khoảnh khắc đáng nhớ */}
        <section className="pb-10">
          {loadingMoments ? (
            <p className="text-sm text-slate-400">Đang tải khoảnh khắc...</p>
          ) : !featuredMoment ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-10 text-center">
              <p className="text-slate-500">
                Chưa có khoảnh khắc nào. Hãy thêm khoảnh khắc đầu tiên của hai bạn nhé ♡
              </p>
              <Link
                href="/add"
                className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline"
              >
                + Thêm nội dung mới
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
              <FeaturedMoment moment={featuredMoment} />

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <h2 className="font-display flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    <CameraIcon className="h-4 w-4" />
                    Khoảnh khắc đáng nhớ
                  </h2>
                  <Link
                    href="/albums"
                    className="shrink-0 text-xs font-medium text-brand-500 hover:underline"
                  >
                    Tất cả
                  </Link>
                </div>

                {listMoments.length === 0 ? (
                  <p className="px-1 py-3 text-xs text-slate-400">
                    Chưa có khoảnh khắc nào khác.
                  </p>
                ) : (
                  <div className="scrollbar-thin-brand flex max-h-[420px] flex-col gap-0.5 overflow-y-auto pr-1">
                    {listMoments.map((m) => (
                      <MomentListItem key={m.id} moment={m} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-24 pb-16">
          <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display flex items-center gap-2 text-base font-semibold text-brand-700 md:text-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100">
                  <HeartIcon className="h-4 w-4 text-brand-500" />
                </span>
                Về chúng mình
              </h3>
              <p className="font-handwriting text-xl text-brand-400">
                Together is our favorite place ♡
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr]">
              <div className="flex flex-row items-center gap-3 text-brand-300 md:flex-col md:items-start md:gap-2">
                <span aria-hidden="true" className="text-3xl leading-none">
                  ♡
                </span>
                <p className="font-handwriting -rotate-2 text-2xl leading-tight text-brand-400">
                  Cảm ơn vì đã ở đây cùng chúng mình
                </p>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-slate-500">
                <p>
                  Hai con người, hai thế giới khác nhau, nhưng lại cùng chọn đồng
                  hành cùng nhau trên một hành trình ♡ Chúng mình gặp nhau vào một
                  ngày rất bình thường, trong một khoảnh khắc chẳng ai ngờ tới, rồi
                  từ đó, những điều bình thường ấy dần trở thành một phần không
                  thể thiếu trong cuộc sống của cả hai.
                </p>
                <p>
                  Không phải lúc nào mọi thứ cũng dễ dàng. Có những ngày vui đến
                  mức chỉ muốn thời gian ngừng lại, cũng có những ngày mệt mỏi,
                  giận hờn vu vơ chẳng vì lý do gì to tát. Nhưng sau tất cả, điều
                  giữ chúng mình lại bên nhau chưa bao giờ là sự hoàn hảo, mà là
                  việc luôn chọn quay về, chọn lắng nghe và chọn thấu hiểu nhau
                  mỗi ngày một chút.
                </p>
                <p>
                  Trang web nhỏ này ra đời để lưu giữ lại những khoảnh khắc ấy —
                  từ những chuyến đi xa, những bữa ăn giản dị, đến những tấm ảnh
                  chụp vội chẳng có lý do gì đặc biệt ngoài việc "lúc đó thấy vui
                  nên chụp thôi". Mỗi tấm ảnh, mỗi đoạn video ở đây đều là một
                  mảnh ghép nhỏ trong câu chuyện của hai đứa, và mình muốn giữ
                  chúng lại thật cẩn thận, để sau này nhìn lại vẫn còn nguyên vẹn
                  cảm xúc như ngày đầu.
                </p>
                <p>
                  Cảm ơn vì đã luôn ở đây, cùng viết tiếp những chương tiếp theo
                  của câu chuyện này. Mong rằng dù mai sau có bao nhiêu khoảnh
                  khắc mới được thêm vào, thì tình cảm dành cho nhau vẫn sẽ luôn
                  tươi mới như buổi ban đầu ♡
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
