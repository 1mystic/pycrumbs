import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Terminal, Variable } from 'lucide-react';

interface ExecutionStep {
  line: number;
  output?: string;
  variables: Record<string, any>;
  explanation?: string;
}

interface PlaygroundData {
  initialCode: string;
  steps: ExecutionStep[];
}

interface CodePlaygroundProps {
  initialCode: string;
  steps?: ExecutionStep[];
}

// Simple syntax highlighter for Python
const SyntaxHighlight: React.FC<{ code: string; currentLine?: number }> = ({ code, currentLine }) => {
  const lines = code.split('\n');

  const highlightLine = (line: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    const tokens: Array<{ type: string; value: string; index: number }> = [];

    // Find comments
    const commentMatch = remaining.match(/#.*/);
    if (commentMatch) {
      tokens.push({ type: 'comment', value: commentMatch[0], index: commentMatch.index! });
    }

    // Find strings
    const stringRegex = /(['"])(?:(?=(\\?))\2.)*?\1/g;
    let match;
    while ((match = stringRegex.exec(remaining)) !== null) {
      tokens.push({ type: 'string', value: match[0], index: match.index });
    }

    // Find keywords
    const keywordRegex = /\b(def|class|if|elif|else|for|while|in|return|import|from|as|try|except|finally|with|pass|break|continue|True|False|None|and|or|not|is|lambda|yield|async|await|print|range)\b/g;
    while ((match = keywordRegex.exec(remaining)) !== null) {
      tokens.push({ type: 'keyword', value: match[0], index: match.index });
    }

    // Find numbers
    const numberRegex = /\b\d+\.?\d*\b/g;
    while ((match = numberRegex.exec(remaining)) !== null) {
      tokens.push({ type: 'number', value: match[0], index: match.index });
    }

    tokens.sort((a, b) => a.index - b.index);

    let lastIndex = 0;
    tokens.forEach((token) => {
      if (token.index > lastIndex) {
        parts.push(<span key={key++}>{remaining.substring(lastIndex, token.index)}</span>);
      }

      const className =
        token.type === 'comment' ? 'text-gray-500' :
          token.type === 'string' ? 'text-green-400' :
            token.type === 'keyword' ? 'text-purple-400' :
              token.type === 'number' ? 'text-blue-400' : '';

      parts.push(<span key={key++} className={className}>{token.value}</span>);
      lastIndex = token.index + token.value.length;
    });

    if (lastIndex < remaining.length) {
      parts.push(<span key={key++}>{remaining.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : <span>{line || '\u00A0'}</span>;
  };

  return (
    <>
      {lines.map((line, lineIndex) => {
        const lineNumber = lineIndex + 1;
        const isActive = currentLine === lineNumber;

        return (
          <div
            key={lineIndex}
            className={`px-2 py-0.5 rounded transition-colors ${isActive ? 'bg-yellow-500/20' : ''}`}
          >
            <span className="text-sub/50 mr-3 select-none inline-block w-6 text-right">{lineNumber}</span>
            {highlightLine(line)}
          </div>
        );
      })}
    </>
  );
};

// Pre-defined execution steps for each playground type
const getDefaultSteps = (code: string): ExecutionStep[] => {
  // Default steps based on common patterns
  const lines = code.split('\n');
  const steps: ExecutionStep[] = [];
  let vars: Record<string, any> = {};

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) return;

    // Simple variable assignment
    const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      let value: any = assignMatch[2].trim();

      // Parse value
      if (value.startsWith("'") || value.startsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith('[')) {
        try { value = JSON.parse(value.replace(/'/g, '"')); } catch { value = []; }
      } else if (!isNaN(Number(value))) {
        value = Number(value);
      } else if (value === 'True') {
        value = true;
      } else if (value === 'False') {
        value = false;
      }

      vars[varName] = value;
      steps.push({ line: lineNum, variables: { ...vars } });
      return;
    }

    // Print statement
    const printMatch = trimmed.match(/^print\((.+)\)$/);
    if (printMatch) {
      let content = printMatch[1].trim();
      let output = content;

      if (content.startsWith("'") || content.startsWith('"')) {
        output = content.slice(1, -1);
      } else if (vars[content] !== undefined) {
        output = String(vars[content]);
      }

      steps.push({ line: lineNum, output, variables: { ...vars } });
      return;
    }

    // For loop - simplified handling
    if (trimmed.startsWith('for ')) {
      steps.push({ line: lineNum, variables: { ...vars } });
    }
  });

  return steps;
};

export const CodePlayground: React.FC<CodePlaygroundProps> = ({ initialCode, steps: providedSteps }) => {
  const [output, setOutput] = useState<string[]>([]);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Use the provided code directly (not stored in state to avoid stale data)
  const code = initialCode;
  const executionSteps = providedSteps || getDefaultSteps(code);

  // Reset all state when initialCode or steps change (navigating to new topic)
  useEffect(() => {
    setOutput([]);
    setVariables({});
    setCurrentStep(0);
    setIsRunning(false);
  }, [initialCode, providedSteps]);

  const runStep = () => {
    if (currentStep < executionSteps.length) {
      setIsRunning(true);
      const step = executionSteps[currentStep];

      if (step.output) {
        setOutput(prev => [...prev, step.output!]);
      }
      setVariables(step.variables);
      setCurrentStep(prev => prev + 1);

      setTimeout(() => setIsRunning(false), 300);
    }
  };

  const runAll = () => {
    handleReset();
    setIsRunning(true);

    executionSteps.forEach((step, i) => {
      setTimeout(() => {
        if (step.output) {
          setOutput(prev => [...prev, step.output!]);
        }
        setVariables(step.variables);
        setCurrentStep(i + 1);

        if (i === executionSteps.length - 1) {
          setIsRunning(false);
        }
      }, (i + 1) * 300);
    });
  };

  const handleReset = () => {
    setOutput([]);
    setVariables({});
    setCurrentStep(0);
    setIsRunning(false);
  };

  const currentLine = currentStep > 0 && currentStep <= executionSteps.length
    ? executionSteps[currentStep - 1].line
    : undefined;

  return (
    <div className="w-full flex flex-col md:flex-row gap-0 rounded-xl overflow-hidden border border-sub/20 shadow-2xl bg-[#1e2022]">
      {/* LEFT: Code Editor */}
      <div className="flex-1 flex flex-col min-h-[300px] border-b md:border-b-0 md:border-r border-sub/10">
        <div className="flex items-center justify-between px-4 py-2 bg-[#252629] border-b border-sub/10">
          <div className="flex items-center gap-2 text-xs font-bold text-sub uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            main.py
          </div>
          <button onClick={handleReset} className="p-1 hover:text-main text-sub transition-colors" title="Reset">
            <RotateCcw size={14} />
          </button>
        </div>
        <div className="flex-1 p-4 bg-[#1e2022] overflow-auto font-mono text-sm leading-relaxed">
          <SyntaxHighlight code={code} currentLine={currentLine} />
        </div>
      </div>

      {/* RIGHT: Output & Variables */}
      <div className="flex-1 flex flex-col bg-[#161819] min-h-[300px]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1c1e] border-b border-sub/10">
          <span className="text-xs font-bold text-sub uppercase tracking-wider flex items-center gap-2">
            <Terminal size={12} /> Console
          </span>
          <div className="flex gap-2">
            <button
              onClick={runStep}
              disabled={currentStep >= executionSteps.length || isRunning}
              className="flex items-center gap-2 px-3 py-1 bg-sub/10 text-main border border-main/20 text-xs font-bold rounded hover:bg-main/20 transition-colors disabled:opacity-50"
            >
              <div className="w-2 h-2 rounded-full bg-main"></div> Step
            </button>
            <button
              onClick={runAll}
              disabled={isRunning}
              className="flex items-center gap-2 px-3 py-1 bg-main text-bg_dark text-xs font-bold rounded hover:bg-white transition-colors disabled:opacity-50"
            >
              <Play size={12} fill="currentColor" /> Run
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 font-mono text-sm border-b border-sub/10 overflow-y-auto max-h-[200px]">
          {output.length === 0 ? (
            <div className="text-sub/30 italic">Click Run to execute...</div>
          ) : (
            output.map((line, i) => (
              <div key={i} className="flex gap-2 text-green-400 mb-1">
                <span className="text-sub/30 select-none">&gt;</span>
                {line}
              </div>
            ))
          )}
        </div>

        <div className="h-[150px] bg-[#1a1c1e] flex flex-col">
          <div className="px-4 py-1.5 bg-[#252629] border-y border-sub/10 text-[10px] font-bold text-sub uppercase tracking-wider flex items-center gap-2">
            <Variable size={10} /> Variables
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {Object.keys(variables).length === 0 ? (
              <div className="text-sub/20 text-xs text-center mt-4">No variables</div>
            ) : (
              <table className="w-full text-xs font-mono text-left">
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
                      <td className="py-1.5 text-text">{JSON.stringify(val)}</td>
                      <td className="py-1.5 opacity-50">{Array.isArray(val) ? 'list' : typeof val}</td>
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
