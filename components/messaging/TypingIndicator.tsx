"use client";

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 py-2 text-xs text-text-muted">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-primary [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-primary [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-primary [animation-delay:240ms]" />
      </div>
      <span className="transition-opacity">{name} is typing...</span>
    </div>
  );
}

