// Bộ icon dạng nét (line icon) dùng chung cho giao diện mới.
// Vẽ tay bằng SVG (không phụ thuộc thư viện ngoài) để đồng bộ với HeartIcon.jsx
// đã có sẵn trong dự án. Mọi icon đều nhận `className` để chỉnh cỡ/màu qua Tailwind.

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
};

export function HomeIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-3.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V19a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

export function CameraIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V8.5Z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}

export function PencilIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20l4.2-.9L18.6 8.7a1.8 1.8 0 0 0 0-2.6l-.7-.7a1.8 1.8 0 0 0-2.6 0L4.9 15.8 4 20Z" />
      <path d="M14 6.5 17.5 10" />
    </svg>
  );
}

export function UsersIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8.5" r="2.75" />
      <path d="M3.5 19c.6-2.9 2.7-4.5 5.5-4.5s4.9 1.6 5.5 4.5" />
      <circle cx="17" cy="9" r="2.1" />
      <path d="M15.8 14.7c2.1.4 3.5 1.8 3.9 4.3" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function CalendarIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M4 10h16M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function SendIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className} fill="currentColor" stroke="none">
      <path d="M3.4 11.2 20 3l-7 16.6a.9.9 0 0 1-1.66.04L8.5 13.5l-5.1-2.3Z" />
      <path
        d="M8.5 13.5 20 3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeartOutlineIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20.2s-7-4.5-9.5-8.6C1 8.7 1.4 5.2 4.3 3.6c2.3-1.3 4.9-.6 6.4 1.3l1.3 1.7 1.3-1.7c1.5-1.9 4.1-2.6 6.4-1.3 2.9 1.6 3.3 5.1 1.8 8-2.5 4.1-9.5 8.6-9.5 8.6Z" />
    </svg>
  );
}

export function ImageStackIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="6" width="14" height="14" rx="2" />
      <path d="m3 16 3.3-3.3a1.5 1.5 0 0 1 2.12 0L12 16.3" />
      <circle cx="8.2" cy="10" r="1.3" />
      <path d="M7 6V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1" />
    </svg>
  );
}

export function VideoIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10.5 4.5-3v9l-4.5-3Z" />
    </svg>
  );
}

export function StarIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className} fill="currentColor" stroke="none">
      <path d="M12 2.5 14.6 9l7 .5-5.4 4.5 1.8 6.8L12 17.3 5.9 20.8l1.9-6.8L2.4 9.5l7-.5L12 2.5Z" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg {...base} strokeWidth={2.4} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function NoteIcon({ className = "h-4 w-4" }) {
  return (
    <svg {...base} className={className}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </svg>
  );
}

export function UploadCloudIcon({ className = "h-6 w-6" }) {
  return (
    <svg {...base} className={className}>
      <path d="M7.5 17.5A4.5 4.5 0 0 1 6.8 8.6a5.5 5.5 0 0 1 10.7-1.7A4 4 0 0 1 17 17.5" />
      <path d="M12 10.5v7M9 13.2l3-2.7 3 2.7" />
    </svg>
  );
}
