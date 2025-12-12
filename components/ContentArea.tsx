import React, { useEffect, useState, useRef } from 'react';
import { fetchTutorialContent } from '../services/geminiService';
import { TutorialContent } from '../types';
import { CodeBlock } from './CodeBlock';
import { Visualizer } from './Visualizer';
import { Loader2, AlertTriangle, BookOpen, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContentAreaProps {
  topic: string;
  prevTopic: string | null;
  nextTopic: string | null;
  onNavigate: (topic: string) => void;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ topic, prevTopic, nextTopic, onNavigate }) => {
  const [content, setContent] = useState<TutorialContent | null>(null);
  // We default loading to false because static data is near instant, avoiding flicker
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadContent = async () => {
      // Only show loader if it takes perceptible time (optional for static, but good practice)
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchTutorialContent(topic);
        setContent(data);
        // Scroll to top after content loads
        requestAnimationFrame(() => {
          topRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      } catch (err) {
        setError("Failed to load content.");
      } finally {
        setLoading(false);
      }
    };

    if (topic) {
      loadContent();
    }
  }, [topic]);

  if (loading && !content) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-sub gap-6">
         {/* Subtle loader for transitions */}
        <Loader2 className="animate-spin w-8 h-8 text-main/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-error gap-4 p-8 text-center">
        <AlertTriangle size={48} />
        <h2 className="text-xl font-bold">Error</h2>
        <p className="text-sub max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-2 bg-sub/10 hover:bg-sub/20 rounded text-text transition-colors border border-sub/20"
        >
          Reload
        </button>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 pb-32 animate-in fade-in duration-300">
      <div ref={topRef} className="pt-2" />
      
      {/* Header */}
      <div className="mb-12 border-b border-sub/10 pb-10">
        <div className="flex items-center gap-3 text-main mb-6">
           <span className={`
             px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest
             ${content.difficulty === 'Beginner' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 
               content.difficulty === 'Intermediate' ? 'border-main/30 bg-main/10 text-main' : 
               'border-red-500/30 bg-red-500/10 text-red-400'}
           `}>
             {content.difficulty}
           </span>
           <span className="h-px flex-1 bg-sub/10"></span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-white tracking-tight">
          {content.title}
        </h1>
        <div className="text-lg md:text-xl text-sub leading-relaxed max-w-3xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.introduction}</ReactMarkdown>
        </div>
      </div>

      {/* Interactive Visualization - Top loaded for immediate engagement */}
      {content.interactiveElement && (
        <Visualizer data={content.interactiveElement} />
      )}

      {/* Sections */}
      <div className="space-y-20 mt-12">
        {content.sections.map((section, idx) => (
          <section key={idx} className="group">
            <h2 className="text-2xl md:text-3xl font-bold text-text mb-6 flex items-center gap-4">
              <span className="flex items-center justify-center w-8 h-8 rounded bg-sub/10 text-main font-mono text-sm font-bold">
                0{idx + 1}
              </span>
              {section.heading}
            </h2>
            
            <div className="prose prose-invert prose-lg prose-p:text-sub/90 prose-p:leading-8 prose-headings:text-text prose-strong:text-white prose-code:text-main prose-code:bg-sub/10 prose-code:px-1 prose-code:rounded max-w-none mb-8">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section.content}
              </ReactMarkdown>
            </div>

            {section.codeBlock && (
              <CodeBlock 
                code={section.codeBlock.code} 
                language={section.codeBlock.language} 
                output={section.codeBlock.output}
              />
            )}
          </section>
        ))}
      </div>

      {/* Real World Example */}
      <div className="mt-20 bg-gradient-to-br from-bg_dark to-[#252629] p-8 md:p-10 rounded-2xl border border-sub/10 relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 p-40 bg-main/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
         <div className="relative z-10">
            <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-3">
              <div className="p-2 bg-main rounded text-bg_dark">
                <BookOpen size={20} />
              </div>
              Real World Application
            </h3>
            <div className="text-sub leading-relaxed text-lg prose prose-invert prose-p:text-sub max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.realWorldExample}</ReactMarkdown>
            </div>
         </div>
      </div>

      {/* Summary */}
      <div className="mt-12 flex flex-col md:flex-row items-start gap-6 p-6 md:p-8 bg-sub/5 rounded-2xl border border-sub/10">
         <div className="p-3 bg-main/10 rounded-full shrink-0">
           <Lightbulb className="text-main w-6 h-6" />
         </div>
         <div>
            <h4 className="font-bold text-text mb-2 uppercase text-xs tracking-wider">Key Takeaway</h4>
            <p className="text-sub italic leading-relaxed text-lg">
               "{content.summary}"
            </p>
         </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-20 pt-10 border-t border-sub/10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {prevTopic ? (
          <button 
            onClick={() => onNavigate(prevTopic)}
            className="group flex flex-col items-start gap-2 p-6 rounded-xl border border-sub/10 hover:border-main/30 hover:bg-sub/5 transition-all text-left"
          >
             <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sub group-hover:text-main transition-colors">
               <ChevronLeft size={14} /> Previous Topic
             </span>
             <span className="text-lg font-bold text-text group-hover:translate-x-1 transition-transform">{prevTopic}</span>
          </button>
        ) : <div />} {/* Spacer */}

        {nextTopic ? (
          <button 
            onClick={() => onNavigate(nextTopic)}
            className="group flex flex-col items-end gap-2 p-6 rounded-xl border border-sub/10 hover:border-main/30 hover:bg-sub/5 transition-all text-right"
          >
             <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sub group-hover:text-main transition-colors">
               Next Topic <ChevronRight size={14} />
             </span>
             <span className="text-lg font-bold text-text group-hover:-translate-x-1 transition-transform">{nextTopic}</span>
          </button>
        ) : null}
      </div>

    </div>
  );
};