import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Award,
  Rocket,
  Play,
  ShieldAlert,
  Wallet,
  LineChart,
  Activity,
} from 'lucide-react';
import type { ElementType } from 'react';
import { getSimulations } from '../lib/api';

interface SimulationScenario {
  id: string;
  title: string;
  icon: string;
  outcomes: { year: number; title: string; salary: string; status: string; description: string }[];
  risk: string;
  investment: string;
  year1Salary?: string;
  year3Salary?: string;
  requiredSkills?: string[];
  dailyRoutine?: string[];
  competitionLevel?: string;
}

const iconMap: Record<string, ElementType> = {
  Award,
  Briefcase,
  Rocket,
};

const statusCopy = {
  growth: { label: 'Growth', icon: TrendingUp, className: 'bg-teal-50 border-teal-200 text-teal-800' },
  stable: { label: 'Stable', icon: Activity, className: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  struggle: { label: 'Challenging', icon: TrendingDown, className: 'bg-rose-50 border-rose-200 text-rose-800' },
};

export default function SimulationPage() {
  const [simulations, setSimulations] = useState<SimulationScenario[]>([]);
  const [selectedSimulation, setSelectedSimulation] = useState<SimulationScenario | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentYear, setCurrentYear] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    getSimulations<SimulationScenario[]>()
      .then((data) => {
        setSimulations(data);
        setSelectedSimulation(data[0] || null);
        setError('');
      })
      .catch((apiError) => {
        console.warn('Simulation API unavailable:', apiError);
        setError('Simulation data backend se load nahi ho pa raha.');
      });
  }, []);

  const runSimulation = () => {
    if (!selectedSimulation) return;
    setIsAnimating(true);
    setCurrentYear(0);
    let year = 0;
    const interval = setInterval(() => {
      year++;
      setCurrentYear(year);
      if (year >= selectedSimulation.outcomes.length) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 650);
  };

  const visibleOutcomes = selectedSimulation?.outcomes.filter((_, index) => !isAnimating || index < currentYear) || [];
  const finalOutcome = selectedSimulation?.outcomes[selectedSimulation.outcomes.length - 1];
  const growthYears = selectedSimulation?.outcomes.filter((outcome) => outcome.status === 'growth').length || 0;
  const competitionScore = selectedSimulation?.competitionLevel === 'High' ? 86 : selectedSimulation?.competitionLevel === 'Medium' ? 62 : 42;

  return (
    <div className="space-y-5">
      <div className="page-hero p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-950">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-100">Outcome Lab</p>
              <h1 className="mt-2 text-4xl font-black">Future Simulator</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Backend scenarios ko 5-year career timeline, salary movement, risk, and investment ke saath preview karo.
              </p>
            </div>
          </div>
          <button
            onClick={runSimulation}
            disabled={!selectedSimulation || isAnimating}
            className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-black/20 transition hover:bg-teal-50 disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            {isAnimating ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {error && <div className="surface border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[330px_1fr]">
        <aside className="space-y-4">
          <div className="surface p-4">
            <p className="section-title mb-3">Choose Scenario</p>
            <div className="space-y-2">
              {simulations.map((sim) => {
                const Icon = iconMap[sim.icon] || Briefcase;
                const active = selectedSimulation?.id === sim.id;

                return (
                  <button
                    key={sim.id}
                    onClick={() => {
                      setSelectedSimulation(sim);
                      setCurrentYear(0);
                      setIsAnimating(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      active
                        ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${active ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-700'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-black">{sim.title}</span>
                      <span className={`text-xs font-bold ${active ? 'text-slate-300' : 'text-slate-500'}`}>{sim.risk} risk</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSimulation && (
            <div className="gradient-card p-4">
              <p className="text-sm font-black text-teal-100">Scenario Snapshot</p>
              <div className="mt-4 grid gap-2">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Wallet className="mb-2 h-5 w-5 text-teal-100" />
                  <p className="text-[11px] font-black uppercase text-slate-300">Investment</p>
                  <p className="text-lg font-black">{selectedSimulation.investment}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <ShieldAlert className="mb-2 h-5 w-5 text-amber-200" />
                  <p className="text-[11px] font-black uppercase text-slate-300">Risk</p>
                  <p className="text-lg font-black">{selectedSimulation.risk}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className="min-w-0 space-y-4">
          {selectedSimulation && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="accent-card">
                  <LineChart className="mb-3 h-5 w-5 text-indigo-700" />
                  <p className="text-xs font-black uppercase text-slate-500">Final Outcome</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{finalOutcome?.salary || '-'}</p>
                </div>
                <div className="accent-card">
                  <TrendingUp className="mb-3 h-5 w-5 text-teal-700" />
                  <p className="text-xs font-black uppercase text-slate-500">Growth Years</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{growthYears}/{selectedSimulation.outcomes.length}</p>
                </div>
                <div className="accent-card">
                  <Activity className="mb-3 h-5 w-5 text-slate-700" />
                  <p className="text-xs font-black uppercase text-slate-500">Current Stage</p>
                  <p className="mt-1 text-xl font-black text-slate-950">Year {currentYear || 1}</p>
                </div>
              </div>

              {currentYear > 0 && (
                <div className="surface overflow-hidden border-teal-200 bg-teal-50">
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase text-teal-700">Live Simulation / Year {currentYear}</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{selectedSimulation.outcomes[currentYear - 1]?.title}</p>
                      <p className="text-sm font-semibold text-slate-600">{selectedSimulation.outcomes[currentYear - 1]?.description}</p>
                    </div>
                    <p className="rounded-2xl bg-white px-4 py-3 text-xl font-black text-teal-700 shadow-sm">
                      {selectedSimulation.outcomes[currentYear - 1]?.salary}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="surface overflow-hidden">
                  <div className="border-b border-slate-200 bg-gradient-to-r from-white to-teal-50 px-5 py-4">
                    <p className="text-xs font-black uppercase text-teal-700">Agar tum {selectedSimulation.title} bante ho</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">Real Career Simulation</h2>
                  </div>
                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <div className="rounded-2xl bg-teal-50 p-4">
                      <p className="text-[10px] font-black uppercase text-teal-700">Year 1 Salary</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{selectedSimulation.year1Salary || selectedSimulation.outcomes[0]?.salary}</p>
                    </div>
                    <div className="rounded-2xl bg-indigo-50 p-4">
                      <p className="text-[10px] font-black uppercase text-indigo-700">Year 3 Salary</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{selectedSimulation.year3Salary || selectedSimulation.outcomes[2]?.salary}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase text-slate-500">Competition Level</p>
                        <p className="text-sm font-black text-slate-950">{selectedSimulation.competitionLevel || selectedSimulation.risk}</p>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                        <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-rose-500" style={{ width: `${competitionScore}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="gradient-card">
                  <p className="text-sm font-black text-teal-100">Salary Path</p>
                  <div className="mt-4 space-y-3">
                    {selectedSimulation.outcomes.slice(0, 3).map((outcome) => (
                      <div key={outcome.year} className="flex items-center justify-between rounded-2xl bg-white/10 p-3">
                        <div>
                          <p className="text-xs font-bold text-slate-300">Year {outcome.year}</p>
                          <p className="font-black text-white">{outcome.title}</p>
                        </div>
                        <p className="text-sm font-black text-teal-100">{outcome.salary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="surface p-5">
                  <p className="section-title">Required Skills</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selectedSimulation.requiredSkills || ['Communication', 'Projects', 'Interview prep', 'Domain basics']).map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="surface p-5">
                  <p className="section-title">Daily Routine</p>
                  <div className="mt-3 space-y-2">
                    {(selectedSimulation.dailyRoutine || selectedSimulation.outcomes.slice(0, 4).map((item) => item.description)).map((item, index) => (
                      <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white">{index + 1}</span>
                        <p className="text-sm font-semibold leading-5 text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="surface p-5">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-950">{selectedSimulation.title} Timeline</p>
                    <p className="text-sm font-semibold text-slate-500">Year-by-year outcomes from backend scenario data.</p>
                  </div>
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {visibleOutcomes.length || selectedSimulation.outcomes.length} steps visible
                  </span>
                </div>

                <div className="space-y-3">
                  {(visibleOutcomes.length ? visibleOutcomes : selectedSimulation.outcomes).map((outcome) => {
                    const status = statusCopy[outcome.status as keyof typeof statusCopy] || statusCopy.stable;
                    const StatusIcon = status.icon;

                    return (
                      <div key={outcome.year} className={`rounded-2xl border p-4 ${status.className}`}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-slate-950 shadow-sm">
                              {outcome.year}
                            </div>
                            <div>
                              <p className="font-black text-slate-950">{outcome.title}</p>
                              <p className="text-sm font-semibold text-slate-600">{outcome.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 md:justify-end">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black shadow-sm">
                              <StatusIcon className="h-3.5 w-3.5" />
                              {status.label}
                            </span>
                            <p className="text-lg font-black text-slate-950">{outcome.salary}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
