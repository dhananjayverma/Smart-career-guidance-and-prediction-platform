import { useEffect, useState } from 'react';
import {
  BookOpen,
  Video,
  FileText,
  Star,
  Users,
  Clock,
  Library,
  Layers3,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { getMaterials } from '../lib/api';

interface Resource {
  id: string;
  title: string;
  type: 'video' | 'book' | 'course' | 'pdf';
  platform: string;
  subject: string;
  difficulty: string;
  duration?: string;
  rating: number;
  students: string;
  free: boolean;
}

interface MaterialsResponse {
  resources: Resource[];
  subjects: string[];
  types: string[];
}

const typeIcons = { video: Video, course: BookOpen, book: BookOpen, pdf: FileText };
const typeColors = {
  video: 'bg-rose-100 text-rose-800',
  course: 'bg-indigo-100 text-indigo-800',
  book: 'bg-amber-100 text-amber-800',
  pdf: 'bg-emerald-100 text-emerald-800',
};
const actionLabels = {
  video: 'Watch Now',
  pdf: 'Download',
  course: 'Start Course',
  book: 'Get Book',
};

export default function StudyMaterialPage() {
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [types, setTypes] = useState<string[]>(['All']);
  const [error, setError] = useState('');

  useEffect(() => {
    getMaterials<MaterialsResponse>({ subject: selectedSubject, type: selectedType })
      .then((data) => {
        setResources(data.resources);
        setSubjects(data.subjects);
        setTypes(data.types);
        setError('');
      })
      .catch((apiError) => {
        console.warn('Materials API unavailable:', apiError);
        setResources([]);
        setError('Study materials backend se load nahi ho pa rahe.');
      });
  }, [selectedSubject, selectedType]);

  const freeCount = resources.filter((resource) => resource.free).length;
  const topRated = resources.reduce<Resource | null>(
    (best, resource) => (!best || resource.rating > best.rating ? resource : best),
    null
  );

  return (
    <div className="space-y-5">
      <div className="page-hero p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-950">
              <Library className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-100">Learning Hub</p>
              <h1 className="mt-2 text-4xl font-black">Study Materials</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Backend resources ko subject, format, rating, duration, and access mode ke saath clean library cards me dekho.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{resources.length}</p>
              <p className="text-[11px] font-bold text-teal-100">Resources</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{freeCount}</p>
              <p className="text-[11px] font-bold text-teal-100">Free</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-black">{subjects.length}</p>
              <p className="text-[11px] font-bold text-teal-100">Subjects</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-slate-500" />
              <p className="section-title">Subjects</p>
            </div>
            <div className="flex flex-wrap gap-2 xl:flex-col">
              {subjects.map((subject) => {
                const active = selectedSubject === subject;
                return (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className={`rounded-2xl border px-3 py-2 text-left text-xs font-extrabold transition ${
                      active
                        ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface p-4">
            <p className="section-title mb-3">Format</p>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`pill ${selectedType === type ? 'pill-active' : ''}`}
                >
                  {type === 'All' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-card p-4">
            <p className="text-sm font-black text-teal-100">Best Visible Resource</p>
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <Trophy className="mb-2 h-5 w-5 text-amber-200" />
              <p className="text-sm font-black">{topRated?.title || 'No resource selected'}</p>
              <p className="mt-1 text-xs text-slate-300">
                {topRated ? `${topRated.rating} rating · ${topRated.platform}` : 'Change filters to load resources'}
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          {error && <div className="surface border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

          <div className="accent-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">Showing {resources.length} resources</p>
              <p className="text-xs font-semibold text-slate-500">Subject: {selectedSubject} · Type: {selectedType}</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
              <Sparkles className="h-4 w-4 text-teal-600" />
              Backend powered library
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {resources.map((resource) => {
              const Icon = typeIcons[resource.type];
              const color = typeColors[resource.type];

              return (
                <div key={resource.id} className="surface overflow-hidden transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-950/[0.08]">
                  <div className="flex items-start gap-4 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-5">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black uppercase text-white">{resource.platform}</span>
                        {resource.free && <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-black uppercase text-teal-800">Free</span>}
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase text-slate-500 shadow-sm">{resource.type}</span>
                      </div>
                      <h3 className="line-clamp-2 text-lg font-black text-slate-950">{resource.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700">{resource.subject}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{resource.difficulty}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      <div className="rounded-2xl bg-amber-50 p-3">
                        <Star className="mb-1 h-4 w-4 fill-amber-400 text-amber-500" />
                        <p className="text-[10px] font-black uppercase text-amber-700">Rating</p>
                        <p className="text-sm font-black text-slate-950">{resource.rating}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <Clock className="mb-1 h-4 w-4 text-slate-500" />
                        <p className="text-[10px] font-black uppercase text-slate-500">Duration</p>
                        <p className="text-sm font-black text-slate-950">{resource.duration || 'Flexible'}</p>
                      </div>
                      <div className="rounded-2xl bg-teal-50 p-3">
                        <Users className="mb-1 h-4 w-4 text-teal-700" />
                        <p className="text-[10px] font-black uppercase text-teal-700">Learners</p>
                        <p className="text-sm font-black text-slate-950">{resource.students}</p>
                      </div>
                    </div>

                    <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800">
                      {actionLabels[resource.type]}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
