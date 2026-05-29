"use client";

import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface PageBackHeaderProps {
  title: string;
  subtitle?: string;
  fallbackHref?: string;
  className?: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

export function PageBackHeader({
  title,
  subtitle,
  fallbackHref = "/feed",
  className,
  rightAction,
  onBack,
}: PageBackHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <div className={cn("mb-4 flex items-start gap-2", className)}>
      <button
        type="button"
        onClick={handleBack}
        className="mt-0.5 flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-green-primary transition-colors hover:bg-green-pale"
        aria-label="Go back"
      >
        <IconArrowLeft size={18} stroke={2} />
        <span className="hidden sm:inline">Back</span>
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="text-[17px] font-extrabold leading-tight text-text-dark">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-text-muted">{subtitle}</p>
        )}
      </div>
      {rightAction ? (
        <div className="shrink-0 pt-0.5">{rightAction}</div>
      ) : null}
    </div>
  );
}
