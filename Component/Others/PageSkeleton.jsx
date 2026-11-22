"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { navKindFor, contentPaddingFor } from "@/lib/navRouting";

const bar = "animate-pulse rounded-lg bg-slate-200/80";

/**
 * Placeholder shown while a route is loading. It keeps the page frame (and the
 * sidebar, which lives in the layout) in place and only pulses the content, so
 * nothing jumps when the real page arrives.
 */
export default function PageSkeleton({ rows = 3 }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const pad = contentPaddingFor(navKindFor(pathname, session?.user));

  return (
    <div className={`min-h-screen loader-delayed ${pad}`} aria-busy="true" aria-live="polite">
      <div className="mx-auto w-full max-w-5xl px-6 pt-24 md:pt-12 pb-16">
        <div className={`${bar} h-8 w-64 mb-3`} />
        <div className={`${bar} h-4 w-80 max-w-full mb-10`} />
        <div className="flex flex-col gap-5">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-slate-100 bg-white">
              <div className={`${bar} h-44 sm:h-40 sm:w-[260px] rounded-none`} />
              <div className="flex-1 p-5 space-y-3">
                <div className={`${bar} h-5 w-2/3`} />
                <div className={`${bar} h-3 w-1/2`} />
                <div className={`${bar} h-3 w-5/6`} />
              </div>
            </div>
          ))}
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
