"use client";

import { useEffect, useRef, useState } from "react";

export function HelpTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ver ayuda"
        aria-expanded={open}
        className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[#6FA83D] hover:bg-[#f2f7ec] hover:text-[#4c7a28]"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-full w-full">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-md border border-zinc-200 bg-white p-3 text-sm leading-relaxed text-zinc-700 shadow-lg">
          {text}
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-zinc-200 bg-white" />
        </div>
      )}
    </span>
  );
}
