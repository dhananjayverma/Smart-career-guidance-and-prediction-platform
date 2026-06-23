import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { getHome } from '../lib/api';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

interface HomeData {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    placeholder: string;
    buttonLabel: string;
  };
  highlights: { label: string; desc: string }[];
  quickActions: { id: string; label: string; desc: string }[];
  stats: { value: string; label: string }[];
  steps: { step: string; title: string; desc: string }[];
  cta: { eyebrow: string; title: string; desc: string; buttonLabel: string; target: string };
  sectionLabels: { guidedFlow: string };
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [mainInput, setMainInput] = useState('');
  const [homeData, setHomeData] = useState<HomeData | null>(null);

  useEffect(() => {
    getHome<HomeData>()
      .then(setHomeData)
      .catch((error) => console.warn('Home API unavailable:', error));
  }, []);

  const hero = homeData?.hero;
  const highlights = homeData?.highlights ?? [];
  const quickActions = homeData?.quickActions ?? [];
  const stats = homeData?.stats ?? [];
  const steps = homeData?.steps ?? [];
  const cta = homeData?.cta;

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <div className="page-hero p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-teal-100">
              <Sparkles className="h-3.5 w-3.5" />
              {hero?.badge}
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">{hero?.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              {hero?.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {highlights.map((item) => (
                <span key={item.label} title={item.desc} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white">
                  <CheckCircle className="h-3.5 w-3.5 text-teal-200" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-3 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-3 grid grid-cols-3 gap-2">
              {quickActions.slice(0, 3).map((action) => (
                <button key={action.id} onClick={() => onNavigate(action.id)} className="rounded-2xl bg-white/10 p-3 text-left transition hover:bg-white/15">
                  <Sparkles className="mb-3 h-5 w-5 text-teal-200" />
                  <p className="text-xs font-bold text-white">{action.label}</p>
                  <p className="text-[11px] text-slate-300">{action.desc}</p>
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-2">
              <div className="flex gap-2">
              <input
                type="text"
                value={mainInput}
                onChange={(e) => setMainInput(e.target.value)}
                placeholder={hero?.placeholder || ''}
                className="min-w-0 flex-1 rounded-xl border-0 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                onClick={() => onNavigate('chat')}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-teal-300"
              >
                <MessageSquare className="h-4 w-4" />
                {hero?.buttonLabel}
              </button>
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-gradient-to-r from-teal-400/20 to-indigo-400/20 p-4">
              <p className="text-xs font-bold uppercase text-teal-100">{homeData?.sectionLabels.guidedFlow}</p>
              <div className="mt-3 grid gap-2">
                {steps.map((step) => (
                  <div key={step.step} className="rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-xs font-bold text-white">{step.title}</p>
                    <p className="text-[11px] text-slate-300">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {quickActions.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="accent-card group text-left transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/[0.08]"
          >
            <p className="font-extrabold text-slate-950">{item.label}</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">{item.desc}</p>
            <div className="mt-5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="surface p-5 sm:p-7">
        <div className="grid gap-4 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50 p-5">
              <p className="text-3xl font-black text-slate-950">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
        </div>
        {cta && <div className="gradient-card">
          <p className="text-sm font-extrabold text-teal-100">{cta.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black">{cta.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{cta.desc}</p>
          <button
            onClick={() => onNavigate(cta.target)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-slate-950"
          >
            {cta.buttonLabel} <ArrowRight className="h-4 w-4" />
          </button>
        </div>}
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-200/80 bg-gradient-to-r from-white to-teal-50 px-5 py-4">
          <p className="section-title">{homeData?.sectionLabels.guidedFlow}</p>
        </div>
        <div className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
              <div className="mb-5 grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-950 to-indigo-950 text-sm font-extrabold text-white shadow-lg shadow-indigo-950/20">
                {item.step}
              </div>
              <div>
                <p className="font-extrabold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
