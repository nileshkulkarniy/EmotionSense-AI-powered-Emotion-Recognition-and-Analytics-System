import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FaceModule = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [emotionData, setEmotionData] = useState(null);
  const [error, setError] = useState(null);
  const [chartUpdateKey, setChartUpdateKey] = useState(0); // For forcing chart re-render
  const [dominantEmotion, setDominantEmotion] = useState(null); // New state for dominant emotion
  const videoRef = useRef(null);

  // Emotion data for visualization
  const emotionColors = {
    'Angry': 'bg-red-500',
    'Disgust': 'bg-green-500',
    'Fear': 'bg-purple-500',
    'Happy': 'bg-yellow-500',
    'Neutral': 'bg-gray-500',
    'Sad': 'bg-blue-500',
    'Surprise': 'bg-pink-500'
  };

  // Chart data structure
  const [chartData, setChartData] = useState({
    labels: ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise'],
    datasets: [
      {
        label: 'Confidence %',
        data: [10, 5, 15, 25, 30, 10, 5], // Fallback data to ensure chart visibility
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',    // Angry - red
          'rgba(34, 197, 94, 0.8)',     // Disgust - green
          'rgba(147, 51, 234, 0.8)',    // Fear - purple
          'rgba(250, 204, 21, 0.8)',    // Happy - yellow
          'rgba(107, 114, 128, 0.8)',   // Neutral - gray
          'rgba(59, 130, 246, 0.8)',    // Sad - blue
          'rgba(244, 114, 182, 0.8)'    // Surprise - pink
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(147, 51, 234, 1)',
          'rgba(250, 204, 21, 1)',
          'rgba(107, 114, 128, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(244, 114, 182, 1)'
        ],
        borderWidth: 1,
      },
    ],
  });

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Real-time Emotion Detection',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        },
        title: {
          display: true,
          text: 'Confidence Level',
        }
      },
    },
  };

  const startCamera = async () => {
    try {
      const response = await fetch('/start_camera');
      const data = await response.text();
      
      if (data.includes('started')) {
        setIsCameraActive(true);
        setError(null);
        // Refresh the video feed
        if (videoRef.current) {
          videoRef.current.src = `/video_feed?${new Date().getTime()}`;
        }
      } else {
        setError('Failed to start camera');
      }
    } catch (err) {
      setError('Error starting camera: ' + err.message);
    }
  };

  const stopCamera = async () => {
    try {
      const response = await fetch('/stop_camera');
      const data = await response.text();
      
      if (data.includes('stopped')) {
        setIsCameraActive(false);
        setError(null);
        // Show a placeholder image
        if (videoRef.current) {
          videoRef.current.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgZmlsbD0iI2NjY2NjYyIvPjx0ZXh0IHg9IjMyMCIgeT0iMjQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjY2NjYiPkNhbWVyYSBzdG9wcGVkPC90ZXh0Pjwvc3ZnPg==';
        }
        // Reset dominant emotion when camera stops
        setDominantEmotion(null);
      } else {
        setError('Failed to stop camera');
      }
    } catch (err) {
      setError('Error stopping camera: ' + err.message);
    }
  };

  // Fetch real-time emotion data from backend
  useEffect(() => {
    console.log('Camera active state changed:', isCameraActive);
    
    if (!isCameraActive) {
      // Reset chart data when camera is inactive
      setChartData(prevData => ({
        ...prevData,
        datasets: [
          {
            ...prevData.datasets[0],
            data: [10, 5, 15, 25, 30, 10, 5], // Reset to fallback data
          },
        ],
      }));
      return;
    }

    console.log('Starting real-time data fetching...');
    
    const interval = setInterval(async () => {
      try {
        console.log('Fetching emotion data...');
        const response = await fetch('/emotion_data');
        if (response.ok) {
          const data = await response.json();
          console.log('Emotion data received:', data);
          
          // Validate data structure
          if (data && data.predictions && Array.isArray(data.predictions)) {
            // Set dominant emotion
            if (data.dominant_emotion) {
              setDominantEmotion({
                emotion: data.dominant_emotion,
                confidence: data.confidence ? (data.confidence * 100).toFixed(2) : 0
              });
            }
            
            // Convert predictions to percentages
            const rawPercentages = data.predictions.map(p => (p * 100));
            
            // Find the index of the emotion with the highest confidence
            const maxIndex = rawPercentages.indexOf(Math.max(...rawPercentages));
            const maxValue = rawPercentages[maxIndex];
            
            // Create new data array with redistribution
            // The highest confidence emotion keeps its value
            // The remaining 100% - maxValue is distributed equally among the other 6 emotions
            const newData = rawPercentages.map((value, index) => {
              if (index === maxIndex) {
                // Keep the highest value as is
                return Math.round(maxValue * 100) / 100;
              } else {
                // Distribute the remaining percentage equally among other emotions
                const remainingPercentage = 100 - maxValue;
                const equalShare = remainingPercentage / 6;
                return Math.max(1, Math.round(equalShare * 100) / 100); // Minimum 1%
              }
            });
            
            // Ensure the total adds up to 100% (accounting for rounding)
            const total = newData.reduce((sum, value) => sum + value, 0);
            if (Math.abs(total - 100) > 0.1) {
              // Adjust the highest value to make the total exactly 100%
              newData[maxIndex] = Math.round((newData[maxIndex] + (100 - total)) * 100) / 100;
            }
            
            // Always update chart data to ensure real-time updates
            setChartData(prevData => ({
              ...prevData,
              datasets: [
                {
                  ...prevData.datasets[0],
                  data: newData,
                },
              ],
            }));
            
            // Update key to force re-render
            setChartUpdateKey(prev => prev + 1);
          } else {
            console.error('Invalid emotion data structure:', data);
          }
        } else {
          console.error('Failed to fetch emotion data. Status:', response.status);
        }
      } catch (err) {
        console.error('Error fetching emotion data:', err);
      }
    }, 1000);

    return () => {
      console.log('Clearing interval...');
      clearInterval(interval);
    };
  }, [isCameraActive]);

  return (
    <div className="space-y-8">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2 
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Facial Emotion Detection
        </motion.h2>
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Detect emotions through facial expressions in real-time
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera Feed */}
        <motion.div 
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-900">Camera Feed</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isCameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">{isCameraActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          
          <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center relative">
            <img 
              ref={videoRef}
              src={isCameraActive ? `/video_feed` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgZmlsbD0iI2NjY2NjYyIvPjx0ZXh0IHg9IjMyMCIgeT0iMjQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjY2NjYiPlN0YXJ0IGNhbWVyYSB0byBiZWdpbjwvdGV4dD48L3N2Zz4='}
              alt="Face Detection Feed"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgZmlsbD0iI2NjY2NjYyIvPjx0ZXh0IHg9IjMyMCIgeT0iMjQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjY2NjYiPkVycm9yIGxvYWRpbmcgZmVlZDwvdGV4dD48L3N2Zz4=';
              }}
            />
            {!isCameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center p-6">
                  <div className="text-5xl mb-4">📸</div>
                  <p className="text-white text-lg">Camera is not active</p>
                  <p className="text-gray-300 text-sm mt-2">Start the camera to begin detection</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center mt-6 space-x-4">
            {!isCameraActive ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Start Camera
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopCamera}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
              >
                Stop Camera
              </motion.button>
            )}
          </div>

          {error && (
            <motion.div 
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p>{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Emotion Results */}
        <motion.div 
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Detected Emotions</h3>
          
          <div className="space-y-6">
            {/* Dominant Emotion Display - Moved inside Detected Emotions section */}
            {dominantEmotion && (
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h4 className="font-semibold text-md mb-1">Dominant Emotion</h4>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{dominantEmotion.emotion}</span>
                  <span className="text-xl font-bold">{dominantEmotion.confidence}%</span>
                </div>
                <p className="text-blue-100 text-sm mt-1">Highest confidence emotion detected</p>
              </motion.div>
            )}
            
            {/* Real-time Emotion Chart */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-80 relative">
              <Bar 
                key={`chart-${chartUpdateKey}`}
                data={chartData} 
                options={chartOptions} 
              />
              {!isCameraActive && chartData.datasets[0].data.every(d => d <= 30) && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
                  <p className="text-gray-500 text-lg">Start camera to see real-time emotion data</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div 
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <h3 className="font-semibold text-lg text-gray-900 mb-3">How to use</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Position yourself in front of the camera with good lighting',
            'Make natural facial expressions for better detection',
            'Emotions detected: Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise',
            'Confidence scores indicate the model\'s certainty in its prediction'
          ].map((instruction, index) => (
            <motion.li 
              key={index}
              className="flex items-start"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
            >
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-gray-700">{instruction}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default FaceModule;