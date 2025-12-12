import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ContentArea } from './components/ContentArea';
import { MENU_ITEMS } from './constants';
import { Menu, X, Terminal } from 'lucide-react';

const App: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string>(MENU_ITEMS[0].topics[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Flatten topics to calculate Next/Prev
  const allTopics = useMemo(() => MENU_ITEMS.flatMap(m => m.topics), []);

  const { prevTopic, nextTopic } = useMemo(() => {
    const currentIndex = allTopics.indexOf(selectedTopic);
    return {
      prevTopic: currentIndex > 0 ? allTopics[currentIndex - 1] : null,
      nextTopic: currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null
    };
  }, [selectedTopic, allTopics]);

  // Handle responsive check
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    if (isMobile) setIsSidebarOpen(false);
    // Scroll content area to top is handled inside ContentArea effect
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text font-mono selection:bg-main selection:text-bg_dark">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative z-30 h-full bg-bg_dark transition-all duration-300 ease-in-out border-r border-sub/10 flex flex-col shadow-xl
          ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:-translate-x-0 overflow-hidden'}
        `}
      >
        <div className="p-6 border-b border-sub/10 flex items-center gap-3 bg-bg_dark">
          <div className="p-2 bg-main/10 rounded-md">
            <Terminal className="text-main w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-main">pytaste</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <Sidebar 
            selectedTopic={selectedTopic} 
            onSelectTopic={handleTopicSelect} 
          />
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Top Bar (Mobile/Toggle) */}
        <header className="h-16 border-b border-sub/10 flex items-center px-6 justify-between bg-bg/95 backdrop-blur z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-sub/10 rounded-md transition-colors text-sub hover:text-main focus:outline-none focus:ring-2 focus:ring-main/50"
              aria-label="Toggle Menu"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex flex-col">
               <span className="text-[10px] text-sub uppercase tracking-widest font-bold">Currently Learning</span>
               <span className="text-sm font-semibold truncate max-w-[200px] md:max-w-none text-main">
                 {selectedTopic}
               </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-xs text-sub font-medium">
            <span className="px-2 py-1 rounded bg-sub/10 border border-sub/10">v3.12.0</span>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-900/20 text-green-400 rounded border border-green-900/30">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <span>Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth bg-bg">
          <ContentArea 
            topic={selectedTopic} 
            prevTopic={prevTopic}
            nextTopic={nextTopic}
            onNavigate={handleTopicSelect}
          />
        </div>

      </main>
    </div>
  );
};

export default App;