
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Consulting the digital muses...",
  "Sketching out the big ideas...",
  "Generating visual aids...",
  "Connecting concepts with creativity...",
  "Brewing some fresh knowledge...",
  "Assembling insights into art...",
  "Polishing the explanation...",
];

export const LoadingSpinner: React.FC = () => {
  const [message, setMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-400"></div>
      <p className="text-sky-300 mt-6 text-lg font-medium tracking-wide transition-opacity duration-500">{message}</p>
    </div>
  );
};
