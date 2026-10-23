"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  loginApi,
  registerApi,
  guestLoginApi,
  getMeApi,
  forgotPasswordApi,
  resetPasswordApi,
} from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on initial render
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("lakeclean_auth_token");
      const storedUser = localStorage.getItem("lakeclean_auth_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse stored auth session:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSession = (authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    try {
      localStorage.setItem("lakeclean_auth_token", authToken);
      localStorage.setItem("lakeclean_auth_user", JSON.stringify(authUser));
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("lakeclean_auth_token");
      localStorage.removeItem("lakeclean_auth_user");
    } catch (e) {
      // ignore
    }
  };

  const login = async (email, password, remember = false) => {
    const data = await loginApi(email, password, remember);
    saveSession(data.access_token, data.user);
    return data.user;
  };

  const register = async (email, password, displayName) => {
    const data = await registerApi(email, password, displayName);
    saveSession(data.access_token, data.user);
    return data.user;
  };

  const continueAsGuest = async () => {
    const data = await guestLoginApi();
    saveSession(data.access_token, data.user);
    return data.user;
  };

  const logout = () => {
    clearSession();
  };

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    try {
      const freshUser = await getMeApi();
      setUser(freshUser);
      localStorage.setItem("lakeclean_auth_user", JSON.stringify(freshUser));
      return freshUser;
    } catch (e) {
      console.warn("Could not refresh profile:", e);
      return null;
    }
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === "admin",
    isOperator: user?.role === "operator",
    isGuest: user?.role === "guest",
    role: user?.role || "anonymous",
    login,
    register,
    continueAsGuest,
    logout,
    refreshProfile,
    requestPasswordReset: forgotPasswordApi,
    resetPassword: resetPasswordApi,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
