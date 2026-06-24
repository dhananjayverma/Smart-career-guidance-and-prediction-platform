import { useEffect, useState } from 'react';
import {
  Code,
  Wrench,
  Palette,
  DollarSign,
  Users,
  TrendingUp,
  Video,
  Activity,
  Building,
  Scale,
  GraduationCap,
  Coffee,
  Hammer,
  ArrowRight,
  Briefcase,
  Clock,
  Search,
  Sparkles,
  Wallet,
  Check,
  Plus,
  Gauge,
  ExternalLink,
  School,
  Brain,
  AlertTriangle,
  Map,
  User,
  LayoutGrid,
  BarChart2,
  Cpu,
  CheckCircle,
  XCircle,
  GitCompare,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Bookmark,
  Trash2,
} from 'lucide-react';
import { getCompareOptions, getCareers } from '../lib/api';

interface CompareOption {
  id: string;
  title: string;
  category?: string;
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

const itemIconMap: Record<string, any> = {
  // academic pathways
  'bca': GraduationCap,
  'diploma': School,
  'btech': School,
  'govt': Building,
  // careers
  'btech-engineering': School,
  'mechanical-engineer': Wrench,
  'civil-engineer': Building,
  'software-developer': Code,
  'data-scientist': BarChart2,
  'ai-ml-engineer': Brain,
  'cybersecurity-analyst': Cpu,
  'cloud-devops-engineer': Cpu,
  'polytechnic-diploma-it': School,
  'ux-ui-designer': Palette,
  'graphic-designer': Palette,
  'chartered-accountant': DollarSign,
  'financial-analyst': DollarSign,
  'mba-management': Users,
  'digital-marketing': TrendingUp,
  'content-creator': Video,
  'journalist-media': Video,
  'mbbs-doctor': Activity,
  'nursing': Activity,
  'pharmacist': Activity,
  'upsc-civil-services': Building,
  'ssc-banking': Building,
  'defence-services': Hammer,
  'lawyer': Scale,
  'teacher-educator': GraduationCap,
  'entrepreneur': Users,
  'hotel-management': Coffee,
  'electrician-technician': Hammer,
};

const getItemIcon = (id: string, category: string) => {
  if (itemIconMap[id]) return itemIconMap[id];
  const cat = category.toLowerCase();
  if (cat.includes('it') || cat.includes('tech') || cat.includes('software')) return Code;
  if (cat.includes('engineer')) return Cpu;
  if (cat.includes('finance') || cat.includes('account')) return DollarSign;
  if (cat.includes('medical') || cat.includes('doctor')) return Activity;
  return Briefcase;
};

const getCategoryStyle = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('academic') || cat.includes('pathway')) {
    return {
      boxBg: 'bg-indigo-50/60 border-indigo-100/60',
      iconBg: 'bg-indigo-100 text-indigo-700',
      closeBg: 'bg-indigo-100/80 text-indigo-700 hover:bg-indigo-200',
    };
  }
  if (cat.includes('it') || cat.includes('tech') || cat.includes('software')) {
    return {
      boxBg: 'bg-teal-50/60 border-teal-100/60',
      iconBg: 'bg-teal-100 text-teal-700',
      closeBg: 'bg-teal-100/80 text-teal-700 hover:bg-teal-200',
    };
  }
  if (cat.includes('engineer')) {
    return {
      boxBg: 'bg-emerald-50/60 border-emerald-100/60',
      iconBg: 'bg-emerald-100 text-emerald-700',
      closeBg: 'bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200',
    };
  }
  return {
    boxBg: 'bg-slate-50/70 border-slate-200/60',
    iconBg: 'bg-slate-200 text-slate-700',
    closeBg: 'bg-slate-200 text-slate-600 hover:bg-slate-300',
  };
};

