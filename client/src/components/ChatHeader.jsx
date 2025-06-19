import React, { useContext } from 'react';
import assets from '../assets/assets';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useContext(ChatContext);
  const { onlineUsers } = useContext(AuthContext);

  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="shrink-0 border-b border-gray-200 px-4 py-3 bg-white flex items-center gap-3 z-10">
      <div className="relative">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt="User"
          className="w-9 rounded-full"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-black text-base font-medium">{selectedUser.fullName}</p>
        <p className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</p>
      </div>
      <img
        onClick={() => setSelectedUser(null)}
        src={assets.arrow_icon}
        alt="Back"
        className="md:hidden max-w-7 cursor-pointer"
      />
      <img
        src={assets.help_icon}
        alt="Help"
        className="max-md:hidden max-w-5"
      />
    </div>
  );
};

export default ChatHeader;
