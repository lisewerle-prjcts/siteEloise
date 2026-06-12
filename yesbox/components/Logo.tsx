import Link from 'next/link'

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      {/* Bulle avec cœur hachuré */}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="18" cy="17" r="16" fill="#D63E7A" />
        {/* Rayures diagonales */}
        <clipPath id="heart-clip">
          <path d="M18 26s-9-5.5-9-12a6 6 0 0 1 9-5.2A6 6 0 0 1 27 14c0 6.5-9 12-9 12z" />
        </clipPath>
        <path d="M18 26s-9-5.5-9-12a6 6 0 0 1 9-5.2A6 6 0 0 1 27 14c0 6.5-9 12-9 12z" fill="white" fillOpacity="0.2" />
        <g clipPath="url(#heart-clip)">
          {[-10, -4, 2, 8, 14, 20, 26].map((x) => (
            <line key={x} x1={x} y1="6" x2={x + 20} y2="28" stroke="white" strokeWidth="2.5" />
          ))}
        </g>
        {/* Triangle bulle */}
        <path d="M10 30 L14 24 L18 30 Z" fill="#D63E7A" />
      </svg>
      <span className="font-fraunces text-xl font-semibold text-soft-black tracking-tight">
        YES BOX
      </span>
    </Link>
  )
}
