import { useEffect, useState } from 'react';
import {
  MapPin,
  Star,
  Search,
  Building2,
  GraduationCap,
  IndianRupee,
  TrendingUp,
} from 'lucide-react';
import { getColleges } from '../lib/api';

interface College {
  id: string;
  name: string;
  type: string;
  location: string;
  state: string;
  ranking: number;
  placement: number;
  avgPackage: string;
  highestPackage: string;
  fees: string;
  rating: number;
  courses: string[];
}

export default function CollegePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [apiColleges, setApiColleges] = useState<College[]>([]);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getColleges<College[]>({})
      .then((data) => {
        setAllColleges(data);
        setApiColleges(data);
        setError('');
      })
      .catch((apiError) => {
        console.warn('College API unavailable:', apiError);
        setError('College data backend se load nahi ho pa raha.');
      });
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      getColleges<College[]>({
        search: searchTerm,
        type: selectedType,
        state: selectedState,
      })
        .then(setApiColleges)
        .catch((apiError) => {
          console.warn('College API unavailable:', apiError);
          setApiColleges([]);
          setError('College data backend se load nahi ho pa raha.');
        });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm, selectedType, selectedState]);

  const collegeTypes = ['All', ...Array.from(new Set(allColleges.map((college) => college.type)))];
  const states = ['All', ...Array.from(new Set(allColleges.map((college) => college.state)))];
  const filteredColleges = apiColleges.filter((college) => {
    const matchesSearch = college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      college.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || college.type === selectedType;
    const matchesState = selectedState === 'All' || college.state === selectedState;
    return matchesSearch && matchesType && matchesState;
  });
  const avgPlacement = filteredColleges.length
    ? Math.round(filteredColleges.reduce((sum, college) => sum + college.placement, 0) / filteredColleges.length)
    : 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IIT': return 'bg-blue-100 text-blue-800';
      case 'NIT': return 'bg-emerald-100 text-emerald-800';
      case 'IIIT': return 'bg-amber-100 text-amber-800';
      case 'Private': return 'bg-violet-100 text-violet-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-hero p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-950">
            <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-100">Admissions Explorer</p>
              <h1 className="mt-2 text-4xl font-black">College Finder</h1>
              <p className="mt-2 text-sm text-slate-300">Compare colleges by ranking, placement, packages, fees, courses, state, and type.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{filteredColleges.length}</p>
              <p className="text-[11px] font-bold text-teal-100">Colleges</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{avgPlacement}%</p>
              <p className="text-[11px] font-bold text-teal-100">Avg Placement</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{states.length - 1}</p>
              <p className="text-[11px] font-bold text-teal-100">States</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="surface p-4">
            <p className="section-title mb-3">Search College</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search college..."
              className="input-field pl-9"
            />
          </div>
          </div>
          <div className="surface p-4">
            <p className="section-title mb-3">Type</p>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-field"
          >
            {collegeTypes.map((type) => (
              <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
            ))}
          </select>
          </div>
          <div className="surface p-4">
            <p className="section-title mb-3">State</p>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="input-field"
          >
            {states.map((state) => (
              <option key={state} value={state}>{state === 'All' ? 'All States' : state}</option>
            ))}
          </select>
          </div>
          <div className="gradient-card p-4">
            <p className="text-sm font-black text-teal-100">Result Summary</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-2xl font-black">{filteredColleges.length}</p>
                <p className="text-[11px] font-bold text-slate-300">Matching colleges</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-2xl font-black">{avgPlacement}%</p>
                <p className="text-[11px] font-bold text-slate-300">Average placement</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          {error && <div className="surface border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

          <div className="grid gap-4 xl:grid-cols-2">
            {filteredColleges.map((college) => (
              <div key={college.id} className="surface overflow-hidden transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-950/[0.08]">
                <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-900 p-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getTypeColor(college.type)}`}>
                          {college.type}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold">NIRF #{college.ranking}</span>
                      </div>
                      <h3 className="text-lg font-black">{college.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-300">
                        <MapPin className="w-3 h-3" />
                        {college.location}, {college.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-amber-300">
                        <Star className="w-4 h-4 fill-amber-300" />
                        <span className="font-black">{college.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 flex flex-wrap gap-1">
                    {college.courses.map((course) => (
                      <span key={course} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {course}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-teal-50 p-3">
                      <TrendingUp className="mb-2 h-4 w-4 text-teal-700" />
                      <p className="text-[10px] font-black uppercase text-teal-700">Placement</p>
                      <p className="text-sm font-black text-slate-950">{college.placement}%</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <GraduationCap className="mb-2 h-4 w-4 text-slate-600" />
                      <p className="text-[10px] font-black uppercase text-slate-500">Avg Package</p>
                      <p className="text-sm font-black text-slate-950">{college.avgPackage}</p>
                    </div>
                    <div className="rounded-2xl bg-indigo-50 p-3">
                      <Star className="mb-2 h-4 w-4 text-indigo-700" />
                      <p className="text-[10px] font-black uppercase text-indigo-700">Highest</p>
                      <p className="text-sm font-black text-slate-950">{college.highestPackage}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-3">
                      <IndianRupee className="mb-2 h-4 w-4 text-amber-700" />
                      <p className="text-[10px] font-black uppercase text-amber-700">Fees/Year</p>
                      <p className="text-sm font-black text-slate-950">{college.fees}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        </div>
    </div>
  );
}
