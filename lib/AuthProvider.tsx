import * as SecureStore from "expo-secure-store";
import React, { createContext, useEffect, useState } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
};

type AuthContextType = {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a GlobalProvider");
  }
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App ilk açıldığında çalışır
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        console.log("Token var mı:", token ? "Evet" : "Hayır");
        if (!token) {
          setIsLoggedIn(false);
          setIsAuthLoading(false);
          return;
        }

        const res = await fetch("http://localhost:3000/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Token invalid");

        const userData = await res.json();
        setUser(userData);
        setIsLoggedIn(true);
      } catch (err) {
        console.log("Auth init error:", err);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, setIsLoggedIn, user, setUser, isAuthLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
