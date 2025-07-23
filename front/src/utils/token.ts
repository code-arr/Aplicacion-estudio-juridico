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
