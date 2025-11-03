import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FaceDetection = ({ isModelLoaded }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedEmotions, setDetectedEmotions] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const imageRef = useRef(null);

  // Emotions data
  const emotions = [
    { name: 'Happy', color: 'bg-green-500', icon: '😊' },
    { name: 'Sad', color: 'bg-blue-500', icon: '😢' },
    { name: 'Angry', color: 'bg-red-500', icon: '😠' },
    { name: 'Surprised', color: 'bg-yellow-500', icon: '😲' },
    { name: 'Neutral', color: 'bg-gray-500', icon: '😐' },
    { name: 'Fear', color: 'bg-purple-500', icon: '😨' },
    { name: 'Disgust', color: 'bg-teal-500', icon: '🤢' }
  ];

  // Check if backend is accessible
  useEffect(() => {
    const checkBackend = async () => {
      try {
        // Using relative path for proxy to health check endpoint
        const response = await fetch('/health');
        if (response.ok) {
          setIsBackendConnected(true);
        } else {
          setIsBackendConnected(false);
        }
      } catch (err) {
        setIsBackendConnected(false);
      }
    };

    checkBackend();
    
    // Periodically check backend connection
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const startCamera = async () => {
    if (!isBackendConnected) {
      setCameraError('Flask backend is not accessible. Please ensure the Flask server is running.');
      return;
    }

    try {
      setCameraError(null);
      
      // Notify Flask backend to start processing (using proxy path)
      const response = await fetch('/start_camera');
      const data = await response.text();
      console.log('Camera start response:', data);
      
      if (!response.ok) {
        throw new Error(`Backend returned error: ${data}`);
      }
      
      // Small delay to ensure camera is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For the video feed, we'll use the image ref to display the stream (using proxy path)
      if (imageRef.current) {
        // Set the source to the Flask video feed endpoint (using proxy path)
        imageRef.current.src = '/video_feed';
        console.log('Setting image source to video feed');
      }
      
      setIsCameraActive(true);
    } catch (err) {
      console.error('Error starting camera:', err);
      setCameraError(`Could not start camera: ${err.message}. Please ensure the Flask backend is running and your webcam is available.`);
    }
  };

  const stopCamera = async () => {
    // Stop the video stream
    if (imageRef.current) {
      imageRef.current.src = '';
    }
    
    // Notify Flask backend to stop processing (using proxy path)
    try {
      const response = await fetch('/stop_camera');
      const data = await response.text();
      console.log('Camera stop response:', data);
    } catch (err) {
      console.error('Error stopping camera on backend:', err);
    }
    
    setIsCameraActive(false);
    setCurrentEmotion(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCameraActive) {
        stopCamera();
      }
    };
  }, [isCameraActive]);

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">EmotionSense</h2>
        <p className="text-gray-600">Detect emotions in real-time through your webcam</p>
        
        {/* Backend Connection Status */}
        <div className="mt-4">
          {isBackendConnected ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Flask Backend Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Flask Backend Not Connected
            </span>
          )}
        </div>
      </div>

      {!isModelLoaded ? (
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full mb-4"
          />
          <p className="text-gray-600">Loading emotion detection model...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Camera Feed */}
            <div className="md:w-2/3">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {!isCameraActive ? (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">📷</div>
                    <p>Camera is off</p>
                    <p className="text-sm mt-2">Click "Start Camera" to begin</p>
                    {cameraError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <p className="font-medium">Error:</p>
                        <p>{cameraError}</p>
                        <p className="text-sm mt-2">Make sure the Flask backend is running</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <img
                      ref={imageRef}
                      alt="Video Feed"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Error loading video feed:', e);
                        setCameraError('Error loading video feed. Please check that the backend is running and the camera is accessible.');
                      }}
                      onLoad={() => {
                        console.log('Video feed loaded successfully');
                      }}
                    />
                    
                    {/* Emotion Overlay */}
                    {currentEmotion && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{currentEmotion.icon}</span>
                          <div>
                            <div className="font-semibold">{currentEmotion.name}</div>
                            <div className="text-sm text-gray-600">{currentEmotion.confidence}% confidence</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex justify-center mt-6 space-x-4">
                {!isCameraActive ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startCamera}
                    disabled={!isBackendConnected}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isBackendConnected 
                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>📷</span>
                    <span>Start Camera</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopCamera}
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 shadow-lg transition-all duration-300"
                  >
                    <span>⏹️</span>
                    <span>Stop Camera</span>
                  </motion.button>
                )}
              </div>
              
              {cameraError && !isCameraActive && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <p className="font-medium">Camera Error:</p>
                  <p>{cameraError}</p>
                  <div className="mt-3 text-sm">
                    <p className="font-medium">Troubleshooting steps:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Ensure Flask backend is running</li>
                      <li>Check that your webcam is connected and accessible</li>
                      <li>Verify that your browser allows camera access</li>
                      <li>Make sure you're accessing the app via localhost or HTTPS</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Emotion Information */}
            <div className="md:w-1/3">
              <div className="bg-gray-50 rounded-lg p-5 h-full">
                <h3 className="font-semibold text-lg mb-4">Detected Emotions</h3>
                
                {currentEmotion ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg p-4 mb-6 ${currentEmotion.color.replace('500', '100')} border ${currentEmotion.color.replace('500', '200')}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{currentEmotion.icon}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentEmotion.color.replace('500', '200')} ${currentEmotion.color.replace('500', '800')}`}>
                        {currentEmotion.confidence}% confidence
                      </span>
                    </div>
                    <h4 className="font-bold text-xl">{currentEmotion.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Current emotion detected with high confidence
                    </p>
                  </motion.div>
                ) : (
                  <div className="rounded-lg p-4 mb-6 bg-gray-100 border border-gray-200">
                    <p className="text-gray-500 text-center py-4">No emotion detected yet</p>
                  </div>
                )}

                <h4 className="font-medium mb-3">Emotion History</h4>
                <div className="space-y-3">
                  <AnimatePresence>
                    {detectedEmotions.map((emotion, index) => (
                      <motion.div
                        key={`${emotion.name}-${emotion.timestamp}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{emotion.icon}</span>
                          <span className="font-medium">{emotion.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{emotion.confidence}%</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {detectedEmotions.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">Emotion history will appear here</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emotion Guide */}
          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Supported Emotions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
              {emotions.map((emotion) => (
                <motion.div
                  key={emotion.name}
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <span className="text-2xl mb-2">{emotion.icon}</span>
                  <span className="text-sm font-medium">{emotion.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FaceDetection;