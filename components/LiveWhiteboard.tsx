import React, { useRef } from 'react';
import { LiveSegment } from '../types';
import { MarkdownIcon, PDFIcon, PNGIcon } from './Icons';
import { MarkdownRenderer } from './MarkdownRenderer';

declare const jspdf: any;
declare const html2canvas: any;

interface LiveWhiteboardProps {
  segments: LiveSegment[];
  isLive: boolean;
}

const LiveWhiteboard: React.FC<LiveWhiteboardProps> = ({ segments, isLive }) => {
  const whiteboardRef = useRef<HTMLDivElement>(null);

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', `${mimeType},${encodeURIComponent(content)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPNG = () => {
    if (whiteboardRef.current) {
      html2canvas(whiteboardRef.current, { backgroundColor: '#111827', useCORS: true, scale: 2 })
        .then(canvas => {
          const link = document.createElement('a');
          link.download = 'live-session.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
    }
  };

  const handleExportPDF = () => {
    if (whiteboardRef.current) {
      const { jsPDF } = jspdf;
      html2canvas(whiteboardRef.current, { backgroundColor: '#111827', useCORS: true, scale: 2 })
        .then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          pdf.save('live-session.pdf');
        });
    }
  };

  const handleExportMD = () => {
    let mdContent = `# Live Session Notes\n\n`;
    segments.forEach(segment => {
      mdContent += `## ${segment.keyIdea}\n\n`;
      mdContent += `${segment.detailedExplanation}\n\n`;
      if (segment.imageUrl) {
        mdContent += `![${segment.keyIdea}](${segment.imageUrl})\n\n`;
      }
      mdContent += '---\n\n';
    });
    downloadFile('live-session.md', mdContent, 'data:text/markdown;charset=utf-8');
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl w-full p-4 sm:p-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-700 mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
            <span className={`relative flex h-3 w-3 mr-3 ${isLive ? '' : 'hidden'}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Live Whiteboard
        </h2>
        {!isLive && segments.length > 0 && (
          <div className="flex items-center space-x-2">
            <button onClick={handleExportPNG} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md transition-all duration-200 text-sm">
              <PNGIcon className="w-5 h-5" /> <span>PNG</span>
            </button>
            <button onClick={handleExportPDF} className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md transition-all duration-200 text-sm">
              <PDFIcon className="w-5 h-5" /> <span>PDF</span>
            </button>
            <button onClick={handleExportMD} className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-md transition-all duration-200 text-sm">
              <MarkdownIcon className="w-5 h-5" /> <span>MD</span>
            </button>
          </div>
        )}
      </div>

      <div ref={whiteboardRef} className="bg-gray-900 p-2 sm:p-6 rounded-md min-h-[70vh] h-full">
        {segments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.5 14h.01M12 14h.01M8.5 14h.01M4.5 14h.01M19.5 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-lg font-medium">Listening...</p>
            <p className="text-sm">Speak to begin generating ideas.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {segments.map((segment, index) => (
              <div key={segment.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-4 bg-gray-800/50 rounded-lg animate-fade-in">
                <div className={`text-gray-200 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                  <h3 className="text-xl font-semibold text-green-300 mb-3">{segment.keyIdea}</h3>
                  <div className="text-sm leading-relaxed"><MarkdownRenderer text={segment.detailedExplanation} /></div>
                </div>
                <div className={`flex items-center justify-center ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  {segment.imageUrl ? (
                    <img src={segment.imageUrl} alt={segment.keyIdea} className="rounded-md shadow-lg w-full h-auto object-cover aspect-video bg-gray-700" />
                  ) : (
                    <div className="w-full aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-sky-400"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveWhiteboard;
