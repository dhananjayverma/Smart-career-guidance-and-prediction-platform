const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const customHeaders = options?.headers as Record<string, string> | undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText.slice(0, 160)}`);
  }

  const payload = await response.json();
  return payload.data ?? payload;
}

export interface ChatOption {
  name?: string;
  title?: string;
  duration: string;
  salary: string;
  difficulty?: string;
  description?: string;
  pros?: string;
  cons?: string;
  skills?: string[];
  successProbability?: number;
  riskLevel?: string;
}

export interface RoadmapPhase {
  title: string;
  duration: string;
  tasks?: (string | { title: string })[];
}

export interface ChatResponse {
  message: string;
  options: ChatOption[];
  roadmap: RoadmapPhase[];
  recommendation: string;
  nextQuestions: string[];
  metadata: {
    language: string;
    intent: string;
    education: string;
    aiMode?: string;
    model?: string;
    pipeline?: string;
    templateId?: string;
    fallbackReason?: string;
    ui?: {
      decisionCard?: boolean;
      careerCard?: boolean;
      skillGap?: boolean;
      roadmapCard?: boolean;
    };
    behavior?: {
      mode?: 'ASK' | 'SUPPORT' | 'GUIDE' | 'PLAN';
      reason?: string;
    };
    understanding?: {
      emotion?: string;
      intent?: string;
      problem?: string;
      target?: string;
      userType?: string;
      confidence?: number;
    };
    conversationState?: {
      stage?: string;
      currentProblem?: string;
      problemKey?: string;
    };
    decision?: {
      bestPath?: {
        id: string;
        title: string;
        reason: string;
        outcome: {
          successProbability: number;
          failureRisk: number;
          effortLevel: string;
          riskLevel: string;
        };
        skillGap: {
          target: string;
          missingSkills: string[];
          missingCount: number;
          nextSkill: string;
        };
        roadmapPreview: { title: string; duration: string; tasks: { title: string }[] }[];
        salary?: string;
        growth?: string;
        difficulty?: string;
        skills?: string[];
        roadmapDuration?: string;
      } | null;
      backupPath?: {
        id: string;
        title: string;
        outcome: {
          successProbability: number;
          riskLevel: string;
        };
      } | null;
      rankedPaths?: {
        title: string;
        successProbability: number;
        riskLevel: string;
        missingSkills: string[];
      }[];
    } | null;
  };
}

export function sendChatMessage(input: {
  message: string;
  userId: string;
  education?: string;
  interest?: string;
  language?: string;
  profile?: { name?: string; interests?: string[]; skills?: string[] };
}) {
  return request<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function sendChatMessageStream(
  input: {
    message: string;
    userId: string;
    education?: string;
    interest?: string;
    language?: string;
    profile?: { name?: string; interests?: string[]; skills?: string[] };
  },
  onDelta: (chunk: string) => void
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalPayload: ChatResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const payload = JSON.parse(trimmed.slice(5).trim());
      if (payload.type === 'delta' && payload.content) {
        onDelta(payload.content);
      }
      if (payload.type === 'done' && payload.data) {
        finalPayload = payload.data as ChatResponse;
      }
      if (payload.type === 'error') {
        throw new Error(payload.message || 'Stream error');
      }
    }
  }

  if (!finalPayload) {
    throw new Error('Stream ended without final response');
  }

  return finalPayload;
}

function resolveChatSource(metadata?: ChatResponse['metadata']) {
  const pipeline = metadata?.pipeline as string | undefined;
  const aiMode = metadata?.aiMode;
  const model = metadata?.model;

  if (pipeline === 'cache') return 'Instant · Cached';
  if (pipeline === 'template' || aiMode === 'template-engine') return 'Instant · Guide';
  if (pipeline === 'local-engine' || aiMode === 'local-engine') return 'Career Mentor';
  if (pipeline === 'static-fallback' || aiMode === 'static-fallback') return 'Offline Guide';
  if (aiMode === 'openrouter') return `OpenRouter${model ? ` · ${model}` : ''}`;
  if (aiMode === 'groq' || pipeline === 'ai-stream') return `Groq${model ? ` · ${model}` : ''}`;
  if (aiMode === 'together') return `Together AI${model ? ` · ${model}` : ''}`;
  if (aiMode === 'openai') return `OpenAI${model ? ` · ${model}` : ''}`;
  return 'NextStep AI';
}

export { resolveChatSource };

export interface SessionSnapshot {
  messages: { role: 'user' | 'assistant'; content: string; metadata?: Record<string, unknown>; createdAt?: string }[];
  savedCareers: { id?: string; title: string; source?: string; metadata?: Record<string, unknown>; savedAt?: string }[];
  stats: { label: string; value: string }[];
  latestIntent?: string;
}

export function getChatSession<T = SessionSnapshot>(userId: string) {
  return request<T>(`/api/chat/session/${encodeURIComponent(userId)}`);
}

export function saveCareerToSession<T = SessionSnapshot>(
  userId: string,
  input: { id?: string; title: string; source?: string; metadata?: Record<string, unknown> }
) {
  return request<T>(`/api/chat/session/${encodeURIComponent(userId)}/saved-careers`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function clearChatSessionMessages<T = SessionSnapshot>(userId: string) {
  return request<T>(`/api/chat/session/${encodeURIComponent(userId)}/messages`, {
    method: 'DELETE',
  });
}

export function clearUserMemory<T = any>(userId: string) {
  return request<T>(`/api/chat/session/${encodeURIComponent(userId)}/memory`, {
    method: 'DELETE',
  });
}

export function sendChatFeedback<T = { rating: 'up' | 'down'; learned: boolean }>(
  userId: string,
  input: {
    messageId: string;
    rating: 'up' | 'down';
    intent?: string;
    problem?: string;
    behaviorMode?: string;
    pattern?: string;
  }
) {
  return request<T>(`/api/chat/session/${encodeURIComponent(userId)}/feedback`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCareers<T>(category = 'All') {
  return request<T>(`/api/career?category=${encodeURIComponent(category)}`);
}

export function getCareerSuggestions<T>(filters: { education?: string; interest?: string; category?: string }) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return request<T>(`/api/career/suggestions?${params.toString()}`);
}

export function getColleges<T>(filters: { search?: string; type?: string; state?: string }) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return request<T>(`/api/colleges?${params.toString()}`);
}

export function getRoadmapTemplates<T>() {
  return request<T>('/api/roadmap');
}

export function createRoadmap<T>(career: string) {
  return request<T>('/api/roadmap', {
    method: 'POST',
    body: JSON.stringify({ career }),
  });
}

export function getCompareOptions<T>() {
  return request<T>('/api/content/compare');
}

export function getDashboard<T>() {
  return request<T>('/api/content/dashboard');
}

export function getHome<T>() {
  return request<T>('/api/content/home');
}

export function getNavigation<T>() {
  return request<T>('/api/content/navigation');
}

export function getSettings<T>() {
  return request<T>('/api/content/settings');
}

export function getMaterials<T>(filters: { subject?: string; type?: string }) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return request<T>(`/api/content/materials?${params.toString()}`);
}

export function getQuickQuestions<T>() {
  return request<T>('/api/content/quick-questions');
}

export function getSimulations<T>() {
  return request<T>('/api/content/simulations');
}
