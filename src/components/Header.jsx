import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ isAuthenticated, currentUser, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update app state
    setIsAuthenticated(false);
    
    // Redirect to login
    navigate('/login');
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-brain h-5 w-5 text-white">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path>
              </svg>
            </div>
            <h1 
              className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => navigate('/')}
            >
              EmotionSense
            </h1>
          </motion.div>
          
          <motion.nav
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex space-x-6 items-center"
          >
            {isAuthenticated ? (
              <>
                <a 
                  href="#" 
                  className={`text-black hover:text-primary-600 transition-colors ${location.pathname === '/dashboard' ? 'text-primary-600 font-medium' : ''} text-lg font-medium`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/dashboard');
                  }}
                >
                  Home
                </a>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {currentUser?.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover cursor-pointer"
                        onClick={handleProfileClick}
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer"
                        onClick={handleProfileClick}
                      >
                        <span className="text-white text-sm">
                          {currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="font-bold text-base text-indigo-600">{currentUser?.username || 'User'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-black-600 hover:text-red-500 transition-colors text-base font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <a 
                  href="#" 
                  className={`text-gray-600 hover:text-primary-600 transition-colors ${location.pathname === '/login' ? 'text-primary-600 font-medium' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/login');
                  }}
                >
                  Login
                </a>
                <a 
                  href="#" 
                  className={`text-gray-600 hover:text-primary-600 transition-colors ${location.pathname === '/register' ? 'text-primary-600 font-medium' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/register');
                  }}
                >
                  Register
                </a>
              </>
            )}
          </motion.nav>
        </div>
        
        {/* Marquee Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="overflow-hidden whitespace-nowrap py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500 -mb-2"
        >
          <div 
            className="inline-block"
            style={{ 
              animation: 'marquee 30s linear infinite',
              display: 'inline-block'
            }}
          >
            <span className="mx-4 text-xs text-gray-700 font-medium">
              🚀 Real-time Emotion Detection • 🛡️ Secure Data Processing • 🎯 Accurate Sentiment Analysis • ⚡ Fast Results • 💾 Privacy Focused
            </span>
            <span className="mx-4 text-xs text-gray-700 font-medium">
              🚀 Real-time Emotion Detection • 🛡️ Secure Data Processing • 🎯 Accurate Sentiment Analysis • ⚡ Fast Results • 💾 Privacy Focused
            </span>
          </div>
        </motion.div>
      </div>
      
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </header>
  );
};

export default Header;