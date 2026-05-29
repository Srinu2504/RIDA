import type { Role } from "@/types";

export function formatProfileName(
  role: Role | string,
  firstName: string,
  lastName: string
) {
  if (role === "MEDICAL_STUDENT") {
    return `${firstName} ${lastName}`;
  }
  return `Dr. ${firstName} ${lastName}`;
}

export function formatRoleLabel(role: Role | string) {
  switch (role) {
    case "MEDICAL_STUDENT":
      return "Medical student";
    case "RETIRED_PHYSICIAN":
      return "Retired physician";
    case "PRACTICING_PHYSICIAN":
      return "Physician";
    default:
      return "Physician";
  }
}
