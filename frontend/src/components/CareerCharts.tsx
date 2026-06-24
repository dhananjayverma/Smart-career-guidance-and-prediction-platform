import React from 'react';

export function scoreFromText(text = '', fallback = 64) {
  const t = text.toLowerCase();
  if (/highest|very high/i.test(t)) return 92;
  if (/high/i.test(t)) return 82;
  if (/medium|moderate/i.test(t)) return 64;
  if (/low|easy/i.test(t)) return 45;
  if (/hard|difficult/i.test(t)) return 72;
  return fallback;
}

export function salaryNumbers(salary = '') {
  const numbers = salary.match(/\d+/g)?.map(Number) || [];
  const start = numbers[0] || 3;
  const end = numbers[numbers.length - 1] || start + 8;
  return [start, Math.max(end, start + 4)];
}

interface RadarChartProps {
  growth: string;
  skills: string[];
  difficulty: string;
  roadmapDuration?: string;
  salary: string;
}

export function RadarChart({ growth, skills, difficulty, roadmapDuration, salary }: RadarChartProps) {
  const values = [
    scoreFromText(growth, 70),
    Math.min(95, 45 + (skills || []).length * 7),
    Math.max(25, 100 - scoreFromText(difficulty, 50) / 1.7),
    roadmapDuration ? 82 : 62,
    scoreFromText(salary, 68),
  ];
  const labels = ['Growth', 'Skills', 'Entry', 'Roadmap', 'Salary'];
  const points = values.map((value, index) => {
    const angle = (-90 + index * 72) * (Math.PI / 180);
    const radius = (value / 100) * 42;
    return `${50 + radius * Math.cos(angle)},${50 + radius * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Career Radar</p>
        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-black text-teal-700">
          {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}% fit
        </span>
      </div>
      <svg viewBox="0 0 100 100" className="mt-2 h-32 w-full">
        {[18, 30, 42].map((radius) => {
          const ring = labels.map((_, index) => {
            const angle = (-90 + index * 72) * (Math.PI / 180);
            return `${50 + radius * Math.cos(angle)},${50 + radius * Math.sin(angle)}`;
          }).join(' ');
          return <polygon key={radius} points={ring} fill="none" stroke="#e2e8f0" strokeWidth="0.8" />;
        })}
        <polygon points={points} fill="rgba(20,184,166,0.2)" stroke="#0f766e" strokeWidth="1.8" />
        {values.map((value, index) => {
          const angle = (-90 + index * 72) * (Math.PI / 180);
          const cx = 50 + ((value / 100) * 42) * Math.cos(angle);
          const cy = 50 + ((value / 100) * 42) * Math.sin(angle);
          return (
            <g key={labels[index]}>
              <circle cx={cx} cy={cy} r="2.2" fill="#0f766e" />
              <text
                x={50 + 49 * Math.cos(angle)}
                y={50 + 49 * Math.sin(angle) + 2}
                textAnchor="middle"
                fontSize="4.5"
                fontWeight="bold"
                fill="#64748b"
              >
                {labels[index]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface SkillGapGraphProps {
  skills: string[];
}

export function SkillGapGraph({ skills }: SkillGapGraphProps) {
  const displaySkills = (skills || []).slice(0, 4);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-3.5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Skill Gap analysis</p>
      <div className="mt-3.5 space-y-2.5">
        {displaySkills.length > 0 ? (
          displaySkills.map((skill, index) => {
            const value = Math.max(38, 82 - index * 9);
            return (
              <div key={skill}>
                <div className="mb-1 flex justify-between text-[11px] font-bold text-slate-600">
                  <span>{skill}</span>
                  <span className="text-teal-700">{value}% ready</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-400 italic">No skills listed</p>
        )}
      </div>
    </div>
  );
}

interface SalaryTimelineProps {
  salary: string;
}

export function SalaryTimeline({ salary }: SalaryTimelineProps) {
  const [start, end] = salaryNumbers(salary);
  const steps = [start, Math.round((start + end) / 2), end];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md p-3.5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Salary Projection</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {steps.map((step, index) => (
          <div key={`${step}-${index}`} className="relative rounded-xl bg-slate-50 p-2 text-center shadow-inner">
            <p className="text-[10px] font-black text-slate-400">Year {index === 0 ? 1 : index === 1 ? 3 : 5}</p>
            <p className="mt-1 text-xs font-black text-slate-900">₹{step} LPA</p>
          </div>
        ))}
      </div>
      <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-teal-400 via-indigo-500 to-slate-900" />
      </div>
    </div>
  );
}

interface GrowthMeterProps {
  growth: string;
}

export function GrowthMeter({ growth }: GrowthMeterProps) {
  const score = scoreFromText(growth, 68);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/40 p-2 px-3 shadow-2xs min-w-[140px]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Growth Potential</p>
        <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-black text-teal-700 border border-teal-100">
          {score}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
