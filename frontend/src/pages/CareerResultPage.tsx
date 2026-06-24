import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Clock,
  Filter,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { getCareers } from '../lib/api';

interface CareerOption {
  id: string;
  title: string;
  category: string;
  duration: string;
  salary: string;
  difficulty: string;
  growth: string;
  skills: string[];
  pros?: string;
  cons?: string;
  roadmapDuration?: string;
}

export default function CareerResultPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [allCareers, setAllCareers] = useState<CareerOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getCareers<CareerOption[]>('All')
      .then((data) => {
        setAllCareers(data);
        setError('');
      })
      .catch((apiError) => {
        console.warn('Career API unavailable:', apiError);
        setError('Career data backend se load nahi ho pa raha.');
      });
  }, []);

  useEffect(() => {
    getCareers<CareerOption[]>(selectedCategory)
      .then((data) => {
        setCareers(data);
        setError('');
      })
      .catch((apiError) => {
        console.warn('Career API unavailable:', apiError);
        setCareers([]);
        setError('Career data backend se load nahi ho pa raha.');
      });
  }, [selectedCategory]);

  const categories = ['All', ...Array.from(new Set(allCareers.map((career) => career.category)))];
  const filteredCareers = careers.filter(
    (career) => {
      const haystack = `${career.title} ${career.category} ${career.skills.join(' ')} ${career.pros || ''} ${career.cons || ''}`.toLowerCase();
      const matchesCategory = selectedCategory === 'All' || career.category === selectedCategory;
      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    }
  );
  const highGrowth = filteredCareers.filter((career) => /very high|high/i.test(career.growth)).length;
  const fastEntry = filteredCareers.filter((career) => /month|6-|3-|variable/i.test(career.duration)).length;
  const featuredCareers = filteredCareers
    .filter((career) => /very high|highest/i.test(career.growth))
    .slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="page-hero p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_460px] xl:items-end">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-white text-slate-950 shadow-xl shadow-black/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-100">NextStep AI Explorer</p>
              <h1 className="mt-2 text-4xl font-black leading-tight">Find the right career path.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Search across fields, compare difficulty, salary, growth, skills, pros, cons, and roadmap duration.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-2xl font-black">{allCareers.length}</p>
              <p className="text-[11px] font-bold text-teal-100">Paths</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-2xl font-black">{categories.length - 1}</p>
              <p className="text-[11px] font-bold text-teal-100">Fields</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4">
              <p className="text-2xl font-black">{highGrowth}</p>
              <p className="text-[11px] font-bold text-teal-100">High Growth</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="surface p-4">
            <p className="section-title mb-3">Search</p>
            <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search career, skill, field"
              className="input-field pl-9"
            />
            </div>
          </div>
          <div className="surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="section-title">Fields</span>
            </div>
            <div className="grid gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left text-xs font-black transition ${
                    selectedCategory === category
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>{category}</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5">
                    {category === 'All' ? allCareers.length : allCareers.filter((career) => career.category === category).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-card p-4">
            <p className="text-sm font-black text-teal-100">Summary</p>
            <div className="mt-4 grid grid-cols-3 gap-2 xl:grid-cols-1">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-2xl font-black text-white">{filteredCareers.length}</p>
                <p className="text-[11px] font-bold text-slate-300">Matching</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-2xl font-black text-white">{highGrowth}</p>
                <p className="text-[11px] font-bold text-slate-300">High growth</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-2xl font-black text-white">{fastEntry}</p>
                <p className="text-[11px] font-bold text-slate-300">Fast entry</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          {featuredCareers.length > 0 && (
            <div className="surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-white to-teal-50 px-5 py-4">
                <div>
                  <p className="section-title">Featured High-Growth Paths</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Best quick scan before exploring all paths.</p>
                </div>
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
              <div className="grid gap-3 p-4 lg:grid-cols-3">
                {featuredCareers.map((career) => (
                  <div key={career.id} className="rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-900 p-4 text-white">
                    <p className="text-sm font-black">{career.title}</p>
                    <p className="mt-1 text-xs text-slate-300">{career.category}</p>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-teal-100">
                      <span>{career.salary}</span>
                      <span>{career.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

      {error && <div className="surface border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      <div className="grid gap-4 2xl:grid-cols-2">
        {filteredCareers.map((career) => (
          <div
            key={career.id}
            className="surface group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-950/[0.08]"
          >
            <div className="grid min-h-full lg:grid-cols-[1fr_190px]">
              <div className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-slate-950 text-white">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-950">{career.title}</h3>
                      <p className="text-sm font-semibold text-slate-500">{career.category}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {career.difficulty}
                  </span>
                </div>

                <div className="mb-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <Clock className="mb-2 h-4 w-4 text-slate-500" />
                    <p className="text-[10px] font-black uppercase text-slate-500">Duration</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{career.duration}</p>
                  </div>
                  <div className="rounded-2xl bg-teal-50 p-3">
                    <Wallet className="mb-2 h-4 w-4 text-teal-700" />
                    <p className="text-[10px] font-black uppercase text-teal-700">Salary</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{career.salary}</p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 p-3">
                    <TrendingUp className="mb-2 h-4 w-4 text-indigo-700" />
                    <p className="text-[10px] font-black uppercase text-indigo-700">Growth</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">{career.growth}</p>
                  </div>
                </div>

                <div className="mb-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3">
                    <p className="text-[10px] font-black uppercase text-teal-700">Why choose it</p>
                    <p className="mt-1 text-xs leading-5 text-slate-700">{career.pros || 'Practical career opportunity'}</p>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3">
                    <p className="text-[10px] font-black uppercase text-rose-700">Watch out</p>
                    <p className="mt-1 text-xs leading-5 text-slate-700">{career.cons || 'Needs consistent practice'}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Key Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {career.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-900 p-5 text-white">
                <div>
                  <Target className="mb-4 h-5 w-5 text-teal-200" />
                  <p className="text-[10px] font-black uppercase text-teal-100">Roadmap</p>
                  <p className="mt-1 text-lg font-black">{career.roadmapDuration || career.duration}</p>
                  <p className="mt-3 text-xs leading-5 text-slate-300">Use AI Mentor to get a personalized step-by-step plan for this path.</p>
                </div>
                <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-teal-50">
                  Explore <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!filteredCareers.length && !error && (
        <div className="surface p-8 text-center">
          <p className="text-lg font-black text-slate-950">No matching career found</p>
          <p className="mt-1 text-sm text-slate-500">Try another skill, category, or field name.</p>
        </div>
      )}
        </section>
      </div>
    </div>
  );
}
