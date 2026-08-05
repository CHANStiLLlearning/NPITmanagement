import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (access_token: string, refresh_token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));

  useEffect(() => {
    // Axios interceptor for refresh token
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const res = await axios.post('http://localhost:8000/auth/refresh', { refresh_token: refreshToken });
              const { access_token, refresh_token: new_refresh_token } = res.data;
              localStorage.setItem('access_token', access_token);
              localStorage.setItem('refresh_token', new_refresh_token);
              axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
              setToken(access_token);
              originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
              return axios(originalRequest);
            } catch (err) {
              logout();
            }
          } else {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('access_token', token);
      
      axios.get('http://localhost:8000/users/me')
        .then(response => setUser(response.data))
        .catch(() => logout());
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, [token]);

  const login = (access_token: string, refresh_token: string) => {
    localStorage.setItem('refresh_token', refresh_token);
    setToken(access_token);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
