import { useEffect, useState } from 'react';
import {
  BookOpen,
  Video,
  FileText,
  Star,
  Users,
  Clock,
  Library,
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
const typeColors = { video: 'bg-red-100 text-red-800', course: 'bg-blue-100 text-blue-800', book: 'bg-amber-100 text-amber-800', pdf: 'bg-emerald-100 text-emerald-800' };

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

  return (
    <div className="space-y-6">
      <div className="page-hero">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Study Materials</h1>
            <p className="text-sm text-slate-300">Filter resources by subject and format.</p>
          </div>
        </div>
      </div>

      <div className="surface p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="section-title mb-2">Subject</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`pill ${selectedSubject === subject ? 'pill-active' : ''}`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="section-title mb-2">Type</p>
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
        </div>
      </div>

      {error && <div className="surface border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {resources.map((resource) => {
          const Icon = typeIcons[resource.type];
          const color = typeColors[resource.type];

          return (
            <div key={resource.id} className="surface overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{resource.platform}</span>
                      {resource.free && <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">FREE</span>}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-950">{resource.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-400" />{resource.rating}</span>
                  {resource.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{resource.duration}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{resource.students}</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{resource.subject}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{resource.difficulty}</span>
                </div>

                <button className={`w-full rounded-xl py-2 text-center text-sm font-extrabold ${color.split(' ')[0]}`}>
                  {resource.type === 'video' && 'Watch Now'}
                  {resource.type === 'pdf' && 'Download'}
                  {resource.type === 'course' && 'Start Course'}
                  {resource.type === 'book' && 'Get Book'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
