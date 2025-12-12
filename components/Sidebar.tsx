import React, { useState } from 'react';
import { MENU_ITEMS } from '../constants';
import { ChevronRight, ChevronDown, Hash, User } from 'lucide-react';

interface SidebarProps {
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedTopic, onSelectTopic }) => {
  // Initialize all modules as open by default for easier navigation
  const [openModules, setOpenModules] = useState<number[]>(MENU_ITEMS.map((_, i) => i));

  const toggleModule = (index: number) => {
    setOpenModules(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const isAboutMeActive = selectedTopic === "About Me";

  return (
    <div className="flex flex-col gap-6 pb-20">
      {MENU_ITEMS.map((module, moduleIdx) => (
        <div key={moduleIdx} className="group">
          <button
            onClick={() => toggleModule(moduleIdx)}
            className="flex items-center gap-2 w-full text-left text-sm font-bold text-sub hover:text-text transition-colors mb-2 uppercase tracking-wider"
          >
            {openModules.includes(moduleIdx) ? (
              <ChevronDown size={14} className="text-main" />
            ) : (
              <ChevronRight size={14} />
            )}
            {module.title}
          </button>

          <div className={`
            flex flex-col border-l border-sub/20 ml-2.5 pl-4 gap-1 transition-all duration-300 overflow-hidden
            ${openModules.includes(moduleIdx) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
          `}>
            {module.topics.map((topic, topicIdx) => {
              const isActive = selectedTopic === topic;
              return (
                <button
                  key={topicIdx}
                  onClick={() => onSelectTopic(topic)}
                  className={`
                    text-left text-sm py-1.5 px-2 rounded-md transition-all duration-200 flex items-center gap-2
                    ${isActive
                      ? 'bg-main/10 text-main font-medium translate-x-1'
                      : 'text-sub hover:text-text hover:bg-sub/10'
                    }
                  `}
                >
                  {isActive && <Hash size={12} />}
                  {topic}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Separator */}
      <div className="border-t border-sub/20 my-1"></div>

      {/* About Me Section - Separate */}
      <button
        onClick={() => onSelectTopic("About Me")}
        className={`
          text-left text-sm py-2 px-3 rounded-md transition-all duration-200 flex items-center gap-1
          ${isAboutMeActive
            ? 'bg-main/10 text-main font-medium'
            : 'text-sub hover:text-text hover:bg-sub/10'
          }
        `}
      >
        <User size={14} />
        About Me
      </button>
    </div>
  );
};