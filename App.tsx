import React, { useState, useCallback } from 'react';
import { generateExplanation, generateImage } from './services/geminiService';
import { WhiteboardContent } from './types';
import Whiteboard from './components/Whiteboard';
import { InputForm } from './components/InputForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LiveClassroom } from './components/LiveClassroom';

type AppMode = 'explain' | 'live';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('explain');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whiteboardContent, setWhiteboardContent] = useState<WhiteboardContent | null>(null);

  const handleTopicSubmit = useCallback(async (topic: string) => {
    setIsLoading(true);
    setError(null);
    setWhiteboardContent(null);

    try {
      const explanation = await generateExplanation(topic);
      setWhiteboardContent(explanation);

      const imagePromises = explanation.sections.map(section => 
        generateImage(section.imagePrompt).catch(err => {
          console.error(`Failed to generate image for "${section.heading}":`, err);
          return 'error';
        })
      );
      
      const imageUrls = await Promise.all(imagePromises);

      setWhiteboardContent(prevContent => {
        if (!prevContent) return null;
        const updatedSections = prevContent.sections.map((section, index) => ({
          ...section,
          imageUrl: imageUrls[index] !== 'error' ? imageUrls[index] : undefined,
        }));
        return { ...prevContent, sections: updatedSections };
      });

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetExplainMode = () => {
      setWhiteboardContent(null);
      setError(null);
      setIsLoading(false);
  }

  const renderExplainMode = () => (
    <>
      {!whiteboardContent && (
        <div className="flex flex-col items-center justify-center text-center min-h-[60vh]">
          <InputForm onSubmit={handleTopicSubmit} isLoading={isLoading} />
          {error && <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md animate-pulse">{error}</div>}
        </div>
      )}
      
      {isLoading && !whiteboardContent && (
           <div className="flex items-center justify-center mt-12">
              <LoadingSpinner />
           </div>
      )}

      {whiteboardContent && (
        <div>
          <Whiteboard content={whiteboardContent} />
           <div className="mt-12 flex flex-col items-center justify-center">
              <p className="text-gray-400 mb-4">Want to explore another topic?</p>
              <InputForm onSubmit={handleTopicSubmit} isLoading={isLoading} />
           </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="classroom-header mb-8 rounded-lg px-6 py-6 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-gradient-to-br from-sky-900 to-sky-700 flex items-center justify-center shadow-inner">
                <span className="text-white font-extrabold text-2xl">EB</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold chalk-heading mb-0">
                  Explain<span className="text-sky-300">Board</span>
                </h1>
                <p className="text-sm text-gray-300">AI-powered visual classroom — chalkboard style</p>
              </div>
            </div>
            <div className="mt-2 md:mt-0">
              <div className="flex items-center bg-slate-800 rounded-full p-1">
                <button 
                    onClick={() => { setMode('explain'); resetExplainMode(); }}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${mode === 'explain' ? 'bg-sky-500 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}
                >
                    Explain a Topic
                </button>
                <button 
                    onClick={() => setMode('live')}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${mode === 'live' ? 'bg-sky-500 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}
                >
                    🎓 Live Classroom
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex justify-center my-8">
            <div className="flex items-center bg-gray-800 rounded-full p-1">
                <button 
                    onClick={() => { setMode('explain'); resetExplainMode(); }}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${mode === 'explain' ? 'bg-sky-500 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}
                >
                    Explain a Topic
                </button>
                <button 
                    onClick={() => setMode('live')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300 ${mode === 'live' ? 'bg-sky-500 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}
                >
                    🎓 Live Classroom
                </button>
            </div>
        </div>

        {mode === 'explain' ? renderExplainMode() : <LiveClassroom />}

      </main>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Built with React, Tailwind CSS, and the Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;
