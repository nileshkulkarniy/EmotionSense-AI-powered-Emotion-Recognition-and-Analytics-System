import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const TextModule = () => {
  const [inputText, setInputText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]); // New state for recent analyses

  // Chart data structure
  const [chartData, setChartData] = useState({
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        label: 'Sentiment Distribution',
        data: [0, 0, 0],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Green for Positive
          'rgba(239, 68, 68, 0.8)',   // Red for Negative
          'rgba(107, 114, 128, 0.8)', // Gray for Neutral
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 1,
      },
    ],
  });

  const analyzeText = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/analyze_text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        
        // Add to recent analyses
        const newAnalysis = {
          id: Date.now(),
          text: inputText,
          sentiment: result.sentiment,
          confidence: Math.round(result.confidence * 94),
          timestamp: new Date().toLocaleTimeString()
        };
        
        setRecentAnalyses(prev => [newAnalysis, ...prev.slice(0, 4)]); // Keep only last 5 analyses
        
        // Update chart data based on actual analysis result
        const confidence = Math.round(result.confidence * 94);
        const newData = [0, 0, 0];
        const sentimentIndex = ['positive', 'negative', 'neutral'].indexOf(result.sentiment.toLowerCase());
        
        // Set the detected sentiment to actual confidence level
        if (sentimentIndex !== -1) {
          newData[sentimentIndex] = confidence;
          // Distribute remaining confidence among other sentiments
          const remaining = 100 - confidence;
          const otherIndices = [0, 1, 2].filter(i => i !== sentimentIndex);
          // Distribute remaining percentage equally among other sentiments
          otherIndices.forEach(index => {
            newData[index] = remaining / 2;
          });
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
        setError(errorData.message || 'Failed to analyze text');
      }
    } catch (err) {
      setError('Error connecting to the server');
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-500';
      case 'negative':
        return 'bg-red-500';
      case 'neutral':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      case 'neutral':
        return '😐';
      default:
        return '😐';
    }
  };

  // Chart options
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sentiment Distribution',
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sentiment Confidence',
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
      },
    },
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
          Text Sentiment Analysis
        </motion.h2>
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Analyze the sentiment of your text in real-time
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Text Input */}
        <motion.div 
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Enter Text</h3>
          
          <div className="mb-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter text to analyze sentiment..."
              className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          
          <div className="flex justify-center mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={analyzeText}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                  Analyzing...
                </div>
              ) : (
                'Analyze Sentiment'
              )}
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
        </motion.div>

        {/* Analysis Results */}
        <motion.div 
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Analysis Results</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Charts Section - Taking full width */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pie Chart */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-64">
                  <Pie data={chartData} options={pieChartOptions} />
                </div>
                
                {/* Bar Chart */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm h-64">
                  <Bar data={chartData} options={barChartOptions} />
                </div>
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
                      {getSentimentEmoji(analysisResult.sentiment)}
                    </motion.span>
                    <div>
                      <h4 className="font-bold text-xl capitalize">{analysisResult.sentiment}</h4>
                      <p className="text-gray-600">
                        {Math.round(analysisResult.confidence * 94)}% confidence
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className={`h-2.5 rounded-full ${getSentimentColor(analysisResult.sentiment)}`} 
                      style={{ width: `${analysisResult.confidence * 94}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-gray-700 italic">"{inputText}"</p>
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
                    📝
                  </motion.div>
                  <p className="text-gray-500 text-lg">Enter text and click analyze to see results</p>
                  <p className="text-gray-400 text-sm mt-2">Supports positive, negative, and neutral sentiment detection</p>
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
                              {getSentimentEmoji(analysis.sentiment)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(analysis.sentiment)} text-white`}>
                              {analysis.sentiment}
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
                              className={`h-1.5 rounded-full ${getSentimentColor(analysis.sentiment)}`} 
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
            'Enter any text in the input field',
            'Click "Analyze Sentiment" to process',
            'View sentiment results with confidence score',
            'Try different texts to see varying sentiments'
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

export default TextModule;