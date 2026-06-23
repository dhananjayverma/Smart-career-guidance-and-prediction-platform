import { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  GitCompare,
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

  return (
    <div className="space-y-6">
      <div className="page-hero">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
            <GitCompare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Compare Career Options</h1>
            <p className="text-sm text-slate-300">Side-by-side decision view.</p>
          </div>
        </div>
      </div>

      <div className="surface p-4">
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

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedCompare.map((item) => (
          <div key={item.id} className="surface overflow-hidden">
            <div className="bg-slate-950 px-4 py-4 text-center text-white">
              <h3 className="font-extrabold">{item.title}</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-4 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-slate-500">Duration</p>
                  <p className="font-bold text-slate-800">{item.stats.duration}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <p className="text-slate-500">Fees</p>
                  <p className="font-bold text-slate-800">{item.stats.fees}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded col-span-2">
                  <p className="text-slate-500">Salary</p>
                  <p className="font-bold text-teal-700">{item.stats.salary}</p>
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

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-emerald-700 flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3" /> Pros
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {item.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-700 flex items-center gap-1 mb-1">
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
