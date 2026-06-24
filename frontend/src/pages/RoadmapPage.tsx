import { useEffect, useState } from 'react';
import {
  CheckCircle,
  Circle,
  Briefcase,
  Award,
  Rocket,
  GraduationCap,
  Search,
  X,
} from 'lucide-react';
import type { ElementType } from 'react';
import { getRoadmapTemplates } from '../lib/api';

interface RoadmapItem {
  id: string;
  title: string;
  duration: string;
  tasks: { id: string; title: string; completed: boolean }[];
}

interface Roadmap {
  id: string;
  title: string;
  category?: string;
  educationLevels?: string[];
  duration?: string;
  salary?: string;
  difficulty?: string;
  growth?: string;
  skills?: string[];
  totalDuration: string;
  milestones: RoadmapItem[];
}

const iconMap: Record<string, ElementType> = {
  software: Briefcase,
  upsc: Award,
  mba: Rocket,
  govt: GraduationCap,
};

const streamLabelMap: Record<string, string> = {
  '10th': 'After 10th',
  '12th': 'After 12th',
  graduation: 'After Graduation',
  unknown: 'Open',
};

const branchOptions = [
  {
    id: 'btech-cse',
    label: 'B.Tech CSE',
    desc: 'Computer Science branch ke baad development, data, AI, cloud, security, testing aur product fields milte hain.',
    fieldIds: [
      'frontend-developer',
      'backend-developer',
      'full-stack-developer',
      'mobile-app-developer',
      'software-developer',
      'data-analyst',
      'data-scientist',
      'ai-ml-engineer',
      'cybersecurity-analyst',
      'cloud-devops-engineer',
      'qa-automation-engineer',
      'database-administrator',
      'product-manager',
      'ux-ui-designer',
      'game-developer',
      'blockchain-developer',
    ],
  },
  {
    id: 'btech-ai-ds',
    label: 'B.Tech AI/Data Science',
    desc: 'AI/Data Science branch se ML, analytics, data engineering aur product tech roles open hote hain.',
    fieldIds: ['ai-ml-engineer', 'data-scientist', 'data-analyst', 'software-developer', 'backend-developer', 'cloud-devops-engineer', 'product-manager'],
  },
  {
    id: 'btech-it',
    label: 'B.Tech IT',
    desc: 'IT branch se app development, cloud, cybersecurity, data aur support engineering routes milte hain.',
    fieldIds: ['frontend-developer', 'backend-developer', 'full-stack-developer', 'software-developer', 'cloud-devops-engineer', 'cybersecurity-analyst', 'network-engineer', 'database-administrator', 'qa-automation-engineer'],
  },
  {
    id: 'btech-ece',
    label: 'B.Tech ECE',
    desc: 'ECE se electronics, telecom, embedded, software, defence aur core/IT mix options bante hain.',
    fieldIds: ['embedded-systems-engineer', 'network-engineer', 'software-developer', 'backend-developer', 'cloud-devops-engineer', 'cybersecurity-analyst', 'defence-services', 'ssc-banking'],
  },
  {
    id: 'btech-mechanical',
    label: 'B.Tech Mechanical',
    desc: 'Mechanical branch se core engineering, manufacturing, automobile, design, defence aur operations options milte hain.',
    fieldIds: ['mechanical-engineer', 'defence-services', 'data-scientist', 'ssc-banking', 'entrepreneur'],
  },
  {
    id: 'btech-civil',
    label: 'B.Tech Civil',
    desc: 'Civil branch se construction, infrastructure, government, project management aur site roles open hote hain.',
    fieldIds: ['civil-engineer', 'ssc-banking', 'upsc-civil-services', 'entrepreneur'],
  },
  {
    id: 'bca-computer',
    label: 'BCA / Computer Apps',
    desc: 'BCA ke baad software, web/app development, data, cloud aur cybersecurity options milte hain.',
    fieldIds: ['frontend-developer', 'backend-developer', 'full-stack-developer', 'mobile-app-developer', 'software-developer', 'data-analyst', 'cloud-devops-engineer', 'cybersecurity-analyst', 'qa-automation-engineer'],
  },
  {
    id: 'polytechnic-it',
    label: 'Diploma IT/CSE',
    desc: 'Diploma IT/CSE se junior developer, IT support, networking, cloud basics aur lateral entry paths bante hain.',
    fieldIds: ['polytechnic-diploma-it', 'frontend-developer', 'software-developer', 'network-engineer', 'qa-automation-engineer', 'cloud-devops-engineer', 'cybersecurity-analyst'],
  },
  {
    id: 'commerce-bcom',
    label: 'B.Com / Commerce',
    desc: 'Commerce se CA, finance, banking, MBA, business aur marketing fields milte hain.',
    fieldIds: ['chartered-accountant', 'financial-analyst', 'ssc-banking', 'mba-management', 'digital-marketing', 'entrepreneur'],
  },
  {
    id: 'pcb-medical',
    label: 'PCB / Medical',
    desc: 'PCB se doctor, nursing, pharmacy, healthcare, teaching aur government options open hote hain.',
    fieldIds: ['mbbs-doctor', 'nursing', 'pharmacist', 'teacher-educator', 'upsc-civil-services'],
  },
  {
    id: 'arts-humanities',
    label: 'Arts / Humanities',
    desc: 'Arts se law, civil services, media, teaching, design aur communication fields bante hain.',
    fieldIds: ['lawyer', 'upsc-civil-services', 'journalist-media', 'teacher-educator', 'ux-ui-designer', 'content-creator'],
  },
];

