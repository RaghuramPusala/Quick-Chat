import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import isoLanguages from '../lib/languages';
import loginImage from '../assets/login-illustration.png';

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [language, setLanguage] = useState('');

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (currState === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    login(
      currState === "Sign up" ? 'signup' : 'login',
      currState === "Sign up"
        ? { fullName, email, password, bio, language }
        : { email, password }
    );
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center">
        
        {/* Left Image */}
        <div className="hidden md:flex w-1/2 items-center justify-center p-4">
          <img
            src={loginImage}
            alt="QuickChat"
            className="max-w-[85%] h-auto"
          />
        </div>

        {/* Right Form */}
        <form onSubmit={onSubmitHandler} className="w-full md:w-1/2 max-w-sm px-6 py-10 flex flex-col gap-4 text-sm">
          <h1 className="text-2xl font-semibold text-center mb-2 text-gray-800">QuickChat</h1>

          {currState === "Sign up" && !isDataSubmitted && (
            <input
              onChange={(e) => setFullName(e.target.value)}
              value={fullName}
              type="text"
              placeholder="Full Name"
              className="p-2.5 bg-gray-100 border border-gray-300 rounded-md"
              required
            />
          )}

          {!isDataSubmitted && (
            <>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type="email"
                placeholder="Email Address"
                className="p-2.5 bg-gray-100 border border-gray-300 rounded-md"
                required
              />
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type="password"
                placeholder="Password"
                className="p-2.5 bg-gray-100 border border-gray-300 rounded-md"
                required
              />
            </>
          )}

          {currState === "Sign up" && (
            <>
              {isDataSubmitted && (
                <textarea
                  onChange={(e) => setBio(e.target.value)}
                  value={bio}
                  rows={3}
                  placeholder="Write a short bio..."
                  className="p-2.5 bg-gray-100 border border-gray-300 rounded-md"
                  required
                />
              )}

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
                className="p-2.5 bg-gray-100 border border-gray-300 rounded-md"
              >
                <option value="" disabled>Select your preferred language</option>
                {isoLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>

              <p className="text-[11px] text-yellow-600 -mt-1">
                ⚠️ Once selected, you <strong>cannot change</strong> your language later.
              </p>
            </>
          )}

          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-md"
          >
            {currState === "Sign up" ? "Create Account" : "Log in"}
          </button>

          <div className="text-center text-xs text-gray-600">
            {currState === "Sign up" ? (
              <p>
                Already have an account?{' '}
                <span
                  onClick={() => {
                    setCurrState("Login");
                    setIsDataSubmitted(false);
                  }}
                  className="text-purple-600 cursor-pointer hover:underline"
                >
                  Log in
                </span>
              </p>
            ) : (
              <p>
                Don’t have an account?{' '}
                <span
                  onClick={() => setCurrState("Sign up")}
                  className="text-purple-600 cursor-pointer hover:underline"
                >
                  Sign up
                </span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
