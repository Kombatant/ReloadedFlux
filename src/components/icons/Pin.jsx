// Tabler "pinned" (MIT): outline when off, solid when `filled`.
export default function Pin({ className, filled = false, style, ...props }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height="1em"
      style={style}
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {filled ? (
        <path
          d="M16 3a1 1 0 0 1 .117 1.993l-.117.007v4.764l1.894 3.789a1 1 0 0 1 .1.331l.006.116v2a1 1 0 0 1-.883.993l-.117.007h-4v4a1 1 0 0 1-1.993.117l-.007-.117v-4h-4a1 1 0 0 1-.993-.883l-.007-.117v-2a1 1 0 0 1 .06-.34l.046-.107 1.894-3.791v-4.762a1 1 0 0 1-.117-1.993l.117-.007h8z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M9 4v6l-2 4v2h10v-2l-2-4V4M12 16v5M8 4h8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
    </svg>
  )
}
