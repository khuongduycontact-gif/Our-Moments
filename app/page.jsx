"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import MomentsSlider from "@/components/MomentsSlider";
import LoveCounter from "@/components/LoveCounter";
import Toast from "@/components/Toast";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useAuth } from "@/lib/AuthContext";
import { getLatestMoments } from "@/lib/moments";
import { getSiteSettings, updateHeroImage } from "@/lib/settings";
import { uploadFileToCloudinary } from "@/lib/uploadToCloudinary";

// Lấy nhiều hơn 4 để có đủ dữ liệu cho slider khi cần trượt qua các khoảnh khắc tiếp theo
const HOMEPAGE_MOMENTS_COUNT = 20;

function HomeContent() {
  const { logout } = useAuth();
  const [moments, setMoments] = useState([]);
  const [loadingMoments, setLoadingMoments] = useState(true);
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const [bgTheme, setBgTheme] = useState("purple");
  const [toast, setToast] = useState(null);
  const heroFileInputRef = useRef(null);

  useEffect(() => {
    getLatestMoments(HOMEPAGE_MOMENTS_COUNT)
      .then(setMoments)
      .finally(() => setLoadingMoments(false));

    getSiteSettings().then((s) => {
      setHeroImageUrl(s.heroImageUrl || "");

      // Đồng bộ màu nền đã lưu trên Firestore (dùng chung cho cả hai người).
      // Nếu khác với màu đang hiển thị (đọc tạm từ localStorage lúc tải trang)
      // thì cập nhật lại cho khớp.
      const savedTheme = s.bgTheme || "purple";
      setBgTheme(savedTheme);
      if (savedTheme === "purple") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
      try {
        localStorage.setItem("bgTheme", savedTheme);
      } catch (e) { }
    });
  }, []);

  useEffect(() => {
    if (!toast || toast.type !== "error") return;
    const t = setTimeout(() => setToast(null), 4000);
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

  return (
    <div className="min-h-screen bg-brand-50">
      <Toast toast={toast} />

      {/* Top bar */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">💌</span>
          <div className="hidden sm:block">
            <p className="font-display text-sm font-semibold leading-tight text-brand-600">
              Our Moments
            </p>
            <p className="text-xs leading-tight text-slate-400">
              Nhật ký của hai đứa mình ♡
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher
            initialTheme={bgTheme}
            onChanged={({ ok, themeId }) => {
              setBgTheme(themeId);
              setToast(
                ok
                  ? { type: "success", message: "Đã đổi màu nền ♡" }
                  : {
                    type: "error",
                    message: "Đổi màu nền cục bộ thành công, nhưng chưa lưu được lên hệ thống.",
                  }
              );
            }}
          />
          <button
            onClick={logout}
            className="rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50 hover:border-brand-400"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
        <div>
          <p className="mb-2 text-sm text-slate-500">Chào mừng đến với</p>
          <h1 className="font-display mb-3 text-4xl font-bold text-brand-700 md:text-5xl">
            Our Moments
          </h1>
          <p className="mb-6 text-slate-500">
            Nơi lưu giữ những khoảnh khắc đẹp nhất của chúng ta ♡
          </p>
          <Link
            href="/add"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-600"
          >
            + Thêm nội dung mới
          </Link>
        </div>
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => !heroUploading && heroFileInputRef.current?.click()}
            disabled={heroUploading}
            aria-label="Đổi ảnh đại diện"
            className="group relative flex h-64 w-64 items-center justify-center rounded-full border-8 border-brand-200/60 bg-white shadow-inner transition hover:border-brand-300 disabled:cursor-wait md:h-72 md:w-72"
          >
            {heroImageUrl ? (
              <img
                src={heroImageUrl}
                alt="Ảnh đại diện"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-6xl">💜</span>
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
      </section>

      {/* Đếm ngày yêu nhau */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <LoveCounter />
      </section>

      {/* Latest moments */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="mb-4 flex flex-row items-center justify-between gap-4 w-full">
          <h2 className="font-display flex items-center gap-2 text-base md:text-lg font-semibold text-brand-700 min-w-0 truncate">
            <span>🎞</span>
            <span className="truncate">Khoảnh khắc mới nhất 💜</span>
          </h2>

          <Link
            href="/albums"
            className="shrink-0 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50"
          >
            Tất cả album →
          </Link>
        </div>

        {loadingMoments ? (
          <p className="text-sm text-slate-400">Đang tải khoảnh khắc...</p>
        ) : moments.length === 0 ? (
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
          <MomentsSlider moments={moments} />
        )}
      </section>

      {/* About */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <h3 className="font-display mb-3 text-base font-semibold text-brand-700 md:text-lg">
            Về chúng mình
          </h3>
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
      </section>

      <footer className="border-t border-brand-100 bg-white/60 px-4 py-6 text-center text-xs text-slate-400">
        Created with love ♡ · Mỗi khoảnh khắc, một kỷ niệm · Mãi mãi của chúng ta ♡ ·
        <p>© 2026 Nguyễn Khương Duy</p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
