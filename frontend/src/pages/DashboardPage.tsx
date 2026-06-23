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
        {stats?.map((stat) => (
          <div key={stat.label} className="surface p-5">
            <p className="text-3xl font-extrabold text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
        {!dashboard && !error && [1, 2, 3].map((item) => (
          <div key={item} className="surface h-24 animate-pulse bg-slate-100" />
        ))}
      </div>

      {error && <div className="surface border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      {session?.savedCareers.length ? (
        <div className="gradient-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-teal-100">Saved Paths</p>
              <h2 className="mt-2 text-2xl font-black">Continue from your saved careers.</h2>
            </div>
            <button
              onClick={() => onNavigate('chat')}
              className="rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-950"
            >
              Open Mentor
            </button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {session.savedCareers.slice(-3).map((career) => (
              <div key={`${career.title}-${career.savedAt}`} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="font-extrabold text-white">{career.title}</p>
                <p className="mt-1 text-xs text-slate-300">{career.source || 'saved'}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
