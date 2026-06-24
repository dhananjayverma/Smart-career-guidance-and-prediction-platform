import { useEffect, useState } from 'react';
import {
  Award,
  Target,
  ArrowRight,
  Compass,
  BarChart3,
  MessageSquare,
  Sparkles,
  Building2,
  BookOpen,
  TrendingUp,
  Activity,
} from 'lucide-react';
import type { ElementType } from 'react';
import { getChatSession, getDashboard } from '../lib/api';
import type { SessionSnapshot } from '../lib/api';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

interface DashboardItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  color?: string;
  count?: string;
}

interface DashboardUpdate {
  label: string;
  time: string;
  icon: string;
  color: string;
}

interface DashboardData {
  quickLinks: DashboardItem[];
  services: DashboardItem[];
  stats: { label: string; value: string }[];
  updates: DashboardUpdate[];
}

const iconMap: Record<string, ElementType> = {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  Compass,
  MessageSquare,
  Sparkles,
  Target,
};

function CircularProgress({ percent, label, colorClass, shadowClass }: { percent: number; label: string; colorClass: string; shadowClass: string }) {
  const radius = 28;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="surface group p-5 flex items-center justify-between transition hover:-translate-y-1 hover:shadow-xl duration-300">
      <div>
        <p className="text-3xl font-black text-slate-900">{percent}%</p>
        <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
      </div>
      <div className="relative h-16 w-16">
        <svg className="h-full w-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={stroke}
            fill="transparent"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-0 m-auto h-2 w-2 rounded-full ${shadowClass} opacity-75 blur-xs group-hover:scale-125 transition-transform`} />
      </div>
    </div>
  );
}

function AnimatedNodes() {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:block overflow-hidden pointer-events-none opacity-20">
      <svg className="h-full w-full" viewBox="0 0 200 200">
        <line x1="50" y1="40" x2="110" y2="90" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" className="animate-pulse" />
        <line x1="110" y1="90" x2="60" y2="150" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="110" y1="90" x2="160" y2="80" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="160" y1="80" x2="130" y2="160" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

        <circle cx="50" cy="40" r="5" fill="#5eead4" className="animate-ping" style={{ animationDuration: '3s' }} />
        <circle cx="50" cy="40" r="4" fill="#5eead4" />

        <circle cx="110" cy="90" r="7" fill="#818cf8" className="animate-ping" style={{ animationDuration: '4s' }} />
        <circle cx="110" cy="90" r="5" fill="#818cf8" />

        <circle cx="60" cy="150" r="4" fill="#f472b6" />
        <circle cx="160" cy="80" r="4" fill="#38bdf8" />
        <circle cx="130" cy="160" r="4" fill="#5eead4" />

        <text x="120" y="70" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="bold">AI Engine</text>
        <text x="20" y="55" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="bold">DevOps</text>
      </svg>
    </div>
  );
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard<DashboardData>()
      .then((data) => {
        setDashboard(data);
        setError('');
      })
      .catch((apiError) => {
        console.warn('Dashboard API unavailable:', apiError);
        setError('Dashboard data backend se load nahi ho pa raha.');
      });

    const chatUserId = window.localStorage.getItem('nextstepai_chat_user_id');
    if (chatUserId) {
      getChatSession(chatUserId)
        .then(setSession)
        .catch((apiError) => console.warn('Session API unavailable:', apiError));
    }
  }, []);

  const stats = session?.stats?.length ? session.stats.slice(0, 3) : dashboard?.stats;

  return (
    <div className="space-y-6">
      <div className="page-hero">
        <AnimatedNodes />
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-teal-100">
              <Sparkles className="h-3.5 w-3.5" />
              NextStep AI
            </div>
            <h1 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">Plan smarter. Move faster.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Career choices, roadmaps, colleges, materials, and simulations in one focused workspace.
            </p>
          </div>
          <button
            onClick={() => onNavigate('chat')}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-950 transition hover:bg-slate-100"
          >
            Ask AI <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <CircularProgress
          percent={82}
          label="Career Readiness"
          colorClass="text-teal-500"
          shadowClass="bg-teal-500"
        />
        <CircularProgress
          percent={68}
          label="Skill Alignment"
          colorClass="text-indigo-500"
          shadowClass="bg-indigo-500"
        />
        <CircularProgress
          percent={Math.min(100, 25 + (session?.savedCareers?.length || 0) * 15 + (session?.messages?.length || 0) * 5)}
          label="Workspace Activity"
          colorClass="text-purple-500"
          shadowClass="bg-purple-500"
        />
      </div>

      {error && <div className="surface border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      <div className="gradient-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-teal-700">Advanced Workspace</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {session?.savedCareers.length ? 'Continue from your saved careers.' : 'Ask, save, compare, and build roadmaps from AI answers.'}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('chat')}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 transition shadow-sm"
            >
              Open Mentor
            </button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {session?.savedCareers.length ? session.savedCareers.slice(-3).map((career) => (
              <div key={`${career.title}-${career.savedAt}`} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <p className="font-extrabold text-slate-950">{career.title}</p>
                <p className="mt-1 text-xs text-slate-500">{career.source || 'saved'}</p>
              </div>
            )) : [
              { label: 'Best-match cards', desc: 'Backend decision score' },
              { label: 'Saved careers', desc: 'Persisted in session' },
              { label: 'Roadmap actions', desc: 'Prompt from AI result' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <p className="font-extrabold text-slate-950">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
      </div>

      {/* AI Mentorship Insights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">AI Mentorship Insights</h2>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-600">Personalized</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Market Shift',
              content: 'AI & Data Engineering roles are showing a 35% growth in salary matching for experienced developers.',
              tag: 'Trending',
              tagColor: 'text-amber-800 bg-amber-50 border-amber-200',
              bg: 'from-amber-50/80 via-white/95 to-orange-50/40 border-amber-200 text-slate-800'
            },
            {
              title: 'Interview Focus',
              content: 'System Design and scalable APIs are primary evaluation areas for developers with 3+ years experience.',
              tag: 'Skill Gap',
              tagColor: 'text-teal-800 bg-teal-50 border-teal-200',
              bg: 'from-teal-50/80 via-white/95 to-emerald-50/40 border-teal-200 text-slate-800'
            },
            {
              title: 'Roadmap Tip',
              content: 'Complete your saved roadmaps to generate matching mock tests and interview questions.',
              tag: 'Action Plan',
              tagColor: 'text-indigo-800 bg-indigo-50 border-indigo-200',
              bg: 'from-indigo-50/80 via-white/95 to-purple-50/40 border-indigo-200 text-slate-800'
            }
          ].map((insight, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${insight.bg} p-5 backdrop-blur-md shadow-md hover:shadow-lg transition duration-200`}
            >
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-white/50 to-white/0 blur-xl" />
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${insight.tagColor}`}>
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  {insight.tag}
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider opacity-45 text-slate-500">Insight #{idx + 1}</span>
              </div>
              <h3 className="text-sm font-black text-slate-900">{insight.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600 font-medium">{insight.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="section-title">Quick Services</h2>
        </div>
        <div className="grid md:grid-cols-4">
          {dashboard?.quickLinks.map((link) => {
            const Icon = iconMap[link.icon] || Target;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="group border-b border-slate-200 p-5 text-left transition hover:bg-slate-50 md:border-b-0 md:border-r last:border-r-0"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white transition group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-extrabold text-slate-950">{link.label}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{link.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {dashboard?.services.map((service) => {
          const Icon = iconMap[service.icon] || Target;
          return (
            <button
              key={service.id}
              onClick={() => onNavigate(service.id)}
              className="surface group p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/[0.06]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
                <div className="flex-1">
                  <p className="font-extrabold text-slate-950">{service.label}</p>
                  {service.count && <p className="text-sm text-slate-500">{service.count} available</p>}
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="section-title">Recent Updates</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {dashboard?.updates.map((update) => {
            const Icon = iconMap[update.icon] || Compass;
            return (
              <div key={update.label} className="flex items-center gap-3 px-5 py-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100">
                  <Icon className="h-4 w-4 text-slate-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{update.label}</p>
                  <p className="text-xs text-slate-500">{update.time}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-teal-600" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
