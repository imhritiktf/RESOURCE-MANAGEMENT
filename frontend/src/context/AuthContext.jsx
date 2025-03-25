import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    console.log("Initializing user from localStorage:", storedUser); // Debugging
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (userData) => {
    console.log("Logging in user:", userData.user); // Debugging
    localStorage.setItem("user", JSON.stringify(userData.user));
    localStorage.setItem("token", userData.token);
    setUser(userData.user);
  };

  const logout = () => {
    console.log("Logging out user"); // Debugging
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
