import { useEffect, useState } from 'react';
import { Filter, Sparkles } from 'lucide-react';
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
}

export default function CareerResultPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [allCareers, setAllCareers] = useState<CareerOption[]>([]);
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
    (c) => selectedCategory === 'All' || c.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div className="page-hero">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Career Options</h1>
            <p className="text-sm text-slate-300">Explore paths by category, salary, duration, and growth.</p>
          </div>
        </div>
      </div>

      <div className="surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-600" />
          <span className="section-title">Category</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`pill ${selectedCategory === category ? 'pill-active' : ''}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="surface-soft px-4 py-3">
        <p className="text-sm font-medium text-slate-700">
          {error || <>Showing <span className="font-bold">{filteredCareers.length}</span> career options</>}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredCareers.map((career) => (
          <div
            key={career.id}
            className="surface overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-extrabold text-slate-950">{career.title}</h3>
                  <p className="text-sm text-slate-500">{career.category}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {career.difficulty}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Duration</p>
                  <p className="text-sm font-bold text-slate-900">{career.duration}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Salary</p>
                  <p className="text-sm font-bold text-teal-700">{career.salary}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Growth</p>
                  <p className="text-sm font-bold text-indigo-700">{career.growth}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Key Skills</p>
                <div className="flex flex-wrap gap-1">
                  {career.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
