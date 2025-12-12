import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Terminal, Variable } from 'lucide-react';

interface CodePlaygroundProps {
  initialCode: string;
}

declare const Prism: any;

export const CodePlayground: React.FC<CodePlaygroundProps> = ({ initialCode }) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const preRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync Prism highlight on code change
  useEffect(() => {
    if (preRef.current && typeof Prism !== 'undefined') {
      Prism.highlightElement(preRef.current.querySelector('code'));
    }
  }, [code]);

  // Simple Python Simulation Logic
  const runCode = () => {
    const lines = code.split('\n');
    const newVars: Record<string, any> = {};
    const newOutput: string[] = [];
    
    // Reset output
    setOutput([]);
    setVariables({});

    try {
      lines.forEach(line => {
        const trimmed = line.trim();
        // Skip empty or comments
        if (!trimmed || trimmed.startsWith('#')) return;

        // 1. Handle Assignments: var = value
        // Regex looks for "variable = value"
        const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
        if (assignMatch) {
          const varName = assignMatch[1];
          const rawValue = assignMatch[2];
          
          let val: any = rawValue;

          // String detection
          if ((rawValue.startsWith('"') && rawValue.endsWith('"')) || 
              (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
            val = rawValue.slice(1, -1);
          } 
          // Number detection
          else if (!isNaN(Number(rawValue))) {
            val = Number(rawValue);
          }
          // Boolean
          else if (rawValue === 'True') val = true;
          else if (rawValue === 'False') val = false;
          // Variable reference assignment (x = y)
          else if (newVars[rawValue] !== undefined) {
             val = newVars[rawValue];
          }

          newVars[varName] = val;
        }

        // 2. Handle Print: print(value)
        const printMatch = trimmed.match(/^print\((.+)\)$/);
        if (printMatch) {
          const content = printMatch[1].trim();
          
          // String literal
          if ((content.startsWith('"') && content.endsWith('"')) || 
              (content.startsWith("'") && content.endsWith("'"))) {
            newOutput.push(content.slice(1, -1));
          }
          // Variable lookup
          else if (newVars[content] !== undefined) {
            newOutput.push(String(newVars[content]));
          }
          // Direct number/bool
          else if (!isNaN(Number(content))) {
            newOutput.push(content);
          }
          else {
            // Check if math operation (very simple support for +)
            if (content.includes('+')) {
               // ... minimal math logic could go here, skipping for minimalism
               newOutput.push(String(content)); // Echo literal if fail
            } else {
               throw new Error(`NameError: name '${content}' is not defined`);
            }
          }
        }
      });

      setVariables(newVars);
      setOutput(newOutput);

    } catch (err: any) {
      newOutput.push(err.message || "Error executing code");
      setOutput(newOutput);
    }
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput([]);
    setVariables({});
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-0 rounded-xl overflow-hidden border border-sub/20 shadow-2xl bg-[#1e2022]">
      
      {/* LEFT: Code Editor */}
      <div className="flex-1 flex flex-col min-h-[300px] border-b md:border-b-0 md:border-r border-sub/10">
        <div className="flex items-center justify-between px-4 py-2 bg-[#252629] border-b border-sub/10">
          <div className="flex items-center gap-2 text-xs font-bold text-sub uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            main.py
          </div>
          <div className="flex gap-2">
             <button onClick={handleReset} className="p-1 hover:text-main text-sub transition-colors" title="Reset Code">
               <RotateCcw size={14} />
             </button>
          </div>
        </div>
        
        <div className="relative flex-1 bg-[#1e2022] overflow-hidden group">
          {/* Editor Overlay Logic */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="absolute inset-0 w-full h-full p-4 font-mono text-sm leading-relaxed bg-transparent text-transparent caret-main resize-none focus:outline-none z-10 selection:bg-main/20"
            spellCheck="false"
          />
          <pre ref={preRef} className="absolute inset-0 w-full h-full p-4 m-0 font-mono text-sm leading-relaxed pointer-events-none z-0">
            <code className="language-python">
              {code}
            </code>
          </pre>
        </div>
      </div>

      {/* RIGHT: Output & Variables */}
      <div className="flex-1 flex flex-col bg-[#161819] min-h-[300px]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1c1e] border-b border-sub/10">
           <span className="text-xs font-bold text-sub uppercase tracking-wider flex items-center gap-2">
             <Terminal size={12} /> Console
           </span>
           <button 
             onClick={runCode}
             className="flex items-center gap-2 px-3 py-1 bg-main text-bg_dark text-xs font-bold rounded hover:bg-white transition-colors"
           >
             <Play size={12} fill="currentColor" /> Run
           </button>
        </div>

        {/* Console Output */}
        <div className="flex-1 p-4 font-mono text-sm border-b border-sub/10 overflow-y-auto max-h-[200px]">
           {output.length === 0 ? (
             <div className="text-sub/30 italic">Click run to see output...</div>
           ) : (
             output.map((line, i) => (
               <div key={i} className="flex gap-2 text-green-400 mb-1">
                 <span className="text-sub/30 select-none">&gt;</span>
                 {line}
               </div>
             ))
           )}
        </div>

        {/* Variable Explorer */}
        <div className="h-[150px] bg-[#1a1c1e] flex flex-col">
          <div className="px-4 py-1.5 bg-[#252629] border-y border-sub/10 text-[10px] font-bold text-sub uppercase tracking-wider flex items-center gap-2">
            <Variable size={10} /> Variable Explorer
          </div>
          <div className="flex-1 overflow-y-auto p-2">
             {Object.keys(variables).length === 0 ? (
               <div className="text-sub/20 text-xs text-center mt-4">No variables in memory</div>
             ) : (
               <table className="w-full text-xs font-mono text-left border-collapse">
                 <thead>
                   <tr className="text-sub/50 border-b border-sub/10">
                     <th className="py-1 pl-2 font-normal">Name</th>
                     <th className="py-1 font-normal">Value</th>
                     <th className="py-1 font-normal">Type</th>
                   </tr>
                 </thead>
                 <tbody>
                   {Object.entries(variables).map(([key, val]) => (
                     <tr key={key} className="border-b border-sub/5 text-sub">
                       <td className="py-1.5 pl-2 text-main">{key}</td>
                       <td className="py-1.5 text-text">{String(val)}</td>
                       <td className="py-1.5 opacity-50">{typeof val}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};