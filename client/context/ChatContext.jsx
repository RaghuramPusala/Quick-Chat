import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { translateMessage } from '../src/lib/translate';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { authUser, token, socket } = useContext(AuthContext);

  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  const getUsers = async () => {
    try {
      const res = await axios.get('/api/message/users', {
        headers: { token },
      });
      setUsers(res.data.users);
      setUnseenMessages(res.data.unseenMessages || {});
    } catch (err) {
      console.error('getUsers error:', err.message);
    }
  };

  const getMessages = async (otherUserId) => {
    try {
      const res = await axios.get(`/api/message/${otherUserId}`, {
        headers: { token },
      });
      setMessages(res.data.messages);
    } catch (error) {
      console.error('Fetching messages failed:', error);
    }
  };

  const sendMessage = async ({ text = '', image = '' }) => {
    if (!selectedUser) return;

    try {
      const res = await axios.post(
        `/api/message/send/${selectedUser._id}`,
        { text, image, language: authUser.language },
        { headers: { token } }
      );

      const newMessage = res.data.newMessage;
      setMessages((prev) => [...prev, newMessage]);
      socket?.emit('send-message', newMessage);
    } catch (err) {
      console.error('SendMessage Error:', err.message);
    }
  };

  useEffect(() => {
    if (authUser && socket) {
      socket.emit('add-user', authUser._id);
    }
  }, [authUser, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = async (msg) => {
      const isSender = msg.senderId === authUser._id;

      if (isSender) {
        setMessages((prev) => [...prev, msg]);
        return;
      }

      try {
        const fromLang = msg.language || selectedUser?.language || 'en';
        const toLang = authUser.language;

        const translated = await translateMessage(msg.text, fromLang, toLang);
        const finalMessage = {
          ...msg,
          text: translated || msg.text,
        };

        if (msg.senderId === selectedUser?._id) {
          setMessages((prev) => [...prev, finalMessage]);

          // ✅ mark as seen if in same chat
          socket.emit("markSeen", { from: authUser._id, to: selectedUser._id });
        } else {
          setUnseenMessages((prev) => ({
            ...prev,
            [msg.senderId]: (prev[msg.senderId] || 0) + 1,
          }));
        }
      } catch (error) {
        console.error('❌ Translation failed:', error.message);
        if (msg.senderId === selectedUser?._id) {
          setMessages((prev) => [...prev, msg]);
        }
      }
    };

    socket.on('newMessage', handleIncomingMessage);
    socket.on('getOnlineUsers', setOnlineUsers);

    return () => {
      socket.off('newMessage', handleIncomingMessage);
      socket.off('getOnlineUsers');
    };
  }, [selectedUser, socket, authUser]);

  // ✅ Real-time seen updates
  useEffect(() => {
    if (!socket) return;

    const handleSeenUpdate = ({ userId }) => {
      if (selectedUser?._id === userId) {
        getMessages(userId);
      }
    };

    socket.on("seenUpdate", handleSeenUpdate);
    return () => socket.off("seenUpdate", handleSeenUpdate);
  }, [socket, selectedUser]);

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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
