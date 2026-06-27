export type MentorAvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface MentorAvatarProps {
  state: MentorAvatarState;
  audioLevel?: number;
  mentorName?: string;
  compact?: boolean;
}

export default function MentorAvatar({
  state,
  audioLevel = 0,
  mentorName = 'NextStep AI',
  compact = false,
}: MentorAvatarProps) {
  const mouthOpen = state === 'speaking' ? 0.35 + audioLevel * 0.65 : state === 'listening' ? 0.22 : 0.08;
  const size = compact ? 'h-24 w-24' : 'h-36 w-36 md:h-44 md:w-44';

  return (
    <div className={`relative mx-auto ${compact ? 'py-2' : 'py-4'}`}>
      <div
        className={`absolute inset-0 m-auto rounded-full blur-2xl transition-all duration-500 ${
          state === 'listening'
            ? 'h-28 w-28 bg-rose-400/35 animate-pulse'
            : state === 'thinking'
              ? 'h-28 w-28 bg-amber-300/30 animate-pulse'
              : state === 'speaking'
                ? 'h-32 w-32 bg-teal-400/40'
                : 'h-24 w-24 bg-teal-300/20'
        }`}
      />

      <div
        className={`relative ${size} mx-auto rounded-full border-4 border-white bg-gradient-to-br from-slate-900 via-indigo-950 to-teal-900 shadow-2xl shadow-teal-900/30 transition-transform duration-300 ${
          state === 'speaking' ? 'scale-[1.03]' : state === 'listening' ? 'scale-[1.02]' : ''
        }`}
      >
        {state === 'listening' && (
          <div className="absolute -inset-2 rounded-full border-2 border-rose-300/70 animate-ping" />
        )}

        <svg viewBox="0 0 200 200" className="h-full w-full p-5" aria-hidden>
          <defs>
            <linearGradient id="mentorFace" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#99f6e4" />
              <stop offset="100%" stopColor="#5eead4" />
            </linearGradient>
          </defs>

          <circle cx="100" cy="100" r="78" fill="url(#mentorFace)" opacity="0.18" />
          <ellipse cx="100" cy="118" rx="52" ry="46" fill="#f8fafc" opacity="0.95" />

          <g className={state === 'thinking' ? 'animate-pulse' : ''}>
            <ellipse cx="78" cy="96" rx="10" ry="12" fill="#0f172a" />
            <ellipse cx="122" cy="96" rx="10" ry="12" fill="#0f172a" />
            <circle cx="81" cy="92" r="3" fill="#ffffff" />
            <circle cx="125" cy="92" r="3" fill="#ffffff" />
          </g>

          <ellipse cx="68" cy="112" rx="8" ry="5" fill="#fda4af" opacity="0.45" />
          <ellipse cx="132" cy="112" rx="8" ry="5" fill="#fda4af" opacity="0.45" />

          <ellipse
            cx="100"
            cy="132"
            rx={18 + mouthOpen * 10}
            ry={6 + mouthOpen * 16}
            fill="#0f172a"
            className="transition-all duration-75"
          />

          {state === 'speaking' && (
            <>
              <rect x="88" y="138" width="6" height={8 + audioLevel * 10} rx="2" fill="#14b8a6" opacity="0.8" />
              <rect x="97" y="134" width="6" height={12 + audioLevel * 14} rx="2" fill="#14b8a6" opacity="0.9" />
              <rect x="106" y="138" width="6" height={8 + audioLevel * 10} rx="2" fill="#14b8a6" opacity="0.8" />
            </>
          )}
        </svg>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          {state === 'thinking' && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-teal-200 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-200 animate-bounce" style={{ animationDelay: '120ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-teal-200 animate-bounce" style={{ animationDelay: '240ms' }} />
            </>
          )}
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="text-sm font-black text-slate-950">{mentorName}</p>
        <p className="text-xs font-bold text-teal-700">
          {state === 'idle' && 'Ready to help'}
          {state === 'listening' && 'Listening...'}
          {state === 'thinking' && 'Thinking...'}
          {state === 'speaking' && 'Speaking...'}
        </p>
      </div>
    </div>
  );
}
