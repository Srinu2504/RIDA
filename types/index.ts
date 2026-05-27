import type { DefaultSession } from "next-auth";

export type Role = "DOCTOR" | "PATIENT";
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
