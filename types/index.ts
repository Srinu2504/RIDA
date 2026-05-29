import type { DefaultSession } from "next-auth";

export type Role =
  | "MEDICAL_STUDENT"
  | "PRACTICING_PHYSICIAN"
  | "RETIRED_PHYSICIAN";

export function isClinicalRole(role: Role | string) {
  return role === "PRACTICING_PHYSICIAN" || role === "RETIRED_PHYSICIAN";
}
export type ConnectionStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
export type ProfileVisibility = "PUBLIC" | "CONNECTIONS_ONLY";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      fullName: string;
      isEmailVerified: boolean;
      isProfileComplete: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    role: Role;
    fullName: string;
    isEmailVerified: boolean;
    isProfileComplete: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    fullName: string;
    isEmailVerified: boolean;
    isProfileComplete: boolean;
  }
}

export interface HeroStripData {
  fullName: string;
  firstName?: string;
  lastName?: string;
  specialty?: string;
  hospitalName?: string;
  profilePhoto?: string | null;
  connections: number;
  pending: number;
}

export interface DoctorSearchResult {
  userId: string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
  specialty: string;
  hospitalName: string | null;
  city: string;
  country: string;
  yearsOfExperience: number;
  gender: string | null;
  connectionStatus?: ConnectionStatus | null;
}
