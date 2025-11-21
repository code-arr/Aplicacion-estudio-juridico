// src/types/AuthState.ts
import type { User } from "./User";

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoadingSession: boolean;
  isAdmin: boolean;
  isLawyer: boolean;
  refreshSession: () => Promise<void>;
  login: (user: User, token: string) => void;
  logout: () => void;
  showInactivityModal: boolean;
  setShowInactivityModal: (show: boolean) => void;
  reset: () => void;
}
