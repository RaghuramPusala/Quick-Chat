// quickchat-native/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "../lib/axios";
import { io } from "socket.io-client";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        if (storedToken) {
          const res = await axios.get("/api/auth/check", {
            headers: { token: storedToken },
          });

          if (res.data.success) {
            setAuthUser(res.data.user);
            setToken(storedToken);

            const newSocket = io("https://quick-chat-backend-yceh.onrender.com", {
              transports: ["websocket"],
              query: { userId: res.data.user._id },
            });
            setSocket(newSocket);
            newSocket.emit("add-user", res.data.user._id);
          }
        }
      } catch (err) {
        console.log("Auth check failed:", err?.response?.data || err.message);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const refreshUser = async () => {
    try {
      const res = await axios.get("/user/me");
      setAuthUser(res.data.user);
    } catch (err) {
      console.error("Refresh failed:", err?.response?.data || err.message);
    }
  };

  const signup = async (userData) => {
    try {
      const res = await axios.post("/api/auth/signup", userData);
      if (res.data.success) {
        await AsyncStorage.setItem("token", res.data.token);
        setAuthUser(res.data.userData);
        setToken(res.data.token);

        const newSocket = io("https://quick-chat-backend-yceh.onrender.com", {
          transports: ["websocket"],
          query: { userId: res.data.userData._id },
        });
        setSocket(newSocket);
        newSocket.emit("add-user", res.data.userData._id);

        return { success: true };
      } else {
        return { success: false, message: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Signup failed",
      };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      if (res.data.success) {
        await AsyncStorage.setItem("token", res.data.token);
        setAuthUser(res.data.userData);
        setToken(res.data.token);

        const newSocket = io("https://quick-chat-backend-yceh.onrender.com", {
          transports: ["websocket"],
          query: { userId: res.data.userData._id },
        });
        setSocket(newSocket);
        newSocket.emit("add-user", res.data.userData._id);

        return { success: true };
      } else {
        return { success: false, message: res.data.message };
      }
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setAuthUser(null);
    setToken(null);
    socket?.disconnect();
    setSocket(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        setAuthUser,
        token,
        loading,
        login,
        signup,
        logout,
        socket,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
