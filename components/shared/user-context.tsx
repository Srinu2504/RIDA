"use client";

import { createContext, useContext } from "react";

export interface AppUser {
  id: string;
  fullName: string;
}

const UserContext = createContext<AppUser | null>(null);

export function AppUserProvider({
  user,
  children,
}: {
  user: AppUser | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
