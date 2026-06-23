import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  Award,
  Rocket,
  Play,
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
}

const iconMap: Record<string, ElementType> = {
  Award,
  Briefcase,
  Rocket,
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
      if (year >= 5) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, 700);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'growth': return 'bg-teal-50 border-teal-200';
      case 'stable': return 'bg-indigo-50 border-indigo-200';
      case 'struggle': return 'bg-rose-50 border-rose-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-hero">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Future Simulator</h1>
            <p className="text-sm text-slate-300">Preview outcomes for a selected path.</p>
          </div>
        </div>
      </div>

      <div className="surface p-4">
        <p className="section-title mb-3">Select Career Path</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {simulations.map((sim) => {
            const Icon = iconMap[sim.icon] || Briefcase;
            return (
              <button
                key={sim.id}
                onClick={() => {
                  setSelectedSimulation(sim);
                  setCurrentYear(0);
                }}
                className={`rounded-2xl border p-3 text-center transition ${
                  selectedSimulation?.id === sim.id
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs font-medium">{sim.title}</p>
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      </div>

      {selectedSimulation && <div className="surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold text-slate-950">{selectedSimulation.title}</p>
            <p className="text-xs text-slate-500">Investment: {selectedSimulation.investment} | Risk: {selectedSimulation.risk}</p>
          </div>
          <button
            onClick={runSimulation}
            disabled={isAnimating}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {isAnimating ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </div>}

      {currentYear > 0 && selectedSimulation && (
        <div className="surface border-teal-200 bg-teal-50 p-4 text-center">
          <p className="text-xs font-bold uppercase text-teal-700">Year {currentYear}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-950">
            {selectedSimulation.outcomes[currentYear - 1]?.salary}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {selectedSimulation?.outcomes.map((outcome, index) => {
          const show = isAnimating ? index < currentYear : true;

          if (!show) return null;

          return (
            <div key={outcome.year} className={`ml-2 rounded-2xl border border-l-4 p-3 ${getStatusColor(outcome.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950 text-xs font-extrabold text-white">
                      {outcome.year}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-slate-950">{outcome.title}</p>
                      <p className="text-xs text-slate-500">{outcome.description}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-teal-700">{outcome.salary}</p>
                  {outcome.status === 'growth' && <span className="text-[10px] text-teal-600"><TrendingUp className="w-3 h-3 inline" /> Growth</span>}
                  {outcome.status === 'stable' && <span className="text-[10px] text-indigo-600">Stable</span>}
                  {outcome.status === 'struggle' && <span className="text-[10px] text-rose-600"><TrendingDown className="w-3 h-3 inline" /> Challenging</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
