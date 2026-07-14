// Icon trái tim dạng SVG (không phải emoji) để có thể đổi màu theo theme
// bằng CSS (currentColor), khác với emoji 💜 vốn có màu cố định không đổi được.
export default function HeartIcon({ className = "h-6 w-6" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M12 21s-6.7-4.35-9.33-8.2C1 10.28 1.2 6.9 3.87 5.2c2.2-1.4 4.9-.86 6.53 1.2L12 8l1.6-1.6c1.63-2.06 4.33-2.6 6.53-1.2 2.67 1.7 2.87 5.08 1.2 7.6C18.7 16.65 12 21 12 21z" />
        </svg>
    );
}
