import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart2,
  BookOpen,
  Building2,
  Compass,
  Home,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import type { ElementType } from 'react';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import CareerResultPage from './pages/CareerResultPage';
import RoadmapPage from './pages/RoadmapPage';
import CollegePage from './pages/CollegePage';
import StudyMaterialPage from './pages/StudyMaterialPage';
import ComparePage from './pages/ComparePage';
import SimulationPage from './pages/SimulationPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { getNavigation } from './lib/api';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  group: 'primary' | 'secondary';
}

const iconMap: Record<string, ElementType> = {
  Award,
  BarChart2,
  BookOpen,
  Building2,
  Compass,
  Home,
  MessageSquare,
  Settings,
  Sparkles,
  Target,
};

const productName = 'NextStep AI';

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          window.clearInterval(interval);
          window.setTimeout(onComplete, 350);
          return 100;
        }

        return Math.min(current + Math.ceil(Math.random() * 8), 100);
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#f6f8fa] text-slate-950">
      <div className="loader-grid opacity-25" />
      <div className="loader-glow loader-glow-one opacity-30" />
      <div className="loader-glow loader-glow-two opacity-30" />

      <div className="relative z-10 w-full max-w-md px-6 text-center">
        <div className="mx-auto mb-7 grid h-24 w-24 place-items-center rounded-[2rem] border border-slate-200 bg-white shadow-lg backdrop-blur-xl">
          <div className="loader-orbit">
            <Sparkles className="h-10 w-10 text-teal-600" />
          </div>
        </div>

        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.32em] text-teal-600">Launching</p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl text-slate-900">{productName}</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-500 font-medium">
          Preparing your career intelligence workspace.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 text-xs font-bold text-slate-400">
          <span>{progress}%</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>Building your next step</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [navError, setNavError] = useState('');
  const [userProfile] = useState({
    name: '',
    education: '',
    interests: [] as string[],
    language: 'hinglish' as 'hindi' | 'hinglish' | 'english',
  });

  const loadNavigation = useCallback(() => {
    setNavError('');
    getNavigation<NavItem[]>()
      .then((items) => {
        setNavItems(items);
        setNavError('');
      })
      .catch((error) => {
        console.warn('Navigation API unavailable:', error);
        setNavItems([]);
        setNavError('Navigation load failed. Start backend or check VITE_API_URL.');
      });
  }, []);

  useEffect(() => {
    loadNavigation();
  }, [loadNavigation]);

  const activeLabel = useMemo(
    () => navItems.find((item) => item.id === activePage)?.label || 'Dashboard',
    [activePage, navItems]
  );

  const groupedNav = useMemo(
    () => ({
      primary: navItems.filter((item) => item.group === 'primary'),
      secondary: navItems.filter((item) => item.group === 'secondary'),
    }),
    [navItems]
  );

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={setActivePage} />;
      case 'chat':
        return <ChatPage userProfile={userProfile} />;
      case 'careers':
        return <CareerResultPage />;
      case 'roadmap':
        return <RoadmapPage />;
      case 'colleges':
        return <CollegePage />;
      case 'materials':
        return <StudyMaterialPage />;
      case 'compare':
        return <ComparePage />;
      case 'simulation':
        return <SimulationPage />;
      case 'settings':
        return <SettingsPage />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const renderNavGroup = (items: NavItem[]) => (
    <div className="space-y-1.5">
      {items.map((item) => {
        const Icon = iconMap[item.icon] || Compass;
        const selected = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className={`nav-item ${selected ? 'nav-item-active' : ''}`}
          >
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-slate-100">
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const sidebar = (
    <aside className="flex h-full w-72 flex-col overflow-hidden border-r border-slate-200 bg-white/95 px-4 py-5 text-slate-800 shadow-sm backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => handleNavigate('dashboard')}
          className="flex min-w-0 items-center gap-3 text-left"
          aria-label="Open dashboard"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-indigo-950/20">
            <Sparkles className="h-5 w-5 text-teal-300" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-extrabold text-slate-900">{productName}</span>
            <span className="block text-xs font-semibold text-teal-700">Career intelligence</span>
          </span>
        </button>
        <button
          onClick={() => setSidebarOpen(false)}
          className="icon-button lg:hidden bg-slate-100 hover:bg-slate-200 border-slate-200"
          aria-label="Close menu"
        >
          <X className="h-5 w-5 text-slate-700" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        {renderNavGroup(groupedNav.primary)}
        {groupedNav.secondary.length > 0 && (
          <div>
            <p className="px-3 pb-2 text-[11px] font-black uppercase text-slate-400">Tools</p>
            {renderNavGroup(groupedNav.secondary)}
          </div>
        )}
      </nav>

      <button
        onClick={() => handleNavigate('settings')}
        className={`nav-item mt-4 ${activePage === 'settings' ? 'nav-item-active' : ''}`}
      >
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
          <Settings className="h-4 w-4" />
        </span>
        <span className="truncate">Settings</span>
      </button>
    </aside>
  );

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-950">
      {/* Subtle blur highlights in the corners for a premium feel */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[30%] -left-[10%] h-[70%] w-[50%] rounded-full bg-indigo-200/25 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[5%] h-[60%] w-[40%] rounded-full bg-teal-100/30 blur-[100px]" />
      </div>

      <div className="relative flex h-full w-full min-w-0 flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block h-full flex-shrink-0 z-20">
          {sidebar}
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebar}
        </div>

        {/* Main Work Area */}
        <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
          <header className="h-16 flex-shrink-0 border-b border-white/60 bg-white/75 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl flex items-center">
            <div className="flex w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="icon-button lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-500">{productName}</p>
                  <h1 className="truncate text-lg font-extrabold text-slate-950 sm:text-xl">{activeLabel}</h1>
                </div>
              </div>
              <button
                onClick={() => handleNavigate('chat')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-950/20 transition hover:scale-[1.02]"
              >
                <MessageSquare className="h-4 w-4" />
                Ask AI
              </button>
            </div>
          </header>

          {navError && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6 lg:px-8 flex-shrink-0">
              <div className="flex items-center justify-between gap-3">
                <span>{navError}</span>
                <button onClick={loadNavigation} className="font-bold underline underline-offset-2">
                  Retry
                </button>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto px-4 py-7 sm:px-6 lg:px-10">
            <div className="mx-auto w-full max-w-[1500px]">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
