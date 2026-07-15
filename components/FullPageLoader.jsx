import HeartIcon from "@/components/HeartIcon";

/**
 * Màn hình loading toàn trang.
 * Dùng `fixed inset-0` + nền đặc (không trong suốt) + z-index cao hơn Header
 * (Header đang dùng z-40) để che kín toàn bộ màn hình, kể cả Header và Footer
 * đang render bên dưới, cho tới khi dữ liệu tải xong.
 */
export default function FullPageLoader() {
    const bars = Array.from({ length: 12 });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-50">
            <div className="relative flex h-24 w-24 items-center justify-center">
                {bars.map((_, i) => (
                    <span
                        key={i}
                        className="spinner-dial-bar-wrap"
                        style={{ transform: `rotate(${i * 30}deg)` }}
                    >
                        <span
                            className="spinner-dial-bar"
                            style={{ animationDelay: `${(-(12 - i) / 12).toFixed(3)}s` }}
                        />
                    </span>
                ))}
                <HeartIcon className="relative z-10 h-7 w-7 text-brand-500" />
            </div>
        </div>
    );
}
