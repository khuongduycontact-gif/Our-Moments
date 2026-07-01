"use client";

import { useEffect, useRef, useState } from "react";
import MomentCard from "./MomentCard";

const PER_SLIDE = 4;
const AUTO_SLIDE_MS = 2500; // tốc độ tự trượt (nhanh hơn)
const TRANSITION_MS = 450; // tốc độ hiệu ứng trượt (nhanh hơn)

// Chia mảng moments thành từng nhóm đúng 4 cái một.
// Nếu nhóm cuối không đủ 4, "mượn" thêm từ đầu mảng để lấp đầy,
// tránh trường hợp slide cuối chỉ có 1-2 cái lẻ.
function buildSlides(items, size) {
  const slides = [];
  for (let i = 0; i < items.length; i += size) {
    let slide = items.slice(i, i + size);
    if (slide.length < size) {
      const need = size - slide.length;
      slide = [...slide, ...items.slice(0, need)];
    }
    slides.push(slide);
  }
  return slides;
}

export default function MomentsSlider({ moments }) {
  const baseSlides = buildSlides(moments, PER_SLIDE);
  const isSlider = baseSlides.length > 1;

  // Nhân bản slide đầu tiên, gắn vào cuối để tạo hiệu ứng trượt vòng tròn
  // liền mạch (đi hết slide cuối sẽ "trượt tiếp" sang bản sao của slide đầu,
  // rồi nhảy êm về slide đầu thật mà mắt thường không nhận ra).
  const slides = isSlider ? [...baseSlides, baseSlides[0]] : baseSlides;

  const [current, setCurrent] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isSlider || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrent((prev) => prev + 1);
    }, AUTO_SLIDE_MS);

    return () => clearInterval(timerRef.current);
  }, [isSlider, isPaused]);

  // Khi vừa trượt hết tới bản sao (slide cuối cùng == bản sao của slide đầu),
  // đợi hiệu ứng chạy xong rồi tắt transition, nhảy êm về slide đầu thật (index 0).
  useEffect(() => {
    if (!isSlider) return;
    if (current !== slides.length - 1) return;

    const t = setTimeout(() => {
      setWithTransition(false);
      setCurrent(0);
    }, TRANSITION_MS);

    return () => clearTimeout(t);
  }, [current, isSlider, slides.length]);

  // Bật lại transition ở frame kế tiếp sau khi đã nhảy êm về slide 0
  useEffect(() => {
    if (withTransition) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setWithTransition(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [withTransition]);

  function goTo(i) {
    setWithTransition(true);
    setCurrent(i);
  }

  // Nếu có <= 4 khoảnh khắc thì chỉ hiển thị grid tĩnh, không cần slider
  if (!isSlider) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {moments.map((m) => (
          <MomentCard key={m.id} moment={m} />
        ))}
      </div>
    );
  }

  const activeDot = current % baseSlides.length;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className={`flex ${
            withTransition ? "transition-transform ease-out" : ""
          }`}
          style={{
            transform: `translateX(-${current * 100}%)`,
            transitionDuration: withTransition ? `${TRANSITION_MS}ms` : "0ms",
          }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="w-full flex-shrink-0">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {slide.map((m, j) => (
                  <MomentCard key={`${m.id}-${i}-${j}`} moment={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chấm điều hướng */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {baseSlides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Đến slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === activeDot ? "w-6 bg-brand-500" : "w-2 bg-brand-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
