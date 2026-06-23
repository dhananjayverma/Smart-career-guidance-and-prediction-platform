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
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-slate-950 text-white">
      <div className="loader-grid" />
      <div className="loader-glow loader-glow-one" />
      <div className="loader-glow loader-glow-two" />

      <div className="relative z-10 w-full max-w-md px-6 text-center">
        <div className="mx-auto mb-7 grid h-24 w-24 place-items-center rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl shadow-teal-500/20 backdrop-blur-xl">
          <div className="loader-orbit">
            <Sparkles className="h-10 w-10 text-teal-200" />
          </div>
        </div>

        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.32em] text-teal-200">Launching</p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{productName}</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-300">
          Preparing your career intelligence workspace.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur-xl">
          <div className="h-3 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-300 via-white to-indigo-300 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 text-xs font-bold text-slate-400">
          <span>{progress}%</span>
          <span className="h-1 w-1 rounded-full bg-slate-600" />
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

  const renderNavGroup = (items: NavItem[]) => (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = iconMap[item.icon] || Compass;
        const selected = activePage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActivePage(item.id);
              setSidebarOpen(false);
            }}
            className={`nav-item ${selected ? 'nav-item-active' : ''}`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-4 py-5 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-3 text-left"
          aria-label="Open dashboard"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-950 shadow-lg shadow-teal-400/20">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-extrabold text-white">{productName}</span>
            <span className="block text-xs font-medium text-teal-100/80">Career intelligence</span>
          </span>
        </button>
        <button
          onClick={() => setSidebarOpen(false)}
          className="icon-button lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6">
        {renderNavGroup(groupedNav.primary)}
        {groupedNav.secondary.length > 0 && (
          <div>
            <p className="px-3 pb-2 text-[11px] font-bold uppercase text-teal-100/50">Tools</p>
            {renderNavGroup(groupedNav.secondary)}
          </div>
        )}
      </nav>

      <button
        onClick={() => setActivePage('settings')}
        className={`nav-item mt-4 ${activePage === 'settings' ? 'nav-item-active' : ''}`}
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </button>
    </aside>
  );

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-teal-50 text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(120deg,rgba(20,184,166,0.16),transparent_34%,rgba(99,102,241,0.16)),repeating-linear-gradient(90deg,rgba(15,23,42,0.035)_0_1px,transparent_1px_96px)]" />

      <div className="relative flex min-h-screen">
        <div className="hidden lg:block">{sidebar}</div>

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

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
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
                onClick={() => setActivePage('chat')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-950 to-indigo-950 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-950/20 transition hover:scale-[1.02]"
              >
                <MessageSquare className="h-4 w-4" />
                Ask AI
              </button>
            </div>
          </header>

          {navError && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3">
                <span>{navError}</span>
                <button onClick={loadNavigation} className="font-bold underline underline-offset-2">
                  Retry
                </button>
              </div>
            </div>
          )}

          <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-7 sm:px-6 lg:px-10">
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
