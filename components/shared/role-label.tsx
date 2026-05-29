import { formatRoleLabel } from "@/lib/user-display";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

export function RoleLabel({
  role,
  className,
}: {
  role?: Role | string | null;
  className?: string;
}) {
  if (!role) return null;
  return (
    <p
      className={cn(
        "text-[10px] font-semibold text-text-muted",
        className
      )}
    >
      {formatRoleLabel(role)}
    </p>
  );
}
