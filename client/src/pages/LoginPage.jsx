import React, { useState, useContext } from 'react';
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';
import isoLanguages from '../lib/languages';

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
      currState === "Sign up"
        ? 'signup'
        : 'login',
      currState === "Sign up"
        ? { fullName, email, password, bio, language }
        : { email, password }
    );
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl px-4'>
      {/* Left Section */}
      <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)] drop-shadow-2xl' />

      {/* Right Section */}
      <form onSubmit={onSubmitHandler} className='bg-white/10 text-white border border-gray-500 p-6 flex flex-col gap-6 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-xl'>

        {/* Form Heading */}
        <h2 className='font-semibold text-3xl flex justify-between items-center'>
          {currState}
          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt=""
              className='w-5 cursor-pointer'
            />
          )}
        </h2>

        {/* Full Name */}
        {currState === "Sign up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            className='p-3 bg-white/10 border border-gray-600 rounded-lg focus:outline-none placeholder:text-gray-400'
            placeholder="Full Name"
            required
          />
        )}

        {/* Email & Password */}
        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Email Address"
              required
              className='p-3 bg-white/10 border border-gray-600 rounded-lg focus:outline-none placeholder:text-gray-400'
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="Password"
              required
              className='p-3 bg-white/10 border border-gray-600 rounded-lg focus:outline-none placeholder:text-gray-400'
            />
          </>
        )}

        {/* Bio */}
        {currState === "Sign up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            className='p-3 bg-white/10 border border-gray-600 rounded-lg focus:outline-none placeholder:text-gray-400'
            placeholder='Provide a short bio...'
            required
          ></textarea>
        )}

        {/* Terms & Language Selection */}
        <div className="flex flex-col gap-3 text-sm text-gray-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" required className='accent-violet-600'/>
            <span>Agree to the terms of use & privacy policy.</span>
          </label>

          <select
            required
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/10 border border-gray-600 text-white rounded-lg p-2 focus:outline-none"
          >
            <option value="" disabled>
              Select your preferred language
            </option>
            {isoLanguages.map((lang) => (
              <option key={lang.code} value={lang.code} className='text-black'>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button type='submit' className='py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 transition-opacity text-white font-semibold rounded-lg'>
          {currState === "Sign up" ? "Create Account" : "Login Now"}
        </button>

        {/* Toggle Form */}
        <div className='text-sm text-gray-300 text-center'>
          {currState === "Sign up" ? (
            <p>
              Already have an account?{' '}
              <span
                onClick={() => {
                  setCurrState("Login");
                  setIsDataSubmitted(false);
                }}
                className="font-medium text-violet-400 hover:underline cursor-pointer"
              >
                Login here
              </span>
            </p>
          ) : (
            <p>
              Create an account{' '}
              <span
                onClick={() => setCurrState("Sign up")}
                className="font-medium text-violet-400 hover:underline cursor-pointer"
              >
                Click here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;