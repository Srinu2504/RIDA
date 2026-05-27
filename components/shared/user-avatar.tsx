import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  square?: boolean;
  className?: string;
}

export function UserAvatar({
  name,
  src,
  size = 36,
  square = false,
  className,
}: UserAvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "R";

  return (
    <div
      className={cn(
        "rida-avatar relative shrink-0 overflow-hidden",
        square ? "rounded-xl" : "rounded-full",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        <Image src={src} alt={name} fill className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {initial}
        </span>
      )}
    </div>
  );
}
