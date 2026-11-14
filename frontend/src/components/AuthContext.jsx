import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getMemberIdFromToken, setApiToken } from "../lib/api";

export const AuthContext = createContext(null);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export const AuthProvider = ({ children }) => {
  // Keep the bearer token in memory. It is intentionally not persisted in localStorage.
  const [token, setTokenState] = useState(null);
  const setToken = useCallback((nextToken) => {
    const safeToken = typeof nextToken === "string" && nextToken.trim() ? nextToken : null;
    setApiToken(safeToken);
    setTokenState(safeToken);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setToken(null);
    window.addEventListener("bugtracker:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("bugtracker:unauthorized", handleUnauthorized);
  }, [setToken]);

  const value = useMemo(() => ({
    token,
    setToken,
    memberId: getMemberIdFromToken(token),
    loading: false,
    signOut: () => setToken(null),
  }), [token, setToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};