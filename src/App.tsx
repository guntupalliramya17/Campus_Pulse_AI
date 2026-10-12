import { AuthGate } from './AuthGate';
import { useState, useMemo } from 'react';
import { AppProvider, useAppStore } from '@/store/AppStore';
import { Sidebar } from '@/components/Sidebar';
import { FilterBar } from '@/components/FilterBar';
import { StudentProfile } from '@/components/StudentProfile';
import { CommandCenter } from '@/pages/CommandCenter';
import { StudentExplorer } from '@/pages/StudentExplorer';
import { PredictiveIntelligence } from '@/pages/PredictiveIntelligence';
import { InterventionLab } from '@/pages/InterventionLab';
import { ResourceOptimizer } from '@/pages/ResourceOptimizer';
import { AIAnalyst } from '@/pages/AIAnalyst';
import { DataIntegration } from '@/pages/DataIntegration';
import { OutcomesImpact } from '@/pages/OutcomesImpact';
import { Settings } from '@/pages/Settings';
import type { PageId } from '@/types';
import { Menu } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageId>('command-center');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { students } = useAppStore();

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageId);
  };

  const pageContent = useMemo(() => {
    switch (currentPage) {
      case 'command-center':
        return <CommandCenter onNavigate={handleNavigate} />;
      case 'student-explorer':
        return <StudentExplorer />;
      case 'predictive-intelligence':
        return <PredictiveIntelligence />;
      case 'intervention-lab':
        return <InterventionLab />;
      case 'resource-optimizer':
        return <ResourceOptimizer />;
      case 'ai-analyst':
        return <AIAnalyst />;
      case 'data-integration':
        return <DataIntegration />;
      case 'outcomes-impact':
        return <OutcomesImpact />;
      case 'settings':
        return <Settings />;
      default:
        return <CommandCenter onNavigate={handleNavigate} />;
    }
  }, [currentPage]);

  return (
    <div className="flex min-h-screen bg-midnight-950">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between border-b border-midnight-700/60 bg-midnight-950/90 px-4 py-3 sticky top-0 z-20 backdrop-blur-xl">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-lg p-1.5 text-midnight-300 hover:bg-midnight-700/40 hover:text-midnight-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-gradient-to-br from-teal-500 to-violet-500 p-1">
              <span className="text-[10px] font-bold text-midnight-950 block px-1">CP</span>
            </div>
            <span className="text-sm font-bold text-midnight-50">CAMPUS PULSE AI</span>
          </div>
          <div className="w-7" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto w-full animate-fade-in">
          {pageContent}
        </main>

        {/* Footer */}
        <footer className="border-t border-midnight-700/40 px-6 py-3 text-center text-xs text-midnight-500">
          CAMPUS PULSE AI · Predict. Explain. Simulate. Improve. · All data is synthetic demonstration data · {students.length} students analyzed
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
