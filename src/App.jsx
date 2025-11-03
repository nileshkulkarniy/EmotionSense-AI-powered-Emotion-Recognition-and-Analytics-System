import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './modules/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';

const App = () => {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if Flask backend is accessible
    const checkBackend = async () => {
      try {
        const response = await fetch('/health');
        if (response.ok) {
          setIsBackendConnected(true);
          console.log('Backend connected successfully');
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        setIsBackendConnected(false);
      }
    };

    checkBackend();
    
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
    }
    
    // Periodically check backend connection
    const interval = setInterval(checkBackend, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header isAuthenticated={isAuthenticated} currentUser={currentUser} setIsAuthenticated={setIsAuthenticated} />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />
              )
            } />
            <Route path="/register" element={
              isAuthenticated ? (
                <Navigate to="/dashboard" />
              ) : (
                <Register setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />
              )
            } />
            <Route path="/dashboard" element={
              isAuthenticated ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-center mb-8">
                    <motion.h1 
                      className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                       AI-powered Emotion Recognition and Analytics System
                    </motion.h1>
                    <motion.p 
                      className="text-xl text-gray-600 max-w-2xl mx-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      Detect emotions through face expressions and text sentiment in real-time
                    </motion.p>
                    
                    {/* Backend Connection Status */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-4"
                    >
                      {isBackendConnected ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Backend Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Backend Not Connected
                        </span>
                      )}
                    </motion.div>
                  </div>

                  <Dashboard />
                </motion.div>
              ) : (
                <Navigate to="/login" />
              )
            } />
            <Route path="/profile" element={
              isAuthenticated ? (
                <Profile currentUser={currentUser} />
              ) : (
                <Navigate to="/login" />
              )
            } />
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
};

export default App;