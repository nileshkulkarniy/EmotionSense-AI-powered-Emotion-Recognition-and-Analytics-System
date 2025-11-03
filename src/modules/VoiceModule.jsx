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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const VoiceModule = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timer, setTimer] = useState(0); // Timer state for 30-second countdown
  const [isTimerActive, setIsTimerActive] = useState(false); // Timer active state
  const [recentAnalyses, setRecentAnalyses] = useState([]); // New state for recent analyses
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const silenceTimerRef = useRef(null);
  const lastResultTimeRef = useRef(null);
  const timerRef = useRef(null); // Ref for timer interval

  // Chart data state
  const [chartData, setChartData] = useState({
    labels: ['Happy', 'Sad', 'Angry', 'Fear', 'Disgust', 'Surprise', 'Neutral'],
    datasets: [
      {
        label: 'Confidence %',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(250, 204, 21, 0.8)',    // Happy - yellow
          'rgba(59, 130, 246, 0.8)',    // Sad - blue
          'rgba(239, 68, 68, 0.8)',     // Angry - red
          'rgba(147, 51, 234, 0.8)',    // Fear - purple
          'rgba(34, 197, 94, 0.8)',     // Disgust - green
          'rgba(244, 114, 182, 0.8)',   // Surprise - pink
          'rgba(107, 114, 128, 0.8)',   // Neutral - gray
        ],
        borderColor: [
          'rgba(250, 204, 21, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(147, 51, 234, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(244, 114, 182, 1)',
          'rgba(107, 114, 128, 1)',
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
        text: 'Voice Emotion Analysis Results',
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

  // Check if browser supports speech recognition
  const isSpeechRecognitionSupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  // Clear silence timer
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // Set silence timer to stop listening after 2 seconds of silence
  const setSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (isListening) {
        stopListening();
      }
    }, 2000);
  };

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setError('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    try {
      // Create new recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // Event handlers
      recognitionRef.current.onresult = (event) => {
        // Update last result time
        lastResultTimeRef.current = Date.now();
        clearSilenceTimer();
        setSilenceTimer();
        
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update the ref with the final transcript
        finalTranscriptRef.current = finalTranscript;
        
        // Update state with both final and interim results
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError(`Speech recognition error: ${event.error}`);
        clearSilenceTimer();
        stopListening();
      };
      
      recognitionRef.current.onend = () => {
        clearSilenceTimer();
        if (isListening) {
          // Auto-restart if still listening
          recognitionRef.current.start();
        }
      };
      
      // Start recognition
      recognitionRef.current.start();
      finalTranscriptRef.current = '';
      setTranscript('');
      setIsListening(true);
      setError(null);
      
      // Start 30-second timer
      setTimer(30);
      setIsTimerActive(true);
      
      // Set initial silence timer
      setSilenceTimer();
    } catch (err) {
      setError(`Error starting speech recognition: ${err.message}`);
    }
  };

  const stopListening = () => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsTimerActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setAnalysisResult(null);
    setError(null);
    finalTranscriptRef.current = '';
    // Reset chart data
    setChartData({
      ...chartData,
      datasets: [
        {
          ...chartData.datasets[0],
          data: [0, 0, 0, 0, 0, 0, 0],
        },
      ],
    });
  };

  const analyzeSentiment = async () => {
    if (!transcript.trim()) {
      setError('Please speak something to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/analyze_voice_emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcript.trim() }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        
        // Add to recent analyses
        const newAnalysis = {
          id: Date.now(),
          text: transcript.trim(),
          emotion: result.emotion,
          confidence: Math.round(result.confidence * 94), // Fixed confidence display
          timestamp: new Date().toLocaleTimeString()
        };
        
        setRecentAnalyses(prev => [newAnalysis, ...prev.slice(0, 4)]); // Keep only last 5 analyses
        
        // Update chart data based on analysis result with redistribution
        const emotionLabels = ['Happy', 'Sad', 'Angry', 'Fear', 'Disgust', 'Surprise', 'Neutral'];
        const emotionIndex = emotionLabels.findIndex(label => 
          label.toLowerCase() === result.emotion.toLowerCase()
        );
        
        // Create new data array with redistribution
        // The detected emotion gets the confidence value
        // The remaining 100% - confidence is distributed equally among the other 6 emotions
        const newData = Array(7).fill(0);
        const confidence = Math.round(result.confidence * 100);
        
        if (emotionIndex !== -1) {
          // Find the index of the emotion with the highest confidence
          const maxIndex = emotionIndex;
          const maxValue = confidence;
          
          // Create new data array with redistribution
          // The highest confidence emotion keeps its value
          // The remaining 100% - maxValue is distributed equally among the other 6 emotions
          newData.forEach((_, index) => {
            if (index === maxIndex) {
              // Keep the highest value as is
              newData[index] = Math.round(maxValue * 100) / 100;
            } else {
              // Distribute the remaining percentage equally among other emotions
              const remainingPercentage = 100 - maxValue;
              const equalShare = remainingPercentage / 6;
              newData[index] = Math.max(1, Math.round(equalShare * 100) / 100); // Minimum 1%
            }
          });
          
          // Ensure the total adds up to 100% (accounting for rounding)
          const total = newData.reduce((sum, value) => sum + value, 0);
          if (Math.abs(total - 100) > 0.1) {
            // Adjust the highest value to make the total exactly 100%
            newData[maxIndex] = Math.round((newData[maxIndex] + (100 - total)) * 100) / 100;
          }
        }
        
        setChartData({
          ...chartData,
          datasets: [
            {
              ...chartData.datasets[0],
              data: newData,
            },
          ],
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to analyze emotion');
      }
    } catch (err) {
      console.error('Error connecting to the server:', err);
      setError(`Error connecting to the server: ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Timer effect for 30-second countdown
  useEffect(() => {
    if (isTimerActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            // Timer finished, stop listening
            stopListening();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    
    // Cleanup interval on unmount or when timer becomes inactive
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, timer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const getEmotionColor = (emotion) => {
    switch (emotion.toLowerCase()) {
      case 'happy':
        return 'bg-yellow-500';
      case 'sad':
        return 'bg-blue-500';
      case 'angry':
        return 'bg-red-500';
      case 'fear':
        return 'bg-purple-500';
      case 'disgust':
        return 'bg-green-500';
      case 'surprise':
        return 'bg-pink-500';
      case 'neutral':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEmotionEmoji = (emotion) => {
    switch (emotion.toLowerCase()) {
      case 'happy':
        return '😊';
      case 'sad':
        return '😢';
      case 'angry':
        return '😠';
      case 'fear':
        return '😨';
      case 'disgust':
        return '🤢';
      case 'surprise':
        return '😲';
      case 'neutral':
        return '😐';
      default:
        return '😐';
    }
  };

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
          Voice Emotion Analysis
        </motion.h2>
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Analyze emotions from your voice in real-time
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Voice Input */}
        <motion.div 
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Voice Input</h3>
          
          <div className="mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-300 min-h-[150px] max-h-[200px] overflow-y-auto">
              {transcript ? (
                <p className="text-gray-800">{transcript}</p>
              ) : (
                <p className="text-gray-500 italic">
                  {isListening 
                    ? "Speak now... Your words will appear here" 
                    : "Click 'Start Listening' and speak to begin"}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {!isListening ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startListening}
                disabled={!isSpeechRecognitionSupported()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                Start Listening
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopListening}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {isTimerActive ? `Listening (${timer}s)` : 'Stop Listening'}
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearTranscript}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Clear
            </motion.button>
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
          
          {!isSpeechRecognitionSupported() && (
            <motion.div 
              className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p>
                Your browser doesn't support speech recognition. Please use Chrome or Edge for the best experience.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Analysis Results */}
        <motion.div 
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-900">Emotion Analysis Results</h3>
            {transcript && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={analyzeSentiment}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-teal-700 transition-all shadow hover:shadow-lg disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Emotion'}
              </motion.button>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emotion Chart - Taking full width */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
            
            {/* Current Result - Left side */}
            <div className="lg:col-span-1">
              {analysisResult ? (
                <motion.div 
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm h-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <motion.span 
                      className="text-5xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {getEmotionEmoji(analysisResult.emotion)}
                    </motion.span>
                    <div>
                      <h4 className="font-bold text-xl capitalize">{analysisResult.emotion}</h4>
                      <p className="text-gray-600">
                        {Math.round(analysisResult.confidence * 94)}% confidence
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className={`h-2.5 rounded-full ${getEmotionColor(analysisResult.emotion)}`} 
                      style={{ width: `${analysisResult.confidence * 94}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-gray-700 italic">"{transcript}"</p>
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-12 h-full flex flex-col justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div 
                    className="text-6xl mb-4"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎤
                  </motion.div>
                  <p className="text-gray-500 text-lg">Speak and click analyze to see results</p>
                  <p className="text-gray-400 text-sm mt-2">Real-time voice emotion analysis</p>
                </motion.div>
              )}
            </div>
            
            {/* Recent Analyses Section - Right side */}
            {recentAnalyses.length > 0 && (
              <div className="lg:col-span-1">
                <motion.div 
                  className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h4 className="font-bold text-lg mb-3 text-gray-900">Recent Analyses</h4>
                  <div className="space-y-3 max-h-[200px] overflow-y-auto">
                    {recentAnalyses.map((analysis) => (
                      <div 
                        key={analysis.id} 
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">
                              {getEmotionEmoji(analysis.emotion)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getEmotionColor(analysis.emotion)} text-white`}>
                              {analysis.emotion}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{analysis.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          "{analysis.text}"
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-gray-600 mr-2">Confidence:</span>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${getEmotionColor(analysis.emotion)}`} 
                              style={{ width: `${analysis.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 ml-2">{analysis.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Emotion Categories */}
      <motion.div 
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <h3 className="font-semibold text-lg text-gray-900 mb-3">Emotion Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emotion: 'Happy', emoji: '😊', color: 'bg-yellow-500' },
            { emotion: 'Sad', emoji: '😢', color: 'bg-blue-500' },
            { emotion: 'Angry', emoji: '😠', color: 'bg-red-500' },
            { emotion: 'Fear', emoji: '😨', color: 'bg-purple-500' },
            { emotion: 'Disgust', emoji: '🤢', color: 'bg-green-500' },
            { emotion: 'Surprise', emoji: '😲', color: 'bg-pink-500' },
            { emotion: 'Neutral', emoji: '😐', color: 'bg-gray-500' }
          ].map((item, index) => (
            <motion.div
              key={item.emotion}
              className="flex items-center p-3 bg-white rounded-lg shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1 }}
            >
              <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
              <span className="flex items-center">
                <span className="mr-2">{item.emoji}</span>
                {item.emotion}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

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
            'Click "Start Listening" to begin voice capture',
            'Speak naturally - your words will appear in the text box',
            'The system will automatically stop after 2 seconds of silence',
            'Click "Analyze Emotion" to process your spoken words',
            'The system will detect emotions like Happy, Sad, Angry, etc.',
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

export default VoiceModule;