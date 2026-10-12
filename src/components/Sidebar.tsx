import type { PageId } from '@/types';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard, Users, Brain, FlaskConical, Layers,
  MessageSquare, Database, TrendingUp, Settings, Activity, X,
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard; description: string }[] = [
  { id: 'command-center', label: 'Command Center', icon: LayoutDashboard, description: 'Executive dashboard overview' },
  { id: 'student-explorer', label: 'Student Explorer', icon: Users, description: 'Search and profile exploration' },
  { id: 'predictive-intelligence', label: 'Predictive Intelligence', icon: Brain, description: 'Risk segmentation & analysis' },
  { id: 'intervention-lab', label: 'Intervention Lab', icon: FlaskConical, description: 'What-if simulation engine' },
  { id: 'resource-optimizer', label: 'Resource Optimizer', icon: Layers, description: 'Intervention prioritization' },
  { id: 'ai-analyst', label: 'AI Campus Analyst', icon: MessageSquare, description: 'Conversational analytics' },
  { id: 'data-integration', label: 'Data Integration', icon: Database, description: 'CSV import & validation' },
  { id: 'outcomes-impact', label: 'Outcomes & Impact', icon: TrendingUp, description: 'Intervention tracking' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Scoring & risk configuration' },
];

export function Sidebar({ currentPage, onNavigate, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-midnight-950/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 border-r border-midnight-700/60 bg-midnight-950/95 backdrop-blur-xl transition-transform duration-300',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between border-b border-midnight-700/60 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-gradient-to-br from-teal-500 to-violet-500 p-2">
              <Activity className="w-5 h-5 text-midnight-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-midnight-50 tracking-tight">CAMPUS PULSE</h1>
              <p className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">AI Intelligence</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden rounded-lg p-1 text-midnight-400 hover:bg-midnight-700/50 hover:text-midnight-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 max-h-[calc(100vh-160px)]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onMobileClose();
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                  isActive
                    ? 'bg-teal-500/10 text-teal-300 border-l-2 border-teal-500'
                    : 'text-midnight-300 hover:bg-midnight-700/30 hover:text-midnight-100 border-l-2 border-transparent'
                )}
              >
                <Icon
                  className={cn(
                    'w-4.5 h-4.5 shrink-0 transition-colors',
                    isActive ? 'text-teal-400' : 'text-midnight-400 group-hover:text-midnight-200'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', isActive ? 'text-teal-200' : '')}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-midnight-500 truncate">{item.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-midnight-700/60 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] text-midnight-500">
            <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse-slow" />
            <span>Demo Mode · All data is synthetic</span>
          </div>
        </div>
      </aside>
    </>
  );
}