export default function RoadmapPage() {
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [activeBranch, setActiveBranch] = useState('btech-cse');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStream, setActiveStream] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getRoadmapTemplates<Roadmap[]>()
      .then((templates) => {
        setRoadmaps(templates);
        setError('');
      })
      .catch((apiError) => {
        console.warn('Roadmap API unavailable:', apiError);
        setError('Roadmap data backend se load nahi ho pa raha.');
      });
  }, []);

  const toggleTask = (milestoneId: string, taskId: string) => {
    if (!selectedRoadmap) return;

    const updateRoadmap = (roadmap: Roadmap) => ({
      ...roadmap,
      milestones: roadmap.milestones.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
            }
          : m
      ),
    });

    setSelectedRoadmap((roadmap) => (roadmap ? updateRoadmap(roadmap) : roadmap));
    setRoadmaps((prev) => prev.map((roadmap) => (roadmap.id === selectedRoadmap.id ? updateRoadmap(roadmap) : roadmap)));
  };

  const categories = ['All', ...Array.from(new Set(roadmaps.map((roadmap) => roadmap.category).filter(Boolean)))];
  const streams = ['All', ...Array.from(new Set(roadmaps.flatMap((roadmap) => roadmap.educationLevels || [])))];
  const difficulties = ['All', ...Array.from(new Set(roadmaps.map((roadmap) => roadmap.difficulty).filter(Boolean)))];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredRoadmaps = roadmaps.filter((roadmap) => {
    const matchesCategory = activeCategory === 'All' || roadmap.category === activeCategory;
    const matchesStream = activeStream === 'All' || roadmap.educationLevels?.includes(activeStream);
    const matchesDifficulty = activeDifficulty === 'All' || roadmap.difficulty === activeDifficulty;
    const haystack = [
      roadmap.title,
      roadmap.category,
      roadmap.duration,
      roadmap.totalDuration,
      roadmap.difficulty,
      ...(roadmap.skills || []),
      ...(roadmap.educationLevels || []),
    ].join(' ').toLowerCase();

    return matchesCategory && matchesStream && matchesDifficulty && (!normalizedSearch || haystack.includes(normalizedSearch));
  });

  const completedTasks = selectedRoadmap?.milestones.reduce(
    (sum, m) => sum + m.tasks.filter((t) => t.completed).length,
    0
  ) || 0;
  const totalTasks = selectedRoadmap?.milestones.reduce((sum, m) => sum + m.tasks.length, 0) || 0;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const ModalIcon = selectedRoadmap ? iconMap[selectedRoadmap.id] || Briefcase : Briefcase;
  const selectedBranch = branchOptions.find((branch) => branch.id === activeBranch) || branchOptions[0];
  const branchRoadmaps = selectedBranch.fieldIds
    .map((fieldId) => roadmaps.find((roadmap) => roadmap.id === fieldId))
    .filter(Boolean) as Roadmap[];

  return (
    <div className="space-y-6">
      <div className="page-hero">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Career Roadmap</h1>
            <p className="text-sm text-slate-300">Browse every stream, branch, field, and career path in one roadmap library.</p>
          </div>
        </div>
      </div>

      <div className="surface p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
          <div>
            <p className="section-title">Branch To Field</p>
            <p className="mt-1 text-sm text-slate-500">Branch/course select karo aur dekho uske baad kya-kya ban sakte ho.</p>
            <select
              value={activeBranch}
              onChange={(event) => setActiveBranch(event.target.value)}
              className="input-field mt-3"
            >
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.label}
                </option>
              ))}
            </select>
            <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold leading-5 text-slate-600">
              {selectedBranch.desc}
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">{branchRoadmaps.length} field options after {selectedBranch.label}</p>
              <p className="text-xs font-bold text-slate-500">Click any option for roadmap</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {branchRoadmaps.map((roadmap) => (
                <button
                  key={`${activeBranch}-${roadmap.id}`}
                  onClick={() => setSelectedRoadmap(roadmap)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span className="block truncate text-sm font-extrabold text-slate-950">{roadmap.title}</span>
                  <span className="mt-1 block truncate text-xs font-bold text-slate-500">
                    {roadmap.category} | {roadmap.salary || roadmap.totalDuration}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title">All Roadmaps</p>
            <p className="mt-1 text-sm text-slate-500">Use filters to find the right stream, branch, or field.</p>
          </div>
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-700">
            {filteredRoadmaps.length}/{roadmaps.length} visible
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative md:col-span-2 xl:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search career or skill"
              className="input-field pl-9"
            />
          </div>

          <select
            value={activeCategory}
            onChange={(event) => setActiveCategory(event.target.value)}
            className="input-field"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'All' ? 'All fields' : category}
              </option>
            ))}
          </select>

          <select
            value={activeStream}
            onChange={(event) => setActiveStream(event.target.value)}
            className="input-field"
          >
            {streams.map((stream) => (
              <option key={stream} value={stream}>
                {stream === 'All' ? 'All streams' : streamLabelMap[stream] || stream}
              </option>
            ))}
          </select>

          <select
            value={activeDifficulty}
            onChange={(event) => setActiveDifficulty(event.target.value)}
            className="input-field"
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'All' ? 'All difficulty' : difficulty}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRoadmaps.map((roadmap) => {
            const Icon = iconMap[roadmap.id] || Briefcase;
            return (
              <button
                key={roadmap.id}
                onClick={() => setSelectedRoadmap(roadmap)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  selectedRoadmap?.id === roadmap.id
                    ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10'
                    : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg ${selectedRoadmap?.id === roadmap.id ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-700'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">{roadmap.title}</span>
                    <span className={`mt-1 block truncate text-xs ${selectedRoadmap?.id === roadmap.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {roadmap.category} | {roadmap.totalDuration}
                    </span>
                  </span>
                  <span className={`hidden rounded-full px-2 py-1 text-[10px] font-black sm:inline ${selectedRoadmap?.id === roadmap.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {roadmap.difficulty || 'Open'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {!filteredRoadmaps.length && <p className="mt-4 text-sm text-slate-500">No roadmap found for this search.</p>}
        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      </div>

      {selectedRoadmap && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-3 backdrop-blur-sm" onClick={() => setSelectedRoadmap(null)}>
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl shadow-slate-950/30" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-slate-200 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
                    <ModalIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black text-slate-950">{selectedRoadmap.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedRoadmap.category} | {selectedRoadmap.duration || selectedRoadmap.totalDuration} | {selectedRoadmap.salary || 'Career path'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRoadmap(null)}
                  className="icon-button h-9 w-9 flex-shrink-0"
                  aria-label="Close roadmap"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRoadmap.skills || []).slice(0, 5).map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{skill}</span>
                    ))}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
                  {completedTasks}/{totalTasks} done
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
              {selectedRoadmap.milestones.map((milestone, index) => {
                const completedCount = milestone.tasks.filter((t) => t.completed).length;
                const milestoneProgress = Math.round((completedCount / milestone.tasks.length) * 100);

                return (
                  <div key={milestone.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-slate-950 text-xs font-black text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-black leading-5 text-slate-950">{milestone.title}</h3>
                          <p className="text-xs font-bold text-slate-500">{milestone.duration}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-teal-700">{milestoneProgress}%</span>
                    </div>

                    <div className="space-y-1.5">
                      {milestone.tasks.slice(0, 4).map((task) => (
                        <button
                          key={task.id}
                          onClick={() => toggleTask(milestone.id, task.id)}
                          className="flex w-full items-start gap-2 rounded-lg bg-white px-2 py-2 text-left text-xs leading-5 hover:bg-slate-100"
                        >
                          {task.completed ? (
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                          ) : (
                            <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300" />
                          )}
                          <span className={task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}>
                            {task.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
