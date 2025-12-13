import React, { useState, useEffect } from 'react';
import { InteractiveData, VisualizationType } from '../types';
import { ArrowRight, Box, Cpu, List as ListIcon, Play, Terminal, RotateCcw } from 'lucide-react';
import { CodePlayground } from './CodePlayground';

interface VisualizerProps {
  data: InteractiveData;
}

export const Visualizer: React.FC<VisualizerProps> = ({ data }) => {
  const [activeStep, setActiveStep] = useState(0);

  // Reset activeStep when data changes (navigating to new topic)
  useEffect(() => {
    setActiveStep(0);
  }, [data]);
  if (!data || data.type === VisualizationType.NONE) return null;

  if (data.type === VisualizationType.PLAYGROUND) {
    // Render the playground without the default container wrapper to allow full width/styling
    return (
      <div className="my-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-sub/20"></div>
          <span className="text-xs font-bold text-sub uppercase tracking-widest flex items-center gap-2">
            <Cpu size={14} className="text-main" /> Interactive Playground
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-sub/20"></div>
        </div>
        <CodePlayground initialCode={data.data.initialCode || ""} steps={data.data.steps} />
      </div>
    );
  }

  const renderContent = () => {
    switch (data.type) {
      case VisualizationType.MEMORY_BOX:
        return (
          <div className="flex flex-wrap gap-6 justify-center w-full">
            {data.data.variables?.map((v: any, i: number) => (
              <div key={i} className="bg-[#1e2022] border border-sub/10 rounded-lg p-4 shadow-xl min-w-[160px] transform hover:scale-105 transition-transform duration-300">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-[10px] text-sub font-mono bg-sub/10 px-1 rounded">{v.address || '0x???'}</div>
                  <Box size={12} className="text-main" />
                </div>
                <div className="text-main font-bold text-lg mb-1 truncate" title={v.name}>{v.name}</div>
                <div className="h-px bg-sub/10 my-2"></div>
                <div className="text-text font-mono bg-bg_dark p-2 rounded text-center text-sm border border-sub/5 shadow-inner">
                  {v.value}
                </div>
              </div>
            ))}
          </div>
        );

      case VisualizationType.LIST_ARRAY:
        return (
          <div className="flex flex-col gap-4 items-center w-full pb-4">
            <div className="flex gap-2 overflow-x-auto w-full justify-center py-2 px-1">
              {data.data.items?.map((item: string, i: number) => (
                <div key={i} className="flex flex-col items-center group relative shrink-0">
                  <div className="absolute -top-6 text-[10px] text-sub font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                    [{i}]
                  </div>
                  <div className="min-w-[4rem] h-16 md:h-20 px-3 border-2 border-sub/20 flex items-center justify-center bg-[#1e2022] text-text font-mono text-sm md:text-lg rounded-lg hover:border-main hover:text-main hover:-translate-y-1 transition-all shadow-md whitespace-nowrap">
                    {item}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-sub italic mt-2">Hover to see indices</div>
          </div>
        );

      case VisualizationType.FLOWCHART:
        return (
          <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
            {data.data.steps?.map((step: string, i: number) => (
              <React.Fragment key={i}>
                <div className={`
                  p-4 rounded-lg border text-sm font-medium w-full text-center transition-all duration-500 relative
                  ${i <= activeStep
                    ? 'border-main bg-main/10 text-main shadow-[0_0_20px_rgba(251,191,36,0.15)] scale-105 z-10'
                    : 'border-sub/20 text-sub bg-[#1e2022] opacity-60'
                  }
                `}>
                  {step}
                  {i === activeStep && (
                    <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-main rounded-full animate-ping"></span>
                  )}
                </div>
                {i < (data.data.steps.length - 1) && (
                  <ArrowRight className={`rotate-90 my-1 transition-colors ${i < activeStep ? 'text-main' : 'text-sub/20'}`} />
                )}
              </React.Fragment>
            ))}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setActiveStep(prev => Math.min(prev + 1, (data.data.steps?.length || 1) - 1))}
                disabled={activeStep === (data.data.steps?.length || 1) - 1}
                className="flex items-center gap-2 px-5 py-2 bg-main text-bg_dark font-bold rounded-md hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-main"
              >
                <Play size={16} fill="currentColor" /> Next Step
              </button>
              <button
                onClick={() => setActiveStep(0)}
                className="p-2 bg-sub/10 text-sub hover:text-text rounded-md transition-colors"
                title="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        );

      case VisualizationType.CONSOLE:
        return (
          <div className="w-full max-w-2xl bg-[#0f0f10] rounded-lg overflow-hidden border border-sub/20 shadow-2xl font-mono text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1b1e] border-b border-sub/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <span className="ml-2 text-xs text-sub/60">terminal</span>
            </div>
            <div className="p-4 space-y-2 min-h-[200px]">
              {data.data.logs?.map((log: string, i: number) => (
                <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-sub/40 select-none">$</span>
                  <span className="text-text">{log}</span>
                </div>
              ))}
              <div className="flex gap-3">
                <span className="text-main font-bold animate-pulse">{'>'}</span>
                <span className="typing-cursor"></span>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="text-sub italic">Interactive visualization not available.</div>;
    }
  };

  return (
    <div className="my-10 rounded-xl overflow-hidden border border-sub/10 bg-[#161819] shadow-lg">
      <div className="bg-[#1a1c1e] border-b border-sub/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-main uppercase tracking-widest">
          <Cpu size={16} />
          <span>Interactive: {data.label || 'Visualization'}</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-sub/30"></div>
          <div className="w-1 h-1 rounded-full bg-sub/30"></div>
          <div className="w-1 h-1 rounded-full bg-sub/30"></div>
        </div>
      </div>
      <div className="p-8 flex items-center justify-center min-h-[300px] bg-gradient-to-b from-transparent to-black/20">
        {renderContent()}
      </div>
    </div>
  );
};