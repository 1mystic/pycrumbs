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
  const [stepIndex, setStepIndex] = useState<number>(-1);
  const preRef = useRef<HTMLPreElement>(null);

  // Sync state when prop changes
  useEffect(() => {
    setCode(initialCode);
    handleReset();
  }, [initialCode]);

  // Sync Prism highlight
  useEffect(() => {
    if (preRef.current && typeof Prism !== 'undefined') {
      // Small timeout to ensure DOM render before highlight
      // Prism highlightElement wipes DOM if we aren't careful, but we are using text content now.
      Prism.highlightElement(preRef.current.querySelector('code'));
    }
  }, [code]);

  const executeLine = (line: string, currentVars: Record<string, any>, currentOutput: string[]) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return { vars: currentVars, out: currentOutput };

    const newVars = { ...currentVars };
    const newOutput = [...currentOutput];

    try {
      // 0. Handle Function Definition (Start)
      const defMatch = trimmed.match(/^def\s+([a-zA-Z_]\w*)\((.*)\):$/);
      if (defMatch) {
        return {
          vars: { ...newVars, __definingFunction: { name: defMatch[1], args: defMatch[2].split(',').map(s => s.trim()).filter(Boolean), body: [] } },
          out: newOutput
        };
      }

      // 1. Handle Function Body Collection
      if (newVars.__definingFunction) {
        if (line.startsWith('  ') || line.startsWith('\t')) {
          newVars.__definingFunction.body.push(line.trim());
          return { vars: newVars, out: newOutput };
        } else {
          // End of function definition
          const funcName = newVars.__definingFunction.name;
          newVars[funcName] = { ...newVars.__definingFunction, type: 'function' };
          delete newVars.__definingFunction;
          // Fallthrough to execute current line
        }
      }

      // Assignments
      const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const rawValue = assignMatch[2];
        let val: any = rawValue;

        if ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
          val = rawValue.slice(1, -1);
        } else if (!isNaN(Number(rawValue))) {
          val = Number(rawValue);
        } else if (rawValue === 'True') val = true;
        else if (rawValue === 'False') val = false;
        else if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
          try { val = JSON.parse(rawValue.replace(/'/g, '"')); } catch (e) { val = rawValue; }
        }
        else if (newVars[rawValue] !== undefined) {
          val = newVars[rawValue];
        }

        const listMethod = rawValue.match(/^([a-zA-Z_]\w*)\.append\((.+)\)$/);
        if (listMethod) {
          const listName = listMethod[1];
          const item = listMethod[2].replace(/['"]/g, '');
          if (Array.isArray(newVars[listName])) {
            const arr = [...newVars[listName]];
            arr.push(item);
            newVars[listName] = arr;
            return { vars: newVars, out: newOutput };
          }
        }
        const listPop = rawValue.match(/^([a-zA-Z_]\w*)\.pop\((.*)\)$/);
        if (listPop) {
          const listName = listPop[1];
          if (Array.isArray(newVars[listName])) {
            const arr = [...newVars[listName]];
            const popped = arr.pop();
            newVars[listName] = arr;
            val = popped;
            // assignment captures popped value
          }
        }

        newVars[varName] = val;
      }

      // Print
      const printMatch = trimmed.match(/^print\((.+)\)$/);
      if (printMatch) {
        const content = printMatch[1].trim();
        if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
          newOutput.push(content.slice(1, -1));
        } else if (newVars[content] !== undefined) {
          // Basic formatting for list vs primitive
          const v = newVars[content];
          if (v && v.type === 'function') newOutput.push(`<function ${content}>`);
          else newOutput.push(typeof v === 'object' ? JSON.stringify(v).replace(/"/g, "'") : String(v));
        } else if (!isNaN(Number(content))) {
          newOutput.push(content);
        } else {
          if (content.includes('+')) {
            const parts = content.split('+').map(p => p.trim());
            const result = parts.reduce((acc, part) => {
              if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
                return acc + part.slice(1, -1);
              } else if (newVars[part] !== undefined) return acc + String(newVars[part]);
              return acc;
            }, "");
            newOutput.push(result);
          }
          else throw new Error(`NameError: '${content}' not defined`);
        }
      }

      // Function Call (Custom)
      const funcCallMatch = trimmed.match(/^([a-zA-Z_]\w*)\((.*)\)$/);
      if (funcCallMatch && !assignMatch && !printMatch) {
        const funcName = funcCallMatch[1];
        const args = funcCallMatch[2].split(',').map(s => s.trim()).filter(Boolean);

        if (newVars[funcName] && newVars[funcName].type === 'function') {
          const funcDef = newVars[funcName];

          // 1. Map args to local vars
          funcDef.args.forEach((argName: string, idx: number) => {
            let val = args[idx];
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            } else if (!isNaN(Number(val))) val = Number(val);

            newVars[argName] = val;
          });

          // 2. Execute Body
          let tempVars = { ...newVars };
          let tempOut = [...newOutput];

          // We must process lines sequentially, handling potential recursive calls (basic)
          // This does NOT handle complex indentation nesting inside the function yet
          funcDef.body.forEach((bodyLine: string) => {
            const res = executeLine(bodyLine, tempVars, tempOut);
            tempVars = res.vars;
            tempOut = res.out;
          });

          return { vars: newVars, out: tempOut };
        }
      }

      // Simple Method Calls (void return)
      const methodMatch = trimmed.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\((.*)\)$/);
      if (methodMatch && !assignMatch && !printMatch && !funcCallMatch) {
        const varName = methodMatch[1];
        const method = methodMatch[2];
        const args = methodMatch[3];

        if (newVars[varName] && Array.isArray(newVars[varName])) {
          if (method === 'append') {
            const val = args.replace(/['"]/g, '');
            newVars[varName] = [...newVars[varName], val];
          }
          else if (method === 'pop') {
            const arr = [...newVars[varName]];
            arr.pop();
            newVars[varName] = arr;
          }
          else if (method === 'sort') {
            const arr = [...newVars[varName]];
            arr.sort();
            newVars[varName] = arr;
          }
          else if (method === 'remove') {
            const val = args.replace(/['"]/g, '');
            const arr = [...newVars[varName]];
            const idx = arr.indexOf(val);
            if (idx > -1) arr.splice(idx, 1);
            newVars[varName] = arr;
          }
        }
      }

    } catch (e: any) {
      newOutput.push(e.message);
    }
    return { vars: newVars, out: newOutput };
  };

  const codeLines = code.split('\n');

  const handleStep = () => {
    let nextIndex = stepIndex + 1;
    while (nextIndex < codeLines.length) {
      const line = codeLines[nextIndex].trim();
      // Don't skip indented lines if we are inside a definition!
      // But our naive loop skips comments/empty lines
      if (line && !line.startsWith('#')) break;
      nextIndex++;
    }

    if (nextIndex >= codeLines.length) return;

    setStepIndex(nextIndex);
    const { vars, out } = executeLine(codeLines[nextIndex], variables, output);
    setVariables(vars);
    setOutput(out);
  };

  const runCode = () => {
    handleReset();
    let currentVars = {};
    let currentOut: string[] = [];

    codeLines.forEach((line) => {
      const res = executeLine(line, currentVars, currentOut);
      currentVars = res.vars;
      currentOut = res.out;
    });

    setVariables(currentVars);
    setOutput(currentOut);
    setStepIndex(codeLines.length);
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput([]);
    setVariables({});
    setStepIndex(-1);
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

        {/* Editor Container - Scrollable */}
        <div className="relative flex-1 bg-[#1e2022] overflow-auto group">
          {/* Wrapper to hold aligned layers */}
          <div className="relative min-h-full min-w-full inline-block">

            {/* Layer 1: Highlights */}
            <div className="absolute inset-0 z-0 pt-4 pointer-events-none font-mono text-sm leading-relaxed" aria-hidden="true">
              {codeLines.map((_, i) => (
                <div key={i} className={`w-full px-4 ${stepIndex === i ? 'bg-yellow-500/20' : ''}`}>
                  {/* Invisible char to force line height if empty, although loop goes by index */}
                  &nbsp;
                </div>
              ))}
            </div>

            {/* Layer 2: Prism Code */}
            {/* Note: overflow-visible allowed here because parent handles scroll */}
            <pre ref={preRef} className="relative z-10 p-4 m-0 font-mono text-sm leading-relaxed pointer-events-none bg-transparent overflow-visible">
              <code className="language-python">{code}</code>
            </pre>

            {/* Layer 3: Textarea Input */}
            <textarea
              value={code}
              onChange={(e) => { setCode(e.target.value); setStepIndex(-1); }}
              className="absolute inset-0 w-full h-full p-4 font-mono text-sm leading-relaxed bg-transparent text-transparent caret-main resize-none focus:outline-none z-20 selection:bg-main/20 selection:text-transparent overflow-hidden whitespace-pre"
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Output & Variables */}
      <div className="flex-1 flex flex-col bg-[#161819] min-h-[300px]">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1c1e] border-b border-sub/10">
          <span className="text-xs font-bold text-sub uppercase tracking-wider flex items-center gap-2">
            <Terminal size={12} /> Console
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleStep}
              disabled={stepIndex >= codeLines.length - 1}
              className="flex items-center gap-2 px-3 py-1 bg-sub/10 text-main border border-main/20 text-xs font-bold rounded hover:bg-main/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-2 h-2 rounded-full bg-main"></div> Step
            </button>
            <button
              onClick={runCode}
              className="flex items-center gap-2 px-3 py-1 bg-main text-bg_dark text-xs font-bold rounded hover:bg-white transition-colors"
            >
              <Play size={12} fill="currentColor" /> Run
            </button>
          </div>
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
                      <td className="py-1.5 text-text">{String(JSON.stringify(val))}</td>
                      <td className="py-1.5 opacity-50">{Array.isArray(val) ? 'list' : (val && val.type === 'function' ? 'function' : typeof val)}</td>
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