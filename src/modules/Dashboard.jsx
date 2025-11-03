import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FaceModule from './FaceModule';
import TextModule from './TextModule';
import VoiceModule from './VoiceModule';

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('face');

  // Updated modules array to include text detection
  const modules = [
    { 
      id: 'face', 
      name: 'Face Detection', 
      icon: '😊',
      description: 'Real-time emotion detection from webcam',
      color: 'from-blue-500 to-purple-600',
      shadow: 'shadow-blue-500/30'
    },
    {
      id: 'text',
      name: 'Text Analysis',
      icon: '📝',
      description: 'Sentiment analysis from text input',
      color: 'from-green-500 to-teal-600',
      shadow: 'shadow-green-500/30'
    },
    {
      id: 'voice',
      name: 'Voice Analysis',
      icon: '🎤',
      description: 'Sentiment analysis from voice input',
      color: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/30'
    }
  ];

  const renderModule = () => {
    // Updated switch statement to include text module
    switch (activeModule) {
      case 'face':
        return <FaceModule />;
      case 'text':
        return <TextModule />;
      case 'voice':
        return <VoiceModule />;
      default:
        return <FaceModule />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-[-1]" 
        style={{ 
          backgroundImage: "url('/_108243428_gettyimages-871148930.jpg.webp')",
          opacity: 0.3,
          backgroundAttachment: 'fixed'
        }} 
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Face,Text & Voice Emotion Detection
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Analyze emotions through face expressions and text sentiment with cutting-edge AI technology
          </motion.p>
        </div>

        {/* Stats Cards - Updated to show both face and text emotions */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30 mx-auto w-full max-w-md">
            <div className="flex items-center">
              <div className="text-3xl mr-4">😊</div>
              <div>
                <h3 className="text-2xl font-bold">7</h3>
                <p className="text-blue-100">Face Emotions</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/30 mx-auto w-full max-w-md">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📝</div>
              <div>
                <h3 className="text-2xl font-bold">3</h3>
                <p className="text-green-100">Text Sentiments</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-500/30 mx-auto w-full max-w-md">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎤</div>
              <div>
                <h3 className="text-2xl font-bold">7</h3>
                <p className="text-purple-100">Voice Sentiments</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Module Navigation - Updated to show both face and text detection */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {modules.map((module, index) => (
            <motion.button
              key={module.id}
              whileHover={{ y: -5, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveModule(module.id)}
              className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-300 w-48 h-48 ${
                activeModule === module.id
                  ? `bg-gradient-to-br ${module.color} text-white shadow-xl ${module.shadow}`
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
            >
              <motion.div
                animate={activeModule === module.id ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="text-5xl mb-4"
              >
                {module.icon}
              </motion.div>
              <h3 className={`text-xl font-bold mb-2 ${activeModule === module.id ? 'text-white' : 'text-gray-900'}`}>
                {module.name}
              </h3>
              <p className={`text-center text-sm ${activeModule === module.id ? 'text-white/90' : 'text-gray-600'}`}>
                {module.description}
              </p>
            </motion.button>
          ))}
        </motion.div>

        {/* Module Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
            <div className="bg-white rounded-2xl p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeModule}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderModule()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <div className="inline-flex items-center bg-gray-100 rounded-full px-6 py-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-gray-600">AI models are running in real-time</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;