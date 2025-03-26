// context/AuthContext.js
import { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData.user));
    localStorage.setItem("token", userData.token);
    setUser(userData.user);
    queryClient.removeQueries(); // Clear all queries on login
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    queryClient.removeQueries(); // Clear all queries on logout
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}