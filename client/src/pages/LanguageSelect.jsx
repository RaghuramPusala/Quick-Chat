import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// List of all languages
import isoLanguages from '../lib/languages'; // we’ll create this next

const LanguageSelect = () => {
  const { authUser, axios, setAuthUser } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser) {
      navigate('/login');
    } else if (authUser.language) {
      navigate('/profile');
    }
  }, [authUser]);

  const handleSubmit = async () => {
    if (!selectedLang) {
      toast.error('Please select a language');
      return;
    }

    try {
      const { data } = await axios.put('/api/auth/set-language', { language: selectedLang });
      if (data.success) {
        setAuthUser((prev) => ({ ...prev, language: selectedLang }));
        navigate('/profile');
      } else {
        toast.error(data.message || 'Failed to update language');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredLanguages = isoLanguages.filter((lang) =>
    lang.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h1 className="text-2xl font-bold mb-4">Select Your Preferred Language</h1>
      <input
        type="text"
        placeholder="Search language..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="p-2 mb-3 w-full max-w-md rounded bg-gray-800 text-white border border-gray-600"
      />
      <select
        value={selectedLang}
        onChange={(e) => setSelectedLang(e.target.value)}
        className="p-2 w-full max-w-md rounded bg-gray-800 text-white border border-gray-600 mb-4"
        size={6}
      >
        {filteredLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleSubmit}
        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
      >
        Continue
      </button>
    </div>
  );
};

export default LanguageSelect;
