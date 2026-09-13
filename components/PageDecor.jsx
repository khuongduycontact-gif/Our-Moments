// Hoạ tiết trang trí (trái tim/hoa lá vẽ nét) đặt phía sau nội dung chính,
// giống giao diện mới. Chỉ hiện từ màn hình lg trở lên để không làm rối bố
// cục trên điện thoại. Luôn pointer-events-none. Không có chữ trên nền để
// tránh đè/rối với nội dung chính phía trên.

function DoodleHeart({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20.2s-7-4.5-9.5-8.6C1 8.7 1.4 5.2 4.3 3.6c2.3-1.3 4.9-.6 6.4 1.3l1.3 1.7 1.3-1.7c1.5-1.9 4.1-2.6 6.4-1.3 2.9 1.6 3.3 5.1 1.8 8-2.5 4.1-9.5 8.6-9.5 8.6Z" />
    </svg>
  );
}

function DoodleFlower({ className = "" }) {
  return (
    <svg
      viewBox="0 0 90 130"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      className={className}
      aria-hidden="true"
    >
      <path d="M20 128C18 90 22 55 34 30" />
      <path d="M34 30c-8-6-10-16-6-24" />
      <path d="M34 30c2-9 10-15 19-14" />
      <path d="M28 55c-9-2-15-9-15-18" />
      <path d="M28 55c-1-9 5-17 14-19" />
      <path d="M25 82c-8 0-15-6-16-14" />
      <path d="M25 82c0-8 6-15 14-16" />
      <circle cx="34" cy="14" r="5" />
    </svg>
  );
}

export default function PageDecor({ variant = "albums" }) {
  if (variant === "edit") {
    return (
      <div className="page-decor hidden lg:block">
        <DoodleHeart className="left-[3%] top-[30%] h-10 w-10 text-brand-200/70" />
        <DoodleFlower className="bottom-[4%] left-[1%] h-28 w-20 text-brand-200/70" />
        <DoodleHeart className="right-[4%] top-[8%] h-8 w-8 text-brand-200/60" />
        <DoodleHeart className="bottom-[10%] right-[4%] h-12 w-12 text-brand-200/60" />
      </div>
    );
  }

  return (
    <div className="page-decor hidden lg:block">
      <DoodleHeart className="right-[6%] top-[10%] h-8 w-8 text-brand-200/70" />
      <DoodleFlower className="bottom-[8%] left-[1%] h-20 w-16 text-brand-200/70" />
      <DoodleHeart className="bottom-[6%] right-[3%] h-16 w-16 text-brand-200/60" />
    </div>
  );
}
