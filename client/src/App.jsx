import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/Homepage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import LanguageSelect from './pages/LanguageSelect';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const App = () => {
  const { authUser } = useContext(AuthContext);
  const needsLangSelect = authUser && !authUser.language;

  return (
    <div className="bg-[url('/bgImage.svg')] bg-contain min-h-screen">
      <Toaster />
      <Routes>
        {/* Home Route */}
        <Route
          path="/"
          element={
            authUser ? (
              needsLangSelect ? <Navigate to="/language" /> : <HomePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Login Route */}
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : (
            needsLangSelect ? <Navigate to="/language" /> : <Navigate to="/" />
          )}
        />

        {/* Profile Route */}
        <Route
          path="/profile"
          element={
            authUser ? (
              needsLangSelect ? <Navigate to="/language" /> : <ProfilePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Language Select Route */}
        <Route
          path="/language"
          element={
            authUser ? (
              authUser.language ? <Navigate to="/" /> : <LanguageSelect />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default App;