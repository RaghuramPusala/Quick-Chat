import { createContext, useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [allMessages, setAllMessages] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  // Fetch user list and unseen counts
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch full message history with a specific user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setAllMessages((prev) => ({ ...prev, [userId]: data.messages }));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Send message to currently selected user
  const sendMessage = async (messageData) => {
    try {
      if (!selectedUser?._id) return;

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {
        setAllMessages((prev) => ({
          ...prev,
          [selectedUser._id]: [...(prev[selectedUser._id] || []), data.newMessage],
        }));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Listen to socket.io for new incoming messages
  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const senderId = newMessage.senderId;
      const isCurrent = selectedUser && selectedUser._id === senderId;

      // If user is currently chatting with sender, mark message as seen
      if (isCurrent) {
        newMessage.seen = true;
        axios.put(`/api/messages/mark/${newMessage._id}`);
      }

      // Add new message to the correct conversation
      setAllMessages((prev) => ({
        ...prev,
        [senderId]: [...(prev[senderId] || []), newMessage],
      }));

      // Update unseen count if not currently viewing that chat
      if (!isCurrent) {
        setUnseenMessages((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
    });
  };

  useEffect(() => {
    subscribeToMessages();
    return () => socket?.off("newMessage");
  }, [socket, selectedUser]);

  const value = {
    messages: selectedUser ? allMessages[selectedUser._id] || [] : [],
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
