import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

const backendUrl = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: userData._id },
    });

    newSocket.connect();
    setSocket(newSocket);
    window.socket = newSocket;

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Auth check failed");
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    }
  }, [token]);

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["token"] = data.token;
        await checkAuth();
        toast.success(data.message);
        return data;
      } else {
        throw new Error(data.message || "Login/Signup failed");
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        (state === "signup"
          ? "Email already taken"
          : "Wrong password or user not found");
      toast.remove(); // ✅ Prevent duplicate toast
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    socket?.disconnect();
    toast.success("Logged out successfully");
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        axios,
        authUser,
        setAuthUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
