import React, { useContext, useEffect, useState } from 'react';
import assets from '../assets/assets';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);

  useEffect(() => {
    if (selectedUser) {
      const filtered = messages
        .filter((msg) => msg.image && msg.senderId === selectedUser._id)
        .map((msg) => msg.image);
      setMsgImages(filtered);
    }
  }, [messages, selectedUser]);

  if (!selectedUser) return null;

  return (
    <div
      className={`bg-white text-gray-800 w-full relative overflow-y-scroll ${
        selectedUser ? 'max-md:hidden' : ''
      }`}
    >
      {/* Profile Info */}
      <div className="pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-20 aspect-square rounded-full mx-auto"
        />
        <h1 className="px-10 text-xl font-semibold text-gray-900 flex items-center gap-2">
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
          {selectedUser.fullName}
        </h1>
        <p className="px-10 text-gray-500 text-sm">{selectedUser.bio || 'No bio'}</p>
      </div>

      {/* Media Section */}
      <hr className="border-gray-300 my-4" />
      <div className="px-5 text-xs">
        <p className="text-gray-700 font-semibold mb-2">Media</p>
        <div className="max-h-[200px] overflow-y-auto grid grid-cols-3 gap-3">
          {msgImages.map((url, index) => (
            <div
              key={index}
              onClick={() => window.open(url)}
              className="cursor-pointer rounded overflow-hidden"
            >
              <img src={url} alt="" className="rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-10 rounded-full shadow-md"
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;
