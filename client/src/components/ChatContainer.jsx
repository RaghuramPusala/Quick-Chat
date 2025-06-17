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

  const { authUser, onlineUsers } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const scrollEnd = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const scrollPositions = useRef({});

  const scrollToBottom = () => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current || !selectedUser) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    scrollPositions.current[selectedUser._id] = scrollTop;
    setIsUserAtBottom(scrollHeight - scrollTop - clientHeight < 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage({ text: input.trim() });
    setInput('');
    if (isUserAtBottom) scrollToBottom();
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
      if (isUserAtBottom) scrollToBottom();
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!messagesContainerRef.current || !selectedUser) return;

    const container = messagesContainerRef.current;
    const lastScroll = scrollPositions.current[selectedUser._id] || 0;

    const shouldRestore =
      container.scrollHeight - container.scrollTop - container.clientHeight > 200;

    setTimeout(() => {
      if (shouldRestore) {
        container.scrollTop = lastScroll;
      } else if (isUserAtBottom) {
        scrollToBottom();
      }
    }, 0);
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-hidden relative bg-white text-black">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 px-4 border-b border-gray-200 bg-white">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-black text-base font-medium flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-4"
      >
        {messages.map((msg, index) => {
          const isSender = msg.senderId === authUser._id;
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
                  {formatMessage(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-white p-3 flex items-center gap-3 border-t border-gray-200">
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
