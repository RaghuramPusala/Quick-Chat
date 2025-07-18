import React, { useRef, useState, useEffect, useContext } from 'react';
import assets from '../assets/assets';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import { formatMessage } from '../lib/utils';
import toast from 'react-hot-toast';
import loginImage from '../assets/login-illustration.png';

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
    <div className="h-full overflow-hidden relative bg-white text-black flex flex-col">
      {/* Header - always visible */}
      <div className="shrink-0 flex items-center gap-3 py-3 px-4 border-b border-gray-200 bg-white z-10">
        <div className="relative">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt=""
            className="w-9 rounded-full"
          />
          {onlineUsers.includes(selectedUser._id) && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-black text-base font-medium">
            {selectedUser.fullName}
          </p>
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

      {/* Messages - scrollable */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4"
      >
        {messages.map((msg, index) => {
          const isSender = msg.senderId === authUser._id;
          const isLast = index === messages.length - 1 && isSender;
          return (
            <div
              key={index}
              className={`flex items-end mb-2 ${isSender ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[65%]">
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt="message"
                    className="rounded-lg border border-gray-400 mb-1 max-w-full"
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
                  {isLast && msg.seen && <span className="text-green-500 ml-1">✔️ Seen</span>}
                </p>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {!selectedUser || selectedUser._id === authUser._id || !isTyping ? null : (
          <div className="flex items-end mb-2 justify-start">
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

      {/* Input - stays above keyboard */}
      <div className="shrink-0 bg-white px-3 pt-2 pb-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-gray-100 px-3 py-2 rounded-full">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
              type="text"
              placeholder="Type a message"
              className="flex-1 bg-transparent text-sm text-black placeholder-gray-500 outline-none border-none min-h-[36px] cursor-text"
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
        src={loginImage}
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