export default function ComparePage() {
  const [compareOptions, setCompareOptions] = useState<CompareOption[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectSearch, setSelectSearch] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getCompareOptions<CompareOption[]>(),
      getCareers<any[]>('All')
    ])
      .then(([options, careers]) => {
        const mappedCareers: CompareOption[] = (careers || []).map((c) => {
          let diffScore = 60;
          const diff = (c.difficulty || '').toLowerCase();
          if (diff.includes('very hard')) diffScore = 95;
          else if (diff.includes('hard')) diffScore = 82;
          else if (diff.includes('medium')) diffScore = 60;
          else if (diff.includes('easy')) diffScore = 40;

          let growthScore = 75;
          const growth = (c.growth || '').toLowerCase();
          if (growth.includes('very high') || growth.includes('highest')) growthScore = 92;
          else if (growth.includes('high')) growthScore = 84;
          else if (growth.includes('stable') || growth.includes('medium')) growthScore = 72;
          else if (growth.includes('low')) growthScore = 45;

          let fees = 'Varies';
          const titleLower = c.title.toLowerCase();
          if (titleLower.includes('b.tech') || titleLower.includes('engineering')) fees = 'Rs 4-20L';
          else if (titleLower.includes('mca') || titleLower.includes('bca')) fees = 'Rs 1.5-6L';
          else if (titleLower.includes('mbbs') || titleLower.includes('doctor')) fees = 'Rs 15-80L';
          else if (titleLower.includes('diploma')) fees = 'Rs 0.9-3L';
          else if (titleLower.includes('gov') || titleLower.includes('upsc') || titleLower.includes('ssc')) fees = 'Rs 10k-1.5L';
          else if (c.category === 'IT/Technology') fees = 'Rs 50k-3L';
          else fees = 'Rs 1-5L';

          return {
            id: c.id,
            title: c.title,
            category: c.category || 'Career Path',
            stats: {
              duration: c.duration || '1-4 years',
              fees: fees,
              salary: c.salary || 'Rs 3-8 LPA',
              difficulty: diffScore,
              jobRate: growthScore - 5,
              growth: growthScore,
            },
            pros: c.pros ? c.pros.split(',').map((p: string) => p.trim()) : ['High Growth Field', 'Good Salaries'],
            cons: c.cons ? c.cons.split(',').map((p: string) => p.trim()) : ['Needs practice', 'Continuous upgrade'],
          };
        });

        const unified = [
          ...options.map(o => ({ ...o, category: 'Academic Pathway' })),
          ...mappedCareers
        ];

        setCompareOptions(unified);
        
        // Default to BCA and B.Tech selected (just like mockup)
        const initialSelections = unified.filter(
          item => item.id === 'bca' || item.id === 'btech'
        ).map(item => item.id);
        
        setSelectedItems(initialSelections.length >= 2 ? initialSelections : unified.slice(0, 2).map(i => i.id));
        setError('');
      })
      .catch((apiError) => {
        console.warn('API error in Compare:', apiError);
        setError('Comparison data load failed.');
      });
  }, []);

  const toggleItem = (id: string) => {
    if (selectedItems.includes(id)) {
      if (selectedItems.length > 1) {
        setSelectedItems(selectedItems.filter((i) => i !== id));
      }
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const clearAllSelections = () => {
    setSelectedItems([]);
  };

  const selectedCompare = compareOptions.filter((item) => selectedItems.includes(item.id));
  
  const groupedOptions = compareOptions.reduce((groups, item) => {
    const cat = item.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
    return groups;
  }, {} as Record<string, CompareOption[]>);

  const getDynamicInsight = () => {
    const titles = selectedCompare.map(c => c.title.toLowerCase());
    if (titles.some(t => t.includes('b.tech') || t.includes('engineering')) && titles.some(t => t.includes('bca') || t.includes('mca') || t.includes('diploma'))) {
      return "B.Tech offers higher long-term growth and salary potential, while BCA is shorter and more budget-friendly.";
    }
    if (titles.some(t => t.includes('ai') || t.includes('ml')) && titles.some(t => t.includes('software') || t.includes('developer'))) {
      return "AI/ML Engineer offers higher salary cap and growth, while Software Developer has a faster entry and lower initial difficulty.";
    }
    if (selectedCompare.length >= 2) {
      const sortedByGrowth = [...selectedCompare].sort((a, b) => b.stats.growth - a.stats.growth);
      const sortedByDifficulty = [...selectedCompare].sort((a, b) => a.stats.difficulty - b.stats.difficulty);
      return `${sortedByGrowth[0].title} offers the highest growth potential (${sortedByGrowth[0].stats.growth}%), while ${sortedByDifficulty[0].title} offers the easiest entry point (${sortedByDifficulty[0].stats.difficulty}% difficulty).`;
    }
    return "Select two or more options to generate side-by-side decision insights.";
  };

  // Main columns
  const mainCategories = ['Academic Pathway', 'Engineering', 'IT/Technology'];
  const otherCategories = Object.keys(groupedOptions).filter(cat => !mainCategories.includes(cat));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200/60 animate-fadeIn">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-650 shadow-sm flex-shrink-0">
            <GitCompare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Decision Matrix</p>
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">Compare Career Options</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Select career paths or academic fields to build your personalized comparison.</p>
          </div>
        </div>
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={selectSearch}
            onChange={(e) => setSelectSearch(e.target.value)}
            placeholder="Search option to compare..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-xs text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          />
        </div>
      </div>

      {/* Select Options Box (Mockup style) */}
      <div className="surface p-5 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Options ({selectedItems.length})</p>
          {selectedItems.length > 0 && (
            <button
              onClick={clearAllSelections}
              className="inline-flex items-center gap-1 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>

        {/* Selected Options Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedCompare.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3.5 py-1 text-xs font-semibold text-indigo-700 animate-fadeIn"
            >
              {item.title}
              <button
                onClick={() => toggleItem(item.id)}
                className="text-indigo-400 hover:text-indigo-700 transition font-black text-sm cursor-pointer p-0.5"
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
          {selectedItems.length === 0 && (
            <span className="text-xs text-slate-400 italic">No options selected. Click pills below to add.</span>
          )}
        </div>

        {/* Categories Pills Grid */}
        <div className="grid gap-6 md:grid-cols-3 pt-3 border-t border-slate-100">
          {/* Column 1: Academic Pathway */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Academic Pathway</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(groupedOptions['Academic Pathway'] || []).map((option) => {
                const isSelected = selectedItems.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleItem(option.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {option.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Engineering */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-500" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Engineering</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(groupedOptions['Engineering'] || []).map((option) => {
                const isSelected = selectedItems.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleItem(option.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {option.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 3: IT/Technology */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-500" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-650">IT/Technology</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(groupedOptions['IT/Technology'] || []).slice(0, 3).map((option) => {
                const isSelected = selectedItems.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleItem(option.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-350'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {option.title}
                  </button>
                );
              })}
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition border ${
                  showAllCategories
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350'
                }`}
                title="More fields"
              >
                {showAllCategories ? '▲ More' : '▼ More'}
              </button>
            </div>
          </div>
        </div>

        {/* More Options dropdown list */}
        {showAllCategories && (
          <div className="grid gap-6 md:grid-cols-3 pt-3 border-t border-slate-100 animate-fadeIn">
            {otherCategories.map((cat) => {
              const filteredItems = groupedOptions[cat].filter(opt =>
                opt.title.toLowerCase().includes(selectSearch.toLowerCase())
              );
              if (!filteredItems.length) return null;
              return (
                <div key={cat} className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredItems.map((option) => {
                      const isSelected = selectedItems.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleItem(option.id)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {option.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* IT/Technology remaining options */}
            {(() => {
              const remainingIT = (groupedOptions['IT/Technology'] || []).slice(3);
              if (!remainingIT.length) return null;
              return (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">IT/Technology (Cont.)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {remainingIT.map((option) => {
                      const isSelected = selectedItems.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleItem(option.id)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {option.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Comparison Table (Replicating exact layout and no fixed scrolling widths) */}
      {selectedCompare.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-fadeIn">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="w-1/4 p-4 text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Comparison Overview</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Evaluate key factors side-by-side</p>
                </th>
                {selectedCompare.map((item) => {
                  const ItemIcon = getItemIcon(item.id, item.category || '');
                  const style = getCategoryStyle(item.category || '');
                  return (
                    <th key={item.id} className="p-3 text-left border-l border-slate-200/60 relative">
                      <div className={`rounded-2xl border p-3 flex items-center justify-between ${style.boxBg}`}>
                        <div className="flex items-center gap-2">
                          <div className={`grid h-8 w-8 place-items-center rounded-lg shadow-3xs flex-shrink-0 ${style.iconBg}`}>
                            <ItemIcon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">{item.category}</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleItem(item.id)}
                          className={`grid h-5 w-5 place-items-center rounded-full transition font-black text-sm cursor-pointer ${style.closeBg}`}
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Duration Row */}
              <tr className="border-b border-slate-100 hover:bg-slate-50/30 transition">
                <td className="p-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>Duration</span>
                </td>
                {selectedCompare.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200/60 text-xs font-bold text-slate-800">
                    {item.stats.duration}
                  </td>
                ))}
              </tr>

              {/* Est. Fees Row */}
              <tr className="border-b border-slate-100 hover:bg-slate-50/30 transition">
                <td className="p-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-indigo-500" />
                  <span>Est. Fees</span>
                </td>
                {selectedCompare.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200/60 text-xs font-bold text-slate-800">
                    {item.stats.fees}
                  </td>
                ))}
              </tr>

              {/* Salary Row */}
              <tr className="border-b border-slate-100 hover:bg-slate-50/30 transition">
                <td className="p-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <span>Est. Salary</span>
                </td>
                {selectedCompare.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200/60 text-xs font-bold text-slate-800">
                    {item.stats.salary.replace(/Rs\s*/i, '₹ ')}
                  </td>
                ))}
              </tr>

              {/* Difficulty Row */}
              <tr className="border-b border-slate-100 hover:bg-slate-50/30 transition">
                <td className="p-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-indigo-500" />
                  <span>Difficulty</span>
                </td>
                {selectedCompare.map((item) => {
                  let badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                  if (item.stats.difficulty >= 85) badgeColor = 'bg-red-50 text-red-700 border-red-100';
                  else if (item.stats.difficulty <= 50) badgeColor = 'bg-green-50 text-green-700 border-green-100';
                  
                  return (
                    <td key={item.id} className="p-4 border-l border-slate-200/60">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${badgeColor}`}>
                        {item.stats.difficulty}%
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Job Rate Row */}
              <tr className="border-b border-slate-100 hover:bg-slate-50/30 transition">
                <td className="p-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  <span>Job Placement Rate</span>
                </td>
                {selectedCompare.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-800 min-w-[28px]">{item.stats.jobRate}%</span>
                      <div className="h-1.5 w-28 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${item.stats.jobRate}%` }} />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Growth Row */}
              <tr className="border-b border-slate-100 hover:bg-slate-50/30 transition">
                <td className="p-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <span>Growth Index</span>
                </td>
                {selectedCompare.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-800 min-w-[28px]">{item.stats.growth}%</span>
                      <div className="h-1.5 w-28 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${item.stats.growth}%` }} />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Pros Row */}
              <tr className="border-b border-slate-100 hover:bg-slate-50/30 transition">
                <td className="p-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-indigo-500" />
                  <span>Pros</span>
                </td>
                {selectedCompare.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200/60 align-top">
                    <ul className="space-y-1.5">
                      {item.pros.map((pro, i) => (
                        <li key={i} className="text-xs text-slate-700 font-semibold flex items-start gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Cons Row */}
              <tr className="hover:bg-slate-50/30 transition">
                <td className="p-4 text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-rose-500" />
                  <span>Trade-offs</span>
                </td>
                {selectedCompare.map((item) => (
                  <td key={item.id} className="p-4 border-l border-slate-200/60 align-top">
                    <ul className="space-y-1.5">
                      {item.cons.map((con, i) => (
                        <li key={i} className="text-xs text-slate-700 font-semibold flex items-start gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="surface p-8 text-center animate-fadeIn">
          <p className="text-lg font-bold text-slate-950">No options selected</p>
          <p className="mt-1 text-sm text-slate-500">Select some career paths or pathways above to compare.</p>
        </div>
      )}

      {/* Insights & Actions Footer Row */}
      {selectedCompare.length >= 1 && (
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-stretch animate-fadeIn">
          {/* Quick Insight */}
          <div className="rounded-2xl border border-indigo-100 bg-[#EEF2F6]/30 p-4 flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Quick Insight</p>
              <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
                {getDynamicInsight()}
              </p>
            </div>
          </div>

          {/* Key Takeaway */}
          <div className="rounded-2xl border border-emerald-100 bg-[#F0FDF4]/30 p-4 flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Key Takeaway</p>
              <p className="text-xs font-semibold text-slate-600 mt-1 leading-relaxed">
                Choose based on your career goals, budget, and time commitment.
              </p>
            </div>
          </div>

          {/* Save Button Container */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => alert('Comparison configuration saved to profile!')}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-xs font-bold text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <Bookmark className="w-4 h-4" /> Save Comparison
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
