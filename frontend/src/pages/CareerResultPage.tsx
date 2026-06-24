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
} from 'lucide-react';
import { getCareers } from '../lib/api';
import {
  RadarChart,
  SkillGapGraph,
  SalaryTimeline
} from '../components/CareerCharts';

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

const categoryIconMap: Record<string, any> = {
  'All': LayoutGrid,
  'Engineering': Cpu,
  'IT/Technology': Code,
  'Design/Creative': Palette,
  'Finance': DollarSign,
  'Management': Users,
  'Marketing': TrendingUp,
  'Media/Creative': Video,
  'Medical': Activity,
  'Government': Building,
  'Law': Scale,
  'Education': GraduationCap,
  'Business': Users,
  'Hospitality': Coffee,
  'Skilled Trades': Hammer,
};

const featuredIconMap: Record<string, { icon: any, bg: string, text: string }> = {
  'btech-engineering': { icon: School, bg: 'bg-indigo-600', text: 'text-white' },
  'software-developer': { icon: Code, bg: 'bg-emerald-600', text: 'text-white' },
  'data-scientist': { icon: BarChart2, bg: 'bg-blue-600', text: 'text-white' },
};

const careerIconMap: Record<string, any> = {
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

const getCareerIcon = (career: CareerOption) => {
  return careerIconMap[career.id] || categoryIconMap[career.category] || Briefcase;
};

const getGrowthPercentage = (growthStr: string) => {
  const g = growthStr.toLowerCase();
  if (g.includes('very high') || g.includes('highest')) return 92;
  if (g.includes('high')) return 85;
  if (g.includes('stable') || g.includes('medium') || g.includes('moderate') || g.includes('good')) return 78;
  return 70;
};

export default function CareerResultPage() {
  const [allCareers, setAllCareers] = useState<CareerOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [sortBy, setSortBy] = useState<'growth' | 'salary' | 'title'>('growth');
  const [activeTabs, setActiveTabs] = useState<Record<string, 'overview' | 'analytics' | 'checklist'>>({});

  useEffect(() => {
    getCareers<CareerOption[]>('All')
      .then((data) => {
        setAllCareers(data || []);
        setError('');
      })
      .catch((apiError) => {
        console.warn('Career API unavailable:', apiError);
        setError('Career data backend se load nahi ho pa raha.');
      });
  }, []);

  const toggleUserSkill = (skill: string) => {
    const sLower = skill.toLowerCase();
    const exists = userSkills.some(s => s.toLowerCase() === sLower);
    if (exists) {
      setUserSkills(userSkills.filter(s => s.toLowerCase() !== sLower));
    } else {
      setUserSkills([...userSkills, skill]);
    }
  };

  const getMatchScore = (careerSkills: string[]) => {
    if (!userSkills.length || !careerSkills.length) return 0;
    const matching = careerSkills.filter(s => 
      userSkills.some(us => us.toLowerCase() === s.toLowerCase())
    ).length;
    return Math.round((matching / careerSkills.length) * 100);
  };

  const getSalaryValue = (salaryStr: string) => {
    const match = salaryStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getGrowthValue = (growthStr: string) => {
    const g = growthStr.toLowerCase();
    if (g.includes('very high') || g.includes('highest')) return 5;
    if (g.includes('high')) return 4;
    if (g.includes('stable') || g.includes('medium') || g.includes('moderate')) return 3;
    if (g.includes('low')) return 2;
    return 1;
  };

  const filteredCareers = allCareers.filter((career) => {
    const haystack = `${career.title} ${career.category} ${career.skills.join(' ')} ${career.pros || ''} ${career.cons || ''}`.toLowerCase();
    const matchesCategory = selectedCategory === 'All' || career.category === selectedCategory;
    const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedCareers = [...filteredCareers].sort((a, b) => {
    if (sortBy === 'growth') {
      const growthA = getGrowthValue(a.growth);
      const growthB = getGrowthValue(b.growth);
      if (growthA !== growthB) return growthB - growthA;
    }
    if (sortBy === 'salary') {
      const salA = getSalaryValue(a.salary);
      const salB = getSalaryValue(b.salary);
      if (salA !== salB) return salB - salA;
    }
    return a.title.localeCompare(b.title);
  });

  const categories = ['All', ...Array.from(new Set(allCareers.map((c) => c.category).filter(Boolean)))];
  const featuredCareers = filteredCareers
    .filter((c) => /very high|highest/i.test(c.growth))
    .slice(0, 3);

  const getTab = (careerId: string) => activeTabs[careerId] || 'overview';
  const setTab = (careerId: string, tab: 'overview' | 'analytics' | 'checklist') => {
    setActiveTabs(prev => ({ ...prev, [careerId]: tab }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <aside className="space-y-6 xl:sticky xl:top-4 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto pr-1">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search career, skill..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pl-9 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fields</p>
            <div className="flex flex-col gap-1">
              {categories.map((category) => {
                const Icon = categoryIconMap[category] || Briefcase;
                const isActive = selectedCategory === category;
                const count = category === 'All' ? allCareers.length : allCareers.filter((career) => career.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/15'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{category}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2 border-t border-slate-200/60 pt-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Skill Profile</p>
            </div>
            <p className="text-[11px] leading-4 text-slate-500 font-medium">Add skills to get personalized pathway recommendations.</p>
            {showSkillInput ? (
              <div className="flex gap-1.5">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && skillInput.trim()) {
                      const skill = skillInput.trim();
                      if (!userSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
                        setUserSkills([...userSkills, skill]);
                      }
                      setSkillInput('');
                      setShowSkillInput(false);
                    }
                  }}
                  placeholder="Type skill name..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  autoFocus
                />
                <button
                  onClick={() => setShowSkillInput(false)}
                  className="rounded-lg bg-slate-50 border border-slate-200 px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSkillInput(true)}
                className="w-full rounded-xl border border-indigo-200 bg-white py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Skills
              </button>
            )}
            {userSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {userSkills.map((skill) => (
                  <span
                      key={skill}
                      onClick={() => setUserSkills(userSkills.filter(s => s !== skill))}
                      className="group inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 cursor-pointer hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition"
                      title="Remove skill"
                  >
                    {skill}
                    <span className="text-[10px] opacity-60 group-hover:opacity-100 font-bold">×</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          {featuredCareers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-800">Featured High-Growth Paths</p>
                </div>
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer"
                >
                  View all <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {featuredCareers.map((career) => {
                  const config = featuredIconMap[career.id] || { icon: Briefcase, bg: 'bg-indigo-600', text: 'text-white' };
                  const Icon = config.icon;
                  const formattedSalary = career.salary.replace(/Rs\s*/i, '₹ ');
                  return (
                    <div
                      key={career.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-xs transition duration-200 flex flex-col justify-between animate-fadeIn"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.text} flex items-center justify-center flex-shrink-0 shadow-3xs`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">{career.title}</p>
                          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{career.category}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1 text-slate-500">
                          <User className="h-3.5 w-3.5 text-slate-400" /> {formattedSalary}
                        </span>
                        <button
                          onClick={() => {
                            const element = document.getElementById(`career-${career.id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-850 transition font-bold flex items-center gap-1 bg-transparent border-0 p-0 text-xs cursor-pointer"
                        >
                          Explore <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && <div className="surface border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1 pt-1">
            <p className="text-sm font-bold text-slate-800">
              Showing {sortedCareers.length} career paths
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Sort by:</span>
              {(['growth', 'salary', 'title'] as const).map((option) => {
                const label = option === 'growth' ? 'High Growth' : option === 'salary' ? 'High Salary' : 'Alphabetical';
                const isActive = sortBy === option;
                return (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6">
            {sortedCareers.map((career) => {
              const activeTab = getTab(career.id);
              const score = getMatchScore(career.skills);
              const growthPercentage = getGrowthPercentage(career.growth);
              const DynamicIcon = getCareerIcon(career);

              const difficultyColorMap: Record<string, { bg: string, text: string, border: string }> = {
                'Very Hard': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
                'Hard': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
                'Medium': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
                'Easy': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' },
              };
              const diffStyle = difficultyColorMap[career.difficulty] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };

              return (
                <div
                  key={career.id}
                  id={`career-${career.id}`}
                  className="surface group overflow-hidden p-6 transition-all duration-300 border border-slate-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-600 shadow-sm flex-shrink-0">
                        <DynamicIcon className="h-5.5 w-5.5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900 leading-tight">{career.title}</h3>
                          {userSkills.length > 0 && (
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              score >= 70
                                ? 'bg-teal-50 border-teal-200 text-teal-700'
                                : score >= 40
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                              {score}% Skill Match
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-500">{career.category}</p>
                      </div>
                    </div>
                    <span className={`rounded-full ${diffStyle.bg} ${diffStyle.border} ${diffStyle.text} border px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5`}>
                      <Gauge className="h-3.5 w-3.5" />
                      {career.difficulty} Entry
                    </span>
                  </div>

                  <div className="mb-5 flex border-b border-slate-200 pb-px gap-6">
                    {(['overview', 'analytics', 'checklist'] as const).map((tab) => {
                      const label = tab === 'overview' ? 'Overview' : tab === 'analytics' ? 'Market & Analytics' : 'Live Checklist';
                      const isActive = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => setTab(career.id, tab)}
                          className={`border-b-2 px-1 py-2 text-xs font-bold transition-all -mb-px ${
                            isActive
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="min-h-[140px]">
                    {activeTab === 'overview' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="grid grid-cols-3 rounded-xl border border-slate-100 bg-[#F8FAFC] py-4 px-6 mb-5">
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-slate-400 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Duration</p>
                              <p className="mt-1 text-sm font-bold text-slate-800">{career.duration}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                            <Wallet className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Salary</p>
                              <p className="mt-1 text-sm font-bold text-slate-800">{career.salary.replace(/Rs\s*/i, '₹ ')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                            <TrendingUp className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Growth</p>
                              <p className="mt-1 text-sm font-bold text-indigo-600">{career.growth}</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3 mt-4">
                          <div className="rounded-xl border border-emerald-100 bg-[#F0FDF4]/50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                              <Check className="h-3.5 w-3.5" /> Why Choose It
                            </p>
                            <p className="mt-2 text-xs leading-5 text-slate-700 font-semibold">{career.pros || 'Practical career opportunity'}</p>
                          </div>
                          <div className="rounded-xl border border-rose-100 bg-[#FFF1F2]/50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5" /> Watch Out
                            </p>
                            <p className="mt-2 text-xs leading-5 text-slate-700 font-semibold">{career.cons || 'Needs consistent practice'}</p>
                          </div>
                          <div className="flex flex-col justify-start">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">Required Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {career.skills.map((skill) => {
                                const isMatched = userSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                                return (
                                  <span
                                    key={skill}
                                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition flex items-center gap-1 ${
                                      isMatched
                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-2xs'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {isMatched && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                                    {skill}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'analytics' && (
                      <div className="grid gap-4 xl:grid-cols-3 animate-fadeIn">
                        <RadarChart
                          growth={career.growth}
                          skills={career.skills}
                          difficulty={career.difficulty}
                          roadmapDuration={career.roadmapDuration}
                          salary={career.salary}
                        />
                        <SkillGapGraph skills={career.skills} />
                        <SalaryTimeline salary={career.salary} />
                      </div>
                    )}
                    {activeTab === 'checklist' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">Skill Checklist</p>
                            <p className="text-[10px] text-slate-500 font-medium">Tick the skills you already know to calculate your match progress.</p>
                          </div>
                          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 border border-teal-100">
                            {score}% Matched
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {career.skills.map((skill) => {
                            const isChecked = userSkills.some(s => s.toLowerCase() === skill.toLowerCase());
                            return (
                              <button
                                key={skill}
                                onClick={() => toggleUserSkill(skill)}
                                className={`flex items-center gap-3 rounded-xl border p-2 text-left text-xs transition duration-200 ${
                                  isChecked
                                    ? 'border-teal-200 bg-teal-50/20 text-teal-900 shadow-2xs'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350'
                                }`}
                              >
                                <span className={`grid h-5 w-5 place-items-center rounded-md border text-xs font-bold transition ${
                                  isChecked
                                    ? 'border-teal-500 bg-teal-500 text-white'
                                    : 'border-slate-300 bg-white text-transparent'
                                }`}>
                                  ✓
                                </span>
                                <span className="font-bold">{skill}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-4 mt-5 flex flex-wrap items-center justify-between gap-4">
                    {/* Left: AI Roadmap */}
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex-shrink-0">
                        <Map className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">AI Roadmap</p>
                        <p className="mt-1 text-xs font-bold text-slate-800">{career.roadmapDuration || career.duration}</p>
                      </div>
                    </div>

                    {/* Center & Right */}
                    <div className="flex items-center gap-6">
                      {/* Growth Potential */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Growth Potential</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-teal-500 transition-all duration-500"
                              style={{ width: `${growthPercentage}%` }}
                            />
                          </div>
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-100">
                            {growthPercentage}%
                          </span>
                        </div>
                      </div>

                      {/* Explore Pathway Button */}
                      <button
                        onClick={() => {
                          const chatUserId = window.localStorage.getItem('nextstepai_chat_user_id');
                          if (chatUserId) {
                            window.localStorage.setItem('chat_input_prefetch', `Create roadmap for ${career.title}`);
                          }
                          window.location.hash = '#chat';
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Explore Pathway <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!sortedCareers.length && !error && (
            <div className="surface p-8 text-center">
              <p className="text-lg font-bold text-slate-950">No matching career found</p>
              <p className="mt-1 text-sm text-slate-500">Try another skill, category, or field name.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
