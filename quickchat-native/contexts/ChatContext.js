import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import axios from "../lib/axios";
import { AuthContext } from "./AuthContext";
import { translateMessage } from "../lib/translate";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logoutAndClearHelper } from "../lib/logoutHelper";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { authUser, token, socket, logout } = useContext(AuthContext);

  const [selectedUser, setSelectedUserRaw] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [readUsers, setReadUsers] = useState([]);
  const [firstUnreadMessageIds, setFirstUnreadMessageIds] = useState({});

  const [isTyping, setIsTyping] = useState(false); // ✅ New state
  const typingTimeoutRef = useRef(null); // ✅ New ref

  useEffect(() => {
    const loadStoredData = async () => {
      if (!authUser?._id) return;
      const [lm, um, ru, fum] = await Promise.all([
        AsyncStorage.getItem(`lastMessages:${authUser._id}`),
        AsyncStorage.getItem(`unseenMessages:${authUser._id}`),
        AsyncStorage.getItem(`readUsers:${authUser._id}`),
        AsyncStorage.getItem(`firstUnreadIds:${authUser._id}`),
      ]);
      if (lm) setLastMessages(JSON.parse(lm));
      if (um) setUnseenMessages(JSON.parse(um));
      if (ru) setReadUsers(JSON.parse(ru));
      if (fum) setFirstUnreadMessageIds(JSON.parse(fum));
    };
    loadStoredData();
  }, [authUser]);

  const persist = async (key, value) => {
    if (!authUser?._id) return;
    await AsyncStorage.setItem(`${key}:${authUser._id}`, JSON.stringify(value));
  };

  const persistLastMessages = (updated) => {
    setLastMessages(updated);
    persist("lastMessages", updated);
  };

  const persistUnseenMessages = (updated) => {
    setUnseenMessages(updated);
    persist("unseenMessages", updated);
  };

  const persistReadUsers = (updated) => {
    setReadUsers(updated);
    persist("readUsers", updated);
  };

  const persistFirstUnreadMessageIds = (updated) => {
    setFirstUnreadMessageIds(updated);
    persist("firstUnreadIds", updated);
  };

  const clearChatData = async () => {
    setSelectedUserRaw(null);
    setMessages([]);
    setUsers([]);
    setUnseenMessages({});
    setOnlineUsers([]);
    setLastMessages({});
    setReadUsers([]);
    setFirstUnreadMessageIds({});
    if (authUser?._id) {
      await AsyncStorage.multiRemove([
        `lastMessages:${authUser._id}`,
        `unseenMessages:${authUser._id}`,
        `readUsers:${authUser._id}`,
        `firstUnreadIds:${authUser._id}`,
      ]);
    }
  };

  const logoutAndClear = async () => {
    await logoutAndClearHelper({ logout, authUser });
    await clearChatData();
  };

  const getUsers = async () => {
    try {
      const res = await axios.get("/api/message/users", {
        headers: { token },
      });
      setUsers(res.data.users);

      if (res.data.unseenMessages) {
        persistUnseenMessages(res.data.unseenMessages);
      }

      const fetchedLastMessages = {};
      await Promise.all(
        res.data.users.map(async (user) => {
          try {
            const msgRes = await axios.get(`/api/message/${user._id}`, {
              headers: { token },
            });
            const msgs = msgRes.data.messages;
            if (msgs.length > 0) {
              fetchedLastMessages[user._id] = msgs[msgs.length - 1];
            }
          } catch (err) {
            console.error(`Failed last msg for ${user._id}:`, err.message);
          }
        })
      );
      persistLastMessages(fetchedLastMessages);
    } catch (err) {
      console.error("getUsers error:", err?.message);
    }
  };

  const getMessages = async (receiverId) => {
    try {
      const res = await axios.get(`/api/message/${receiverId}`, {
        headers: { token },
      });
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Fetching messages failed:", err?.message);
    }
  };

  const sendMessage = async ({ text = "", image = "" }) => {
    if (!selectedUser) return;
    try {
      const res = await axios.post(
        `/api/message/send/${selectedUser._id}`,
        { text, image },
        { headers: { token } }
      );
      const newMessage = res.data.newMessage;
      setMessages((prev) => [...prev, newMessage]);

      const updated = {
        ...lastMessages,
        [selectedUser._id]: newMessage,
      };
      persistLastMessages(updated);

      socket?.emit("send-message", newMessage);
    } catch (err) {
      console.error("SendMessage Error:", err.message);
    }
  };

  const setSelectedUser = async (user) => {
    setSelectedUserRaw(user);

    const updatedUnseen = { ...unseenMessages };
    if (updatedUnseen[user._id]) {
      delete updatedUnseen[user._id];
      setUnseenMessages(updatedUnseen);
      persist("unseenMessages", updatedUnseen);
    }

    const updatedRead = [...new Set([...readUsers, user._id])];
    setReadUsers(updatedRead);
    persistReadUsers(updatedRead);

    if (firstUnreadMessageIds[user._id]) {
      const updated = { ...firstUnreadMessageIds };
      delete updated[user._id];
      setFirstUnreadMessageIds(updated);
      persistFirstUnreadMessageIds(updated);
    }
  };

  useEffect(() => {
    if (authUser && socket) {
      socket.emit("add-user", authUser._id);
    }
  }, [authUser, socket]);

  useEffect(() => {
    if (!socket || !authUser) return;

    const handleIncomingMessage = async (msg) => {
      const isSender = msg.senderId === authUser._id;
      const otherUserId = isSender ? msg.receiverId : msg.senderId;

      const updated = {
        ...lastMessages,
        [otherUserId]: msg,
      };
      persistLastMessages(updated);

      const isCurrentChat = selectedUser && selectedUser._id === otherUserId;

      if (isCurrentChat) {
        setMessages((prev) => [...prev, msg]);

        const fromLang = msg.language || selectedUser?.language || "en";
        const toLang = authUser.language || "en";

        if (msg.text && fromLang && toLang && fromLang !== toLang) {
          try {
            const translated = await translateMessage(msg.text, fromLang, toLang);
            if (translated && translated !== msg.text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m._id === msg._id ? { ...m, text: translated } : m
                )
              );
            }
          } catch (err) {
            console.error("Translation failed:", err?.response?.data || err.message);
          }
        }
      } else {
        setUnseenMessages((prev) => {
          const updatedUnseen = {
            ...prev,
            [msg.senderId]: (prev[msg.senderId] || 0) + 1,
          };
          persistUnseenMessages(updatedUnseen);
          return updatedUnseen;
        });

        setFirstUnreadMessageIds((prev) => {
          if (!prev[msg.senderId]) {
            const updated = { ...prev, [msg.senderId]: msg._id };
            persistFirstUnreadMessageIds(updated);
            return updated;
          }
          return prev;
        });
      }
    };

    const handleTyping = ({ from }) => {
      if (selectedUser && from === selectedUser._id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    socket.on("newMessage", handleIncomingMessage);
    socket.on("getOnlineUsers", setOnlineUsers);
    socket.on("typing", handleTyping); // ✅ Add listener

    return () => {
      socket.off("newMessage", handleIncomingMessage);
      socket.off("getOnlineUsers");
      socket.off("typing", handleTyping); // ✅ Clean up
    };
  }, [socket, authUser, selectedUser]);

  return (
    <ChatContext.Provider
      value={{
        selectedUser,
        setSelectedUser,
        messages,
        sendMessage,
        getMessages,
        getUsers,
        users,
        unseenMessages,
        setUnseenMessages,
        onlineUsers,
        lastMessages,
        readUsers,
        clearChatData,
        logoutAndClear,
        firstUnreadMessageIds,
        isTyping, // ✅ Exposed to use in ChatScreen.jsx
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
