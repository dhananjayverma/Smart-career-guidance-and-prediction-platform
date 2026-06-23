import { useEffect, useState } from 'react';
import {
  MapPin,
  Star,
  Search,
  Building2,
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
    <div className="space-y-6">
      <div className="page-hero">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">College Finder</h1>
            <p className="text-sm text-slate-300">Compare colleges, placements, fees, and courses.</p>
          </div>
        </div>
      </div>

      <div className="surface p-4">
        <div className="grid md:grid-cols-3 gap-4">
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
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-field"
          >
            {collegeTypes.map((type) => (
              <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
            ))}
          </select>
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
      </div>

      <div className="surface-soft px-4 py-3">
        <p className="text-sm font-medium text-slate-700">
          {error || <>Found <span className="font-bold">{filteredColleges.length}</span> colleges</>}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredColleges.map((college) => (
          <div key={college.id} className="surface overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-extrabold text-slate-950">{college.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getTypeColor(college.type)}`}>
                      {college.type}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {college.location}, {college.state}
                  </p>
                </div>
                <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-amber-600">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-bold">{college.rating}</span>
                  </div>
                  <p className="text-xs text-slate-500">NIRF #{college.ranking}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {college.courses.map((course) => (
                  <span key={course} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {course}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Placement</p>
                  <p className="text-sm font-bold text-teal-700">{college.placement}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Avg Package</p>
                  <p className="text-sm font-bold text-slate-800">{college.avgPackage}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Highest</p>
                  <p className="text-sm font-bold text-indigo-700">{college.highestPackage}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500">Fees/Year</p>
                  <p className="text-sm font-bold text-slate-800">{college.fees}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
