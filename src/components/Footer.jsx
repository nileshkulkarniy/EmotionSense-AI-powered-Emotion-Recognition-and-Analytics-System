import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white border-t border-gray-700 mt-12">
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .marquee-container {
          overflow: hidden;
          white-space: nowrap;
        }
        .marquee-content {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
      
      <div className="container">
        {/* Marquee Section */}
        <div className="marquee-container mb-6 py-2 bg-red-900 rounded-lg">
          <div className="marquee-content">
            <span className="mx-4 text-sm text-gray-300">
              AIMS Institutes, 1st Cross, 1st Stage, Peenya, Bengaluru 560058, Karnataka, INDIA.
            </span>
             <span className="mx-4 text-sm text-gray-300">
              AIMS Institutes, 1st Cross, 1st Stage, Peenya, Bengaluru 560058, Karnataka, INDIA.
            </span>
            <span className="mx-4 text-sm text-gray-300">
              AIMS Institutes, 1st Cross, 1st Stage, Peenya, Bengaluru 560058, Karnataka, INDIA.
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">EmotionSense</h3>
            <p className="text-gray-300 text-sm">
              Advanced multimodal sentiment detection system using AI and machine learning.
            </p>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-white mb-3">Features</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li> Facial Emotion Detection</li>
              <li>Text Sentiment Analysis</li>
              <li>Voice Sentiment Analysis</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-white mb-3">Resources</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Documentation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">API Reference</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Tutorials</a></li>
              <li><a href="#" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-semibold text-white mb-3">Connect</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li><a href="https://github.com/nileshkulkarniy" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">GitHub</a></li>
              <li><a href="https://twitter.com/nileshkulkarniy" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Twitter</a></li>
              <li><a href="https://www.linkedin.com/in/nileshkulkarniy" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">LinkedIn</a></li>
              <li><a href="mailto:knilesh996@gmail.com" className="text-gray-300 hover:text-blue-400 transition-colors duration-200">Feedback</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-4 text-center text-gray-400 text-sm">
          <p>© 2023 EmotionSense. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;