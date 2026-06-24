import { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  GitCompare,
  Gauge,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { getCompareOptions } from '../lib/api';

interface CompareOption {
  id: string;
  title: string;
  stats: {
    duration: string;
    fees: string;
    salary: string;
    difficulty: number;
    jobRate: number;
    growth: number;
  };
  pros: string[];
  cons: string[];
}

export default function ComparePage() {
  const [compareOptions, setCompareOptions] = useState<CompareOption[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getCompareOptions<CompareOption[]>()
      .then((options) => {
        setCompareOptions(options);
        setSelectedItems(options.slice(0, 2).map((option) => option.id));
        setError('');
      })
      .catch((apiError) => {
        console.warn('Compare API unavailable:', apiError);
        setError('Comparison data backend se load nahi ho pa raha.');
      });
  }, []);

  const toggleItem = (id: string) => {
    if (selectedItems.includes(id)) {
      if (selectedItems.length > 2) {
        setSelectedItems(selectedItems.filter((i) => i !== id));
      }
    } else if (selectedItems.length < 4) {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const selectedCompare = compareOptions.filter((item) => selectedItems.includes(item.id));
  const bestJobRate = selectedCompare.reduce((best, item) => Math.max(best, item.stats.jobRate), 0);
  const bestGrowth = selectedCompare.reduce((best, item) => Math.max(best, item.stats.growth), 0);

  return (
    <div className="space-y-5">
      <div className="page-hero p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-950">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-100">Decision Matrix</p>
              <h1 className="mt-2 text-4xl font-black">Compare Career Options</h1>
              <p className="mt-2 text-sm text-slate-300">Select up to four paths and compare cost, salary, difficulty, job rate, growth, pros, and tradeoffs.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{selectedItems.length}</p>
              <p className="text-[11px] font-bold text-teal-100">Selected</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{bestJobRate}%</p>
              <p className="text-[11px] font-bold text-teal-100">Best Jobs</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{bestGrowth}%</p>
              <p className="text-[11px] font-bold text-teal-100">Best Growth</p>
            </div>
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <p className="section-title mb-3">Select Options ({selectedItems.length}/4)</p>
        <div className="flex flex-wrap gap-2">
          {compareOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleItem(option.id)}
              className={`pill ${selectedItems.includes(option.id) ? 'pill-active' : ''}`}
            >
              {selectedItems.includes(option.id) && <CheckCircle className="w-4 h-4 inline mr-1" />}
              {option.title}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {selectedCompare.map((item) => (
          <div key={item.id} className="surface overflow-hidden">
            <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-900 p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-teal-100">Career Path</p>
                  <h3 className="mt-1 text-xl font-black">{item.title}</h3>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{item.stats.jobRate}% jobs</span>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-5 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <Gauge className="mb-2 h-4 w-4 text-slate-600" />
                  <p className="text-[10px] font-black uppercase text-slate-500">Duration</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{item.stats.duration}</p>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-3">
                  <Wallet className="mb-2 h-4 w-4 text-indigo-700" />
                  <p className="text-[10px] font-black uppercase text-indigo-700">Fees</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{item.stats.fees}</p>
                </div>
                <div className="rounded-2xl bg-teal-50 p-3">
                  <TrendingUp className="mb-2 h-4 w-4 text-teal-700" />
                  <p className="text-[10px] font-black uppercase text-teal-700">Salary</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{item.stats.salary}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Difficulty</span>
                    <span className="font-medium">{item.stats.difficulty}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${item.stats.difficulty}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Job Rate</span>
                    <span className="font-medium">{item.stats.jobRate}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.stats.jobRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Growth</span>
                    <span className="font-medium">{item.stats.growth}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${item.stats.growth}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-teal-50 p-3">
                  <p className="text-xs font-black text-emerald-700 flex items-center gap-1 mb-2">
                    <CheckCircle className="w-3 h-3" /> Pros
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {item.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                  </ul>
                </div>
                <div className="rounded-2xl bg-rose-50 p-3">
                  <p className="text-xs font-black text-red-700 flex items-center gap-1 mb-2">
                    <XCircle className="w-3 h-3" /> Cons
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {item.cons.map((con, i) => <li key={i}>{con}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
