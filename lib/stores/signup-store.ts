import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types";

interface SignupState {
  email: string;
  fullName: string;
  role: Role;
  setSignupData: (data: { email: string; fullName: string; role: Role }) => void;
  clear: () => void;
}

export const useSignupStore = create<SignupState>()(
  persist(
    (set) => ({
      email: "",
      fullName: "",
      role: "PRACTICING_PHYSICIAN",
      setSignupData: (data) => set(data),
      clear: () =>
        set({ email: "", fullName: "", role: "PRACTICING_PHYSICIAN" }),
    }),
    { name: "rida-signup" }
  )
);
