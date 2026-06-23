import { useEffect, useState } from 'react';
import {
  CheckCircle,
  Circle,
  Briefcase,
  Award,
  Rocket,
  GraduationCap,
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
  totalDuration: string;
  milestones: RoadmapItem[];
}

const iconMap: Record<string, ElementType> = {
  software: Briefcase,
  upsc: Award,
  mba: Rocket,
  govt: GraduationCap,
};

export default function RoadmapPage() {
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getRoadmapTemplates<Roadmap[]>()
      .then((templates) => {
        setRoadmaps(templates);
        setSelectedRoadmap(templates[0] || null);
        setError('');
      })
      .catch((apiError) => {
        console.warn('Roadmap API unavailable:', apiError);
        setError('Roadmap data backend se load nahi ho pa raha.');
      });
  }, []);

  const toggleTask = (milestoneId: string, taskId: string) => {
    setSelectedRoadmap((prev) => prev ? ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
            }
          : m
      ),
    }) : prev);
  };

  const completedTasks = selectedRoadmap?.milestones.reduce(
    (sum, m) => sum + m.tasks.filter((t) => t.completed).length,
    0
  ) || 0;
  const totalTasks = selectedRoadmap?.milestones.reduce((sum, m) => sum + m.tasks.length, 0) || 0;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="page-hero">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Career Roadmap</h1>
            <p className="text-sm text-slate-300">Track milestones and tasks for your selected goal.</p>
          </div>
        </div>
      </div>

      <div className="surface p-4">
        <p className="section-title mb-3">Select Goal</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {roadmaps.map((roadmap) => {
            const Icon = iconMap[roadmap.id] || Briefcase;
            return (
              <button
                key={roadmap.id}
                onClick={() => setSelectedRoadmap(roadmap)}
                className={`rounded-2xl border p-3 text-center transition ${
                  selectedRoadmap?.id === roadmap.id
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs font-medium">{roadmap.title}</p>
              </button>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      </div>

      {selectedRoadmap && <div className="surface p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-extrabold text-slate-950">{selectedRoadmap.title}</p>
            <p className="text-sm text-slate-500">{completedTasks} of {totalTasks} tasks completed</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-slate-950">{progress}%</p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>}

      <div className="space-y-4">
        {selectedRoadmap?.milestones.map((milestone, index) => {
          const completedCount = milestone.tasks.filter((t) => t.completed).length;
          const milestoneProgress = Math.round((completedCount / milestone.tasks.length) * 100);

          return (
            <div key={milestone.id} className="surface overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-sm font-extrabold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-950">{milestone.title}</h3>
                      <p className="text-xs text-slate-500">{milestone.duration}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-teal-700">{milestoneProgress}%</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {milestone.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(milestone.id, task.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 text-teal-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                    <span className={`text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
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
  );
}
