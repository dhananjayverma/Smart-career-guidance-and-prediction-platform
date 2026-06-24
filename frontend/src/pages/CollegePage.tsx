import { useEffect, useState } from 'react';
import {
  MapPin,
  Star,
  Search,
  Building2,
  GraduationCap,
  IndianRupee,
  TrendingUp,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { getColleges } from '../lib/api';

interface Review {
  user: string;
  rating: number;
  comment: string;
}

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
  reviews?: Review[];
}

export default function CollegePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [apiColleges, setApiColleges] = useState<College[]>([]);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [error, setError] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

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
      case 'IIT': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'NIT': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'IIIT': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Private': return 'bg-purple-50 text-purple-700 border border-purple-100';
      case 'State Govt': return 'bg-teal-50 text-teal-700 border border-teal-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const toggleReviews = (collegeId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [collegeId]: !prev[collegeId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/60 animate-fadeIn">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm flex-shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Admissions Explorer</p>
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">College Finder</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Explore 60+ real Indian higher education institutes with NIRF rankings, placement records, and verified student reviews.
            </p>
          </div>
        </div>

        {/* Summary Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-slate-200/60 bg-white/60 px-3.5 py-1.5 text-center shadow-sm">
            <p className="text-sm font-black text-slate-900 leading-none">{filteredColleges.length}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">Colleges</p>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-white/60 px-3.5 py-1.5 text-center shadow-sm">
            <p className="text-sm font-black text-slate-900 leading-none">{avgPlacement}%</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">Avg Placement</p>
          </div>
          <div className="rounded-xl border border-slate-200/60 bg-white/60 px-3.5 py-1.5 text-center shadow-sm">
            <p className="text-sm font-black text-slate-900 leading-none">{states.length - 1}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1">States</p>
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
            <p className="text-sm font-black text-indigo-600">Result Summary</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl bg-white p-3 border border-slate-100 shadow-sm">
                <p className="text-2xl font-black text-slate-900">{filteredColleges.length}</p>
                <p className="text-[11px] font-bold text-slate-500">Matching colleges</p>
              </div>
              <div className="rounded-2xl bg-white p-3 border border-slate-100 shadow-sm">
                <p className="text-2xl font-black text-slate-900">{avgPlacement}%</p>
                <p className="text-[11px] font-bold text-slate-500">Average placement</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          {error && <div className="surface border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

          <div className="grid gap-4 xl:grid-cols-2">
            {filteredColleges.map((college) => (
              <div key={college.id} className="surface overflow-hidden transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-950/[0.08]">
                <div className="p-5 border-b border-slate-100 bg-slate-50/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${getTypeColor(college.type)}`}>
                          {college.type}
                        </span>
                        <span className="rounded-full bg-slate-100 border border-slate-200/60 text-slate-600 px-2 py-0.5 text-[10px] font-bold">
                          NIRF #{college.ranking}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">{college.name}</h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {college.location}, {college.state}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-100 px-2.5 py-1 text-amber-700">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black">{college.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 flex flex-wrap gap-1">
                    {college.courses.map((course) => (
                      <span key={course} className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {course}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-teal-50/50 border border-teal-100/60 p-3">
                      <TrendingUp className="mb-1.5 h-4 w-4 text-teal-600" />
                      <p className="text-[9px] font-bold uppercase tracking-wider text-teal-600">Placement</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">{college.placement}%</p>
                    </div>
                    <div className="rounded-xl bg-slate-50/60 border border-slate-200/40 p-3">
                      <GraduationCap className="mb-1.5 h-4 w-4 text-slate-500" />
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Avg Package</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">{college.avgPackage}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50/50 border border-indigo-100/60 p-3">
                      <Star className="mb-1.5 h-4 w-4 text-indigo-500" />
                      <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-650">Highest</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">{college.highestPackage}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50/50 border border-amber-100/60 p-3">
                      <IndianRupee className="mb-1.5 h-4 w-4 text-amber-600" />
                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Fees/Year</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">{college.fees}</p>
                    </div>
                  </div>

                  {/* Reviews Section Toggle */}
                  {college.reviews && college.reviews.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => toggleReviews(college.id)}
                        className="inline-flex w-full items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Show Student Reviews ({college.reviews.length})
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedReviews[college.id] ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Expanded Reviews list */}
                      {expandedReviews[college.id] && (
                        <div className="mt-3 space-y-2.5 animate-fadeIn">
                          {college.reviews.map((rev, idx) => {
                            // Extract user initials
                            const initials = (rev.user || 'Anonymous')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase();

                            return (
                              <div key={idx} className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 text-slate-800 animate-fadeIn">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="grid h-6 w-6 place-items-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 border border-indigo-100/50">
                                      {initials}
                                    </div>
                                    <span className="text-xs font-black text-slate-700">{rev.user}</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 text-amber-400">
                                    <Star className="w-3 h-3 fill-amber-400" />
                                    <span className="text-[10px] font-bold text-slate-600">{rev.rating}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-600 italic leading-relaxed pl-8 relative">
                                  <span className="absolute left-2 top-0 text-lg text-slate-300 font-serif leading-none">“</span>
                                  {rev.comment}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
