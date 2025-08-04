// src/utils/token.ts
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  exp: number;
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const { exp } = jwtDecode<TokenPayload>(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true; // Si no se puede decodificar, lo tratamos como expirado
  }
};

export const getTokenTimeLeft = (token: string): number | null => {
  try {
    const { exp } = jwtDecode<TokenPayload>(token);
    return exp * 1000 - Date.now(); // en ms
  } catch {
    return null;
  }
};

export const decodeToken = <T = TokenPayload>(token: string): T | null => {
  try {
    return jwtDecode<T>(token);
  } catch {
    return null;
  }
};
