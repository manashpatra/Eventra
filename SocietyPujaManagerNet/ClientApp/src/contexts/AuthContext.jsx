import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiPost, apiGet } from '../services/apiClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const parseJwtRole = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.role || parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('user_info');
      const token = localStorage.getItem('jwt_token');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (!parsed.role && token) {
          parsed.role = parseJwtRole(token);
        }
        return parsed;
      } else if (token) {
        const role = parseJwtRole(token);
        if (role) return { role };
      }
      return null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        try {
          const userData = await apiGet('/auth/me');
          if (userData && (userData.email || userData.userId)) {
            const role = userData.role || userData.Role || parseJwtRole(token);
            const userObj = {
              userId: userData.userId,
              email: userData.email,
              displayName: userData.displayName,
              role: role
            };
            setUser(userObj);
            localStorage.setItem('user_info', JSON.stringify(userObj));
          }
        } catch (e) {
          // If token valid, fallback to JWT claims
          const role = parseJwtRole(token);
          if (role) {
            setUser((prev) => prev ? { ...prev, role } : { role });
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await apiPost('/auth/login', { email, password });
    if (res && res.token) {
      localStorage.setItem('jwt_token', res.token);
      const role = res.role || res.Role || parseJwtRole(res.token);
      const userObj = {
        userId: res.userId,
        email: res.email,
        displayName: res.displayName,
        role: role
      };
      setUser(userObj);
      localStorage.setItem('user_info', JSON.stringify(userObj));
      return userObj;
    }
    throw new Error('Login failed');
  };

  const logout = async () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
