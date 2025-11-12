
import React, { useRef } from 'react';
import { WhiteboardContent } from '../types';
import { DownloadIcon, MarkdownIcon, PDFIcon, PNGIcon } from './Icons';
import { MarkdownRenderer } from './MarkdownRenderer';

// To access jsPDF and html2canvas from CDN
declare const jspdf: any;
declare const html2canvas: any;

interface WhiteboardProps {
  content: WhiteboardContent;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ content }) => {
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
      html2canvas(whiteboardRef.current, {
        backgroundColor: '#1f2937', // bg-gray-800
        useCORS: true,
        scale: 2, // Higher resolution
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `${content.title.replace(/\s+/g, '_').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  const handleExportPDF = () => {
    if (whiteboardRef.current) {
      const { jsPDF } = jspdf;
      html2canvas(whiteboardRef.current, {
        backgroundColor: '#1f2937',
        useCORS: true,
        scale: 2,
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${content.title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      });
    }
  };

  const handleExportMD = () => {
    let mdContent = `# ${content.title}\n\n`;
    mdContent += `${content.introduction}\n\n`;
    content.sections.forEach(section => {
      mdContent += `## ${section.heading}\n\n`;
      mdContent += `${section.explanation}\n\n`;
      if (section.imageUrl) {
        mdContent += `![${section.heading}](${section.imageUrl})\n\n`;
      }
    });
    downloadFile(`${content.title.replace(/\s+/g, '_').toLowerCase()}.md`, mdContent, 'data:text/markdown;charset=utf-8');
  };

  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 bg-gray-900/50 backdrop-blur-sm py-4 mb-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4">
            <h2 className="text-2xl font-bold text-white truncate pr-4">{content.title}</h2>
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
        </div>
      </div>

      <div ref={whiteboardRef} className="p-4 md:p-8 bg-gray-800 rounded-lg shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <header className="text-center mb-12 border-b-2 border-sky-500/30 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{content.title}</h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">{content.introduction}</p>
          </header>

          <main className="space-y-16">
            {content.sections.map((section, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className={`text-gray-200 text-base leading-relaxed ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                  <h3 className="text-2xl font-semibold text-green-300 mb-4 border-l-4 border-green-400 pl-4">{section.heading}</h3>
                  <div className="prose prose-invert max-w-none">
                    <MarkdownRenderer text={section.explanation} />
                  </div>
                </div>
                <div className={`flex items-center justify-center ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  {section.imageUrl ? (
                    <img src={section.imageUrl} alt={section.heading} className="rounded-lg shadow-lg w-full h-auto object-cover aspect-video bg-gray-700" />
                  ) : (
                    <div className="w-full aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                      <p className="text-gray-400">Generating visual...</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
