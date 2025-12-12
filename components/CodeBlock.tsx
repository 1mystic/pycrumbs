import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  output?: string;
}

// Access global Prism object
declare const Prism: any;

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'python', output }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Trigger syntax highlighting when code or language changes
    if (codeRef.current && typeof Prism !== 'undefined') {
      // We need to re-run highlight on the element
      // Prism.highlightElement is better for React refs than highlightAll
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-sub/20 bg-bg_dark shadow-sm group">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252629] border-b border-sub/10">
        <span className="text-xs text-sub font-mono lowercase">{language}</span>
        <button 
          onClick={handleCopy}
          className="text-sub hover:text-text transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      </div>
      
      {/* 
        PrismJS container 
        - 'line-numbers' class triggers the line numbers plugin 
        - 'language-x' triggers the syntax highlighter
      */}
      <div className="relative bg-[#161819]">
        <pre className={`line-numbers language-${language} !bg-transparent`}>
          <code ref={codeRef} className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>

      {output && (
        <div className="border-t border-sub/20 bg-[#1e1f22] p-4 font-mono text-sm">
           <div className="text-[10px] uppercase tracking-wider text-sub mb-2 font-bold flex items-center gap-2">
             <span className="w-2 h-2 bg-green-500 rounded-full"></span> Output
           </div>
           <div className="text-text/80 whitespace-pre-wrap pl-4 border-l-2 border-sub/20">{output}</div>
        </div>
      )}
    </div>
  );
};