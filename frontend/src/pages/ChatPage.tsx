import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Mic,
  Sparkles,
  MessageSquare,
  Bookmark,
  GitCompare,
  Route,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { getChatSession, getQuickQuestions, saveCareerToSession, sendChatMessage } from '../lib/api';
import type { ChatResponse, SessionSnapshot } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'options';
  options?: Option[];
  source?: string;
  decision?: ChatResponse['metadata']['decision'];
  nextQuestions?: string[];
}

interface Option {
  title: string;
  duration: string;
  salary: string;
  description: string;
}

interface UserProfile {
  name: string;
  education: string;
  interests: string[];
  language: 'hindi' | 'hinglish' | 'english';
}

function getChatUserId() {
  const storageKey = 'nextstepai_chat_user_id';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const created = `user-${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, created);
  return created;
}

export default function ChatPage({ userProfile }: { userProfile: UserProfile }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [toast, setToast] = useState('');
  const [chatUserId] = useState(getChatUserId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    getQuickQuestions<string[]>()
      .then(setQuickQuestions)
      .catch((error) => console.warn('Quick questions unavailable:', error));
    getChatSession(chatUserId)
      .then(setSession)
      .catch((error) => console.warn('Chat session unavailable:', error));
  }, [chatUserId]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const apiResponse = await sendChatMessage({
        message: input,
        userId: userProfile.name || chatUserId,
        education: userProfile.education,
        language: userProfile.language,
      });

      const source = apiResponse.metadata?.aiMode === 'groq'
        ? `Groq AI${apiResponse.metadata.model ? ` - ${apiResponse.metadata.model}` : ''}`
        : apiResponse.metadata?.aiMode === 'langchain-groq'
          ? `LangChain Groq${apiResponse.metadata.model ? ` - ${apiResponse.metadata.model}` : ''}`
        : apiResponse.metadata?.aiMode === 'rule-based'
          ? 'Career Mentor'
        : 'Local fallback';

      const response = {
        content: [
          apiResponse.message,
          apiResponse.recommendation ? `\nRecommendation: ${apiResponse.recommendation}` : '',
        ].join(''),
        options: apiResponse.options?.map((option) => ({
          title: option.title || option.name || 'Career option',
          duration: option.duration,
          salary: option.salary,
          description: [
            option.description || option.pros || option.difficulty || '',
            option.successProbability ? `Success chance: ${option.successProbability}%` : '',
            option.riskLevel ? `Risk: ${option.riskLevel}` : '',
          ].filter(Boolean).join(' | '),
        })),
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        type: response.options?.length ? 'options' : 'text',
        options: response.options,
        source,
        decision: apiResponse.metadata?.decision,
        nextQuestions: apiResponse.nextQuestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      getChatSession(chatUserId).then(setSession).catch(() => undefined);
    } catch (error) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Backend se connection nahi ho pa raha. Please backend start karo aur VITE_API_URL check karo.',
        timestamp: new Date(),
        source: 'API unavailable',
      };
      console.warn('Chat API unavailable:', error);
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const saveCareer = async (title: string, metadata: Record<string, unknown> = {}) => {
    try {
      const nextSession = await saveCareerToSession(chatUserId, { title, source: 'chat', metadata });
      setSession(nextSession);
      setToast(`${title} saved`);
    } catch (error) {
      console.warn('Save career unavailable:', error);
      setToast('Save failed');
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1500px] gap-5 xl:grid-cols-[1fr_360px]">
      {toast && (
        <div className="fixed right-5 top-20 z-50 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}

      <div className="flex min-h-0 flex-col">
      <div className="page-hero mb-4">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
            <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">NextStep AI Mentor</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-100">
                <span className="h-2 w-2 rounded-full bg-teal-300"></span>
                Online
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {quickQuestions.slice(0, 3).map((question, index) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="surface mb-4 min-h-0 flex-1 overflow-hidden">
        <div className="h-[calc(100vh-23rem)] min-h-[420px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center rounded-2xl bg-gradient-to-br from-teal-50 via-white to-indigo-50 p-6 text-center">
              <div>
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="text-xl font-black text-slate-950">Quick Questions</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {quickQuestions.map((question) => (
                    <button key={question} onClick={() => setInput(question)} className="pill">
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                  message.role === 'assistant' ? 'bg-slate-950' : 'bg-slate-100'
                }`}
              >
                {message.role === 'assistant' ? (
                  <Bot className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-slate-700" />
                )}
              </div>

              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-slate-950 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>

                {/* Options Cards */}
                {message.type === 'options' && message.options && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {message.options.map((option, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-800"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-950">{option.title}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{option.duration}</span>
                        </div>
                        <p className="text-xs text-slate-600">{option.description}</p>
                        <p className="text-xs font-medium text-emerald-700 mt-1">{option.salary}</p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => saveCareer(option.title, { salary: option.salary, duration: option.duration })}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-bold text-white"
                          >
                            <Bookmark className="h-3.5 w-3.5" /> Save
                          </button>
                          <button
                            onClick={() => setInput(`Compare ${option.title} with other options`)}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                          >
                            <GitCompare className="h-3.5 w-3.5" /> Compare
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {message.decision?.bestPath && (
                  <div className="mt-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 text-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-teal-700">Best Match</p>
                        <h3 className="mt-1 text-lg font-black">{message.decision.bestPath.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{message.decision.bestPath.reason}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-950 px-3 py-2 text-center text-white">
                        <p className="text-xl font-black">{message.decision.bestPath.outcome.successProbability}%</p>
                        <p className="text-[10px] font-bold text-teal-100">match</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3">
                        <ShieldCheck className="mb-2 h-4 w-4 text-teal-700" />
                        <p className="text-xs font-bold text-slate-500">Risk</p>
                        <p className="font-black">{message.decision.bestPath.outcome.riskLevel}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <Target className="mb-2 h-4 w-4 text-indigo-700" />
                        <p className="text-xs font-bold text-slate-500">Next Skill</p>
                        <p className="font-black">{message.decision.bestPath.skillGap.nextSkill || 'Keep practicing'}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <Route className="mb-2 h-4 w-4 text-slate-700" />
                        <p className="text-xs font-bold text-slate-500">Roadmap</p>
                        <p className="font-black">{message.decision.bestPath.roadmapPreview.length} phases</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => saveCareer(message.decision!.bestPath!.title, message.decision!.bestPath as unknown as Record<string, unknown>)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                      >
                        <Bookmark className="h-3.5 w-3.5" /> Save Best Path
                      </button>
                      <button
                        onClick={() => setInput(`Create roadmap for ${message.decision?.bestPath?.title}`)}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        <Route className="h-3.5 w-3.5" /> Create Roadmap
                      </button>
                    </div>
                  </div>
                )}

                {message.nextQuestions?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.nextQuestions.map((question) => (
                      <button key={question} onClick={() => setInput(question)} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                        {question}
                      </button>
                    ))}
                  </div>
                ) : null}

                <p className="text-[10px] opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.role === 'assistant' && message.source ? ` - ${message.source}` : ''}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-950">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-lg bg-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-2 text-xs text-slate-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="surface p-3">
        <div className="flex gap-2">
          <button className="icon-button" aria-label="Voice input">
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question"
            className="input-field flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
      </div>

      <aside className="hidden xl:flex xl:flex-col xl:gap-4">
        <div className="gradient-card">
          <p className="text-sm font-extrabold text-teal-100">Quick Questions</p>
          <div className="mt-4 space-y-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-left text-sm font-bold text-white transition hover:bg-white/15"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
        {session && (
          <div className="surface p-4">
            <p className="section-title">Your Session</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {session.stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50 p-3">
                  <p className="text-2xl font-black text-slate-950">{stat.value}</p>
                  <p className="text-[11px] font-bold text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {session?.savedCareers.length ? (
          <div className="surface p-4">
            <p className="section-title">Saved Careers</p>
            <div className="mt-3 space-y-2">
              {session.savedCareers.slice(-4).map((career) => (
                <div key={`${career.title}-${career.savedAt}`} className="rounded-2xl bg-white/80 p-3 text-sm font-bold text-slate-800">
                  {career.title}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
