import React, { useContext, useState, useEffect } from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import logo from '../assets/logo.png';

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    onlineUsers,
  } = useContext(ChatContext);

  const { logout, authUser } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  return (
    <div
      className={`bg-white h-full p-5 overflow-y-scroll text-gray-800 border-r ${
        selectedUser ? 'max-md:hidden' : ''
      }`}
    >
      {/* Logo & Menu */}
      <div className="pb-5 flex justify-between items-center relative">
        <img src={logo} alt="logo" className="max-w-35" />
        <div className="relative py-2">
          <img
            src={assets.menu_icon}
            alt="Menu"
            className="max-h-5 cursor-pointer"
            onClick={() => setShowMenu((prev) => !prev)}
          />
          {showMenu && (
            <div className="absolute top-full right-0 z-20 w-32 p-5 rounded-xl bg-gray-100 text-gray-800 shadow-md">
              <p
                onClick={() => {
                  navigate('/profile');
                  setShowMenu(false);
                }}
                className="cursor-pointer text-sm"
              >
                Edit Profile
              </p>
              <hr className="my-2 border-t border-gray-300" />
              <p
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="cursor-pointer text-sm"
              >
                Logout
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-100 rounded-full flex items-center gap-2 py-3 px-4 mt-5 border border-gray-300">
        <img src={assets.search_icon} alt="Search" className="w-3" />
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          className="bg-transparent border-none outline-none text-sm text-gray-700 flex-1 placeholder-gray-400"
          placeholder="Search User..."
        />
      </div>

      {/* User List */}
      <div className="flex flex-col mt-4">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => {
              setSelectedUser(user);
              setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
            }}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer hover:bg-gray-100 ${
              selectedUser?._id === user._id ? 'bg-gray-100' : ''
            }`}
          >
            <div className="relative">
              <img
                src={user.profilePic || assets.avatar_icon}
                alt=""
                className="w-[35px] h-[35px] rounded-full object-cover"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            <div className="flex flex-col leading-5">
              <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
              <span
                className={`text-xs ${
                  onlineUsers.includes(user._id)
                    ? 'text-green-500'
                    : 'text-gray-500'
                }`}
              >
                {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
              </span>
            </div>
            {unseenMessages[user._id] > 0 && (
              <p className="absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-purple-100 text-purple-600 font-semibold">
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
