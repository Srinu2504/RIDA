import type { DefaultSession } from "next-auth";

export type Role =
  | "MEDICAL_STUDENT"
  | "PRACTICING_PHYSICIAN"
  | "RETIRED_PHYSICIAN";

export function isClinicalRole(role: Role | string) {
  return role === "PRACTICING_PHYSICIAN" || role === "RETIRED_PHYSICIAN";
}

/** Roles that complete onboarding via doctorProfiles (ProfileWizard). */
export function canCreateDoctorProfile(role: Role | string) {
  return (
    role === "MEDICAL_STUDENT" ||
    role === "PRACTICING_PHYSICIAN" ||
    role === "RETIRED_PHYSICIAN"
  );
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
  role?: Role | string;
  firstName?: string;
  lastName?: string;
  specialty?: string;
  hospitalName?: string;
  university?: string;
  college?: string;
  city?: string;
  country?: string;
  profilePhoto?: string | null;
  connections: number;
  pending: number;
}

export interface TrendingPost {
  id: string;
  tag: string;
  body: string;
  imageUrl?: string | null;
  likeCount: number | null;
  commentCount: number | null;
  createdAt: string | Date | null;
  authorId: string;
  authorName: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface DoctorSearchResult {
  userId: string;
  role?: Role | string;
  firstName: string;
  lastName: string;
  profilePhoto: string | null;
  specialty: string;
  hospitalName: string | null;
  university?: string | null;
  college?: string | null;
  city: string;
  country: string;
  yearsOfExperience: number;
  gender: string | null;
  connectionStatus?: ConnectionStatus | null;
}
