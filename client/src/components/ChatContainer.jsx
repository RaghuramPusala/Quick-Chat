import React, { useRef, useState, useEffect, useContext } from 'react';
import assets from '../assets/assets';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import { formatMessage } from '../lib/utils';
import toast from 'react-hot-toast';

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
  } = useContext(ChatContext);

  const { authUser, onlineUsers, socket } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const scrollEnd = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const previousMessageCount = useRef(0);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveScroll = () => {
    if (selectedUser && messagesContainerRef.current) {
      const y = messagesContainerRef.current.scrollTop;
      localStorage.setItem(`scroll-${selectedUser._id}`, y);
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current || !selectedUser) return;
    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    saveScroll();
    const nearBottom = scrollHeight - scrollTop - clientHeight < 300;
    setIsUserAtBottom(nearBottom);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage({ text: input.trim() });
    setInput('');
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      scrollToBottom();
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      previousMessageCount.current = 0;
      if (socket) {
        socket.emit("markSeen", { from: authUser._id, to: selectedUser._id });
      }
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!messagesContainerRef.current || !selectedUser) return;
    const container = messagesContainerRef.current;
    const savedScroll = localStorage.getItem(`scroll-${selectedUser._id}`);
    const newMessageCount = messages.length;
    const diff = newMessageCount - previousMessageCount.current;
    previousMessageCount.current = newMessageCount;
    setTimeout(() => {
      if (savedScroll !== null && savedScroll !== '0') {
        container.scrollTop = parseInt(savedScroll);
      } else if (isUserAtBottom || diff >= 5) {
        scrollToBottom();
      }
    }, 0);
  }, [messages]);

  useEffect(() => {
    if (!selectedUser || !socket) return;
    const timeout = setTimeout(() => {
      socket.emit("typing", { to: selectedUser._id });
    }, 150);
    return () => clearTimeout(timeout);
  }, [input]);

  useEffect(() => {
    if (!socket || !selectedUser) return;
    const handleTyping = ({ from }) => {
      if (from === selectedUser._id) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        if (isUserAtBottom) scrollToBottom();
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };
    socket.on("typing", handleTyping);
    return () => socket.off("typing", handleTyping);
  }, [socket, selectedUser, isUserAtBottom]);

  useEffect(() => {
    if (!socket) return;
    socket.on("seenUpdate", ({ userId }) => {
      if (selectedUser?._id === userId) {
        getMessages(userId);
      }
    });
    return () => socket.off("seenUpdate");
  }, [socket, selectedUser]);

  const getStatus = () => {
    return onlineUsers.includes(selectedUser._id) ? 'Online' : 'Offline';
  };

  return selectedUser ? (
    <div className="relative h-[100dvh] max-h-[100dvh] overflow-hidden bg-white text-black">
      
      {/* ✅ Fixed Header */}
      <div className="fixed top-0 left-0 w-full border-b border-gray-200 px-4 py-3 bg-white z-20 flex items-center gap-3">
        <div className="relative">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt="User"
            className="w-9 rounded-full"
          />
          {onlineUsers.includes(selectedUser._id) && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-black text-base font-medium">{selectedUser.fullName}</p>
          <p className="text-xs text-gray-500">{getStatus()}</p>
        </div>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>

      {/* ✅ Scrollable Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="pt-[68px] pb-[70px] overflow-y-auto h-full"
      >
        {messages.map((msg, index) => {
          const isSender = msg.senderId === authUser._id;
          const isLast = index === messages.length - 1 && isSender;
          return (
            <div
              key={index}
              className={`flex items-end mb-2 px-4 ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[65%]">
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt="message"
                    className="rounded-lg border border-gray-400 mb-1"
                  />
                ) : (
                  <div
                    className={`px-4 py-2 rounded-lg text-sm break-words ${
                      isSender
                        ? 'bg-purple-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-black rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formatMessage(msg.createdAt)}{' '}
                  {isLast && msg.seen && (
                    <span className="text-green-500 ml-1">✔️ Seen</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {selectedUser && selectedUser._id !== authUser._id && isTyping && (
          <div className="flex items-end mb-2 justify-start px-4">
            <div className="max-w-[65%] bg-gray-200 text-black text-sm px-4 py-2 rounded-lg rounded-bl-none">
              <span className="flex items-center gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </span>
            </div>
          </div>
        )}

        <div ref={scrollEnd}></div>
      </div>

      {/* ✅ Fixed Input */}
      <div className="fixed bottom-0 left-0 w-full border-t border-gray-200 px-3 pt-2 pb-3 bg-white z-20">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-gray-100 px-3 py-2 rounded-full">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
              type="text"
              placeholder="Type a message"
              className="flex-1 bg-transparent text-sm text-black placeholder-gray-500 outline-none border-none"
            />
            <input
              type="file"
              id="image"
              accept="image/png, image/jpeg"
              hidden
              onChange={handleSendImage}
            />
            <label htmlFor="image" className="cursor-pointer">
              <img src={assets.gallery_icon} alt="Upload" className="w-5" />
            </label>
          </div>
          <img
            onClick={handleSendMessage}
            src={assets.send_button}
            alt="Send"
            className="w-7 cursor-pointer"
          />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 bg-white text-black h-full px-4">
      <img
        src={assets.login_illustration}
        className="w-40 opacity-120 hidden md:block"
        alt="icon"
      />
      <p className="text-lg font-medium hidden md:block">
        Chat anytime, anywhere
      </p>
    </div>
  );
};

export default ChatContainer;
