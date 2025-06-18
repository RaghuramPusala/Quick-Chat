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
        { text, image },
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

        console.log('🔄 Incoming message for translation:', {
          text: msg.text,
          from: fromLang,
          to: toLang,
        });

        const translated = await translateMessage(msg.text, fromLang, toLang);
        const finalMessage = { ...msg, text: translated };

        if (msg.senderId === selectedUser?._id) {
          setMessages((prev) => [...prev, finalMessage]);
        } else {
          setUnseenMessages((prev) => ({
            ...prev,
            [msg.senderId]: (prev[msg.senderId] || 0) + 1,
          }));
        }
      } catch (error) {
        console.error('Translation failed:', error.message);
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
