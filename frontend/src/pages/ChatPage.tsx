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
  TrendingUp,
  Trash2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  clearChatSessionMessages,
  getChatSession,
  getQuickQuestions,
  resolveChatSource,
  saveCareerToSession,
  sendChatFeedback,
  sendChatMessageStream,
} from '../lib/api';
import type { ChatResponse, RoadmapPhase, SessionSnapshot } from '../lib/api';
import {
  RadarChart,
  SkillGapGraph,
  SalaryTimeline,
  GrowthMeter
} from '../components/CareerCharts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'options';
  options?: Option[];
  roadmap?: RoadmapPhase[];
  source?: string;
  decision?: ChatResponse['metadata']['decision'];
  nextQuestions?: string[];
  metadata?: ChatResponse['metadata'];
  feedback?: 'up' | 'down';
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

function getWelcomeMessage(userProfile: UserProfile): Message {
  const name = userProfile.name ? ` ${userProfile.name}` : '';
  const isEnglish = userProfile.language === 'english';
  const content = isEnglish
    ? `Hello${name}! I'm NextStep AI, your personal career mentor. I'm here to listen, understand your goals, and help you with careers, exams, colleges, and complete roadmaps. What's on your mind today?`
    : `Namaste${name}! Main NextStep AI hoon — aapka career mentor. Main aapki baat sununga, samjhunga, aur careers, exams, colleges aur complete roadmaps me help karunga. Aaj aap kya discuss karna chahte ho?`;

  return {
    id: 'welcome',
    role: 'assistant',
    content,
    timestamp: new Date(),
    source: 'NextStep AI',
    nextQuestions: isEnglish
      ? ['What career should I choose after 12th?', 'Give me a roadmap to become a software developer', 'I am confused about my career']
      : ['12th ke baad kya career choose karun?', 'Software developer banne ka roadmap do', 'Career me bahut confusion hai'],
  };
}

function sessionToMessages(sessionMessages: SessionSnapshot['messages']): Message[] {
  return sessionMessages.map((msg, index) => ({
    id: `session-${index}`,
    role: msg.role,
    content: msg.content,
    timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
    source: msg.role === 'assistant' ? 'NextStep AI' : undefined,
    metadata: msg.metadata as ChatResponse['metadata'] | undefined,
  }));
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-black text-slate-950">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function renderFormattedMessage(content: string, isUser: boolean) {
  if (isUser) {
    return <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>;
  }

  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean);
  const blocks: JSX.Element[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const careerMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*$/) || line.match(/^(\d+)\.\s+(.+)$/);

    if (careerMatch) {
      const number = careerMatch[1];
      const title = careerMatch[2].replace(/\*\*/g, '');
      const details: string[] = [];
      index += 1;

      while (index < lines.length && !/^\d+\.\s+/.test(lines[index])) {
        details.push(lines[index]);
        index += 1;
      }

      const pros = details.find((item) => /^-\s*Pros:/i.test(item));
      const cons = details.find((item) => /^-\s*Cons:/i.test(item));
      const other = details.filter((item) => !/^-\s*(Pros|Cons):/i.test(item));

      blocks.push(
        <div key={`career-${number}-${title}`} className="rounded-2xl border border-teal-100 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white">{number}</span>
            <h4 className="font-black text-slate-950">{title}</h4>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {pros && (
              <div className="rounded-xl bg-teal-50 p-2.5">
                <p className="text-[10px] font-black uppercase text-teal-700">Pros</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">{pros.replace(/^-\s*Pros:\s*/i, '')}</p>
              </div>
            )}
            {cons && (
              <div className="rounded-xl bg-rose-50 p-2.5">
                <p className="text-[10px] font-black uppercase text-rose-700">Cons</p>
                <p className="mt-1 text-xs leading-5 text-slate-700">{cons.replace(/^-\s*Cons:\s*/i, '')}</p>
              </div>
            )}
          </div>
          {other.length ? (
            <div className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
              {other.map((item) => <p key={item}>{renderInlineFormatting(item.replace(/^-\s*/, ''))}</p>)}
            </div>
          ) : null}
        </div>
      );
      continue;
    }

    if (/^-\s+/.test(line)) {
      const bullets: string[] = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        bullets.push(lines[index].replace(/^-\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ul key={`bullets-${index}`} className="space-y-2 rounded-2xl bg-slate-50 p-3">
          {bullets.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-5 text-slate-700">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
              <span>{renderInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const isHeading = /^(career options|roadmap|next questions|aapke liye roadmap|aapke questions|options|recommendation)/i.test(line);
    blocks.push(
      <p
        key={`line-${index}`}
        className={isHeading ? 'text-sm font-black uppercase tracking-wide text-teal-700' : 'text-sm leading-6 text-slate-700'}
      >
        {renderInlineFormatting(line)}
      </p>
    );
    index += 1;
  }

  return <div className="space-y-3">{blocks}</div>;
}

function getChatUserId() {
  const storageKey = 'nextstepai_chat_user_id';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const created = `user-${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, created);
  return created;
}

const AUTO_CLEAR_STORAGE_KEY = 'nextstepai_chat_auto_clear';

function getAutoClearPreference() {
  return window.localStorage.getItem(AUTO_CLEAR_STORAGE_KEY) === 'true';
}

function shouldShowDecisionCard(metadata?: ChatResponse['metadata']) {
  if (metadata?.ui?.decisionCard === false) return false;
  if (metadata?.ui?.decisionCard === true) return Boolean(metadata.decision?.bestPath);
  return ['career_confusion'].includes(metadata?.intent || '') && Boolean(metadata?.decision?.bestPath);
}

export default function ChatPage({ userProfile }: { userProfile: UserProfile }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [toast, setToast] = useState('');
  const [autoClear, setAutoClear] = useState(getAutoClearPreference);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState('');
  const [chatUserId] = useState(getChatUserId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoClearCheckedRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = userProfile.language === 'english' ? 'en-IN' : 'hi-IN';

      rec.onstart = () => {
        setIsListening(true);
        setToast('Listening... Bolna shuru kijiye');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setToast(`Captured: "${transcript}"`);
          handleSend(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
        setToast('Voice input error. Try again.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [userProfile.language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setToast('Voice input not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis?.cancel();
      setSpeakingMessageId('');
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    getQuickQuestions<string[]>()
      .then(setQuickQuestions)
      .catch((error) => console.warn('Quick questions unavailable:', error));

    const shouldAutoClearNow = autoClear && !autoClearCheckedRef.current;
    const loadSession = shouldAutoClearNow
      ? clearChatSessionMessages(chatUserId)
      : getChatSession(chatUserId);

    autoClearCheckedRef.current = true;

    loadSession.then((data) => {
      setSession(data);
      if (!shouldAutoClearNow && data.messages?.length) {
        setMessages(sessionToMessages(data.messages));
      } else {
        setMessages([getWelcomeMessage(userProfile)]);
      }
      if (shouldAutoClearNow) setToast('Auto clear: fresh chat started');
    })
      .catch((error) => {
        console.warn('Chat session unavailable:', error);
        setMessages([getWelcomeMessage(userProfile)]);
      });
  }, [autoClear, chatUserId, userProfile]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    const prefetch = window.localStorage.getItem('chat_input_prefetch');
    if (prefetch) {
      window.localStorage.removeItem('chat_input_prefetch');
      setInput(prefetch);
    }
  }, []);

  const speakMessage = (message: Message) => {
    if (!('speechSynthesis' in window)) {
      setToast('Voice not supported in this browser');
      return;
    }

    window.speechSynthesis.cancel();

    if (speakingMessageId === message.id) {
      setSpeakingMessageId('');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.content.replace(/\*\*/g, ''));
    utterance.lang = userProfile.language === 'english' ? 'en-IN' : 'hi-IN';
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingMessageId('');
    utterance.onerror = () => setSpeakingMessageId('');
    setSpeakingMessageId(message.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim()) return;

    const outgoing = textToSend.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: outgoing,
      timestamp: new Date(),
    };

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const chatInput = {
      message: outgoing,
      userId: chatUserId,
      education: userProfile.education,
      language: userProfile.language,
      profile: {
        name: userProfile.name,
        interests: userProfile.interests,
      },
    };

    try {
      let streamedPreview = '';

      const apiResponse = await sendChatMessageStream(chatInput, (preview) => {
        streamedPreview = preview;
        setMessages((prev) => {
          const withoutDraft = prev.filter((msg) => msg.id !== assistantId);
          return [
            ...withoutDraft,
            {
              id: assistantId,
              role: 'assistant',
              content: preview,
              timestamp: new Date(),
              source: 'NextStep AI',
            },
          ];
        });
        setIsTyping(false);
      });

      const source = resolveChatSource(apiResponse.metadata);

      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: apiResponse.message,
        timestamp: new Date(),
        type: apiResponse.options?.length ? 'options' : 'text',
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
        roadmap: apiResponse.roadmap?.length ? apiResponse.roadmap : undefined,
        source,
        decision: shouldShowDecisionCard(apiResponse.metadata) ? apiResponse.metadata?.decision : null,
        nextQuestions: apiResponse.nextQuestions,
        metadata: apiResponse.metadata,
      };

      if (!assistantMessage.content && streamedPreview) {
        assistantMessage.content = streamedPreview;
      }

      setMessages((prev) => [...prev.filter((msg) => msg.id !== assistantId), assistantMessage]);
      if (voiceEnabled && assistantMessage.content) {
        window.setTimeout(() => speakMessage(assistantMessage), 150);
      }
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

  const sendFeedback = async (message: Message, rating: 'up' | 'down') => {
    setMessages((prev) => prev.map((item) => (
      item.id === message.id ? { ...item, feedback: rating } : item
    )));

    try {
      await sendChatFeedback(chatUserId, {
        messageId: message.id,
        rating,
        intent: message.metadata?.intent,
        problem: message.metadata?.understanding?.problem || message.metadata?.conversationState?.currentProblem,
        behaviorMode: message.metadata?.behavior?.mode,
        pattern: [
          message.metadata?.intent,
          message.metadata?.understanding?.problem || message.metadata?.conversationState?.currentProblem,
        ].filter(Boolean).join(':'),
      });
      setToast(rating === 'up' ? 'Feedback saved' : 'Feedback noted');
    } catch (error) {
      console.warn('Feedback unavailable:', error);
      setToast('Feedback failed');
    }
  };

  const clearChat = async () => {
    try {
      const nextSession = await clearChatSessionMessages(chatUserId);
      setSession(nextSession);
      setMessages([getWelcomeMessage(userProfile)]);
      setInput('');
      setToast('Chat cleared');
    } catch (error) {
      console.warn('Clear chat unavailable:', error);
      setToast('Clear failed');
    }
  };

  const toggleAutoClear = () => {
    const next = !autoClear;
    setAutoClear(next);
    window.localStorage.setItem(AUTO_CLEAR_STORAGE_KEY, String(next));
    setToast(next ? 'Auto clear enabled' : 'Auto clear disabled');
  };

  return (
    <div className="mx-auto grid h-[calc(100vh-7rem)] max-w-[1500px] gap-4 overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]">
      {toast && (
        <div className="fixed right-5 top-20 z-50 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}

      <div className="flex min-h-0 flex-col">
      <div className="page-hero mb-3 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-950">
            <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">NextStep AI Mentor</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-100">
                <span className="h-2 w-2 rounded-full bg-teal-300"></span>
                Online
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 text-center">
            {quickQuestions.slice(0, 3).map((question, index) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (!next) {
                  window.speechSynthesis?.cancel();
                  setSpeakingMessageId('');
                }
                setToast(next ? 'Voice mentor enabled' : 'Voice mentor disabled');
              }}
              className={`inline-flex items-center gap-1 rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                voiceEnabled
                  ? 'border-teal-200 bg-teal-200 text-slate-950'
                  : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
              }`}
              title="Toggle voice mentor"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Voice
            </button>
            <button
              onClick={toggleAutoClear}
              className={`inline-flex items-center gap-1 rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                autoClear
                  ? 'border-teal-200 bg-teal-200 text-slate-950'
                  : 'border-white/10 bg-white/10 text-white hover:bg-white/15'
              }`}
              title="Auto clear chat on next visit"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Auto Clear
            </button>
            <button
              onClick={clearChat}
              className="inline-flex items-center gap-1 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"
              title="Clear chat history"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="surface mb-3 min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-hidden p-3">
          {messages.length <= 1 && messages[0]?.id === 'welcome' && (
            <div className="mb-3 rounded-2xl bg-gradient-to-br from-teal-50 via-white to-indigo-50 p-4 text-center">
              <div>
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <p className="text-lg font-black text-slate-950">Quick Questions</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {quickQuestions.map((question) => (
                    <button key={question} onClick={() => setInput(question)} className="pill">
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="h-full space-y-3 overflow-y-auto pr-1">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs border transition ${
                  message.role === 'assistant'
                    ? 'bg-slate-950 border-teal-500/20 text-white shadow-teal-500/10'
                    : 'bg-white border-slate-200 text-slate-700 shadow-slate-200/10'
                }`}
              >
                {message.role === 'assistant' ? (
                  <Bot className="w-4.5 h-4.5 text-teal-300 animate-pulse" />
                ) : (
                  <User className="w-4.5 h-4.5 text-slate-600" />
                )}
              </div>

              <div
                className={`max-w-[84%] px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md shadow-indigo-950/15 rounded-2xl rounded-tr-xs border border-indigo-950/20'
                    : 'bg-white text-slate-800 border border-slate-200/70 shadow-sm shadow-slate-100/50 rounded-2xl rounded-tl-xs'
                }`}
              >
                {renderFormattedMessage(message.content, message.role === 'user')}

                {message.roadmap?.length ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-black uppercase tracking-wide text-teal-700">Complete Roadmap</p>
                    {message.roadmap.map((phase, phaseIndex) => (
                      <div key={`${phase.title}-${phaseIndex}`} className="rounded-2xl border border-teal-200 bg-white p-3 text-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-slate-950">{phaseIndex + 1}. {phase.title}</p>
                          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">{phase.duration}</span>
                        </div>
                        {phase.tasks?.length ? (
                          <ul className="mt-2 space-y-1 text-xs text-slate-600">
                            {phase.tasks.map((task, taskIndex) => (
                              <li key={taskIndex} className="flex gap-2">
                                <span className="text-teal-600">•</span>
                                <span>{typeof task === 'string' ? task : task.title}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Options Cards */}
                {message.type === 'options' && message.options && (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {message.options.slice(0, 2).map((option, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-800"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-950">{option.title}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{option.duration}</span>
                        </div>
                        <p className="line-clamp-2 text-xs text-slate-600">{option.description}</p>
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

                {shouldShowDecisionCard(message.metadata) && message.decision?.bestPath && (
                  <div className="mt-3 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-3 text-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-teal-700">Best Match</p>
                        <h3 className="mt-1 text-base font-black">{message.decision.bestPath.title}</h3>
                        <p className="line-clamp-2 mt-1 text-xs leading-5 text-slate-600">{message.decision.bestPath.reason}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-950 px-3 py-2 text-center text-white">
                        <p className="text-xl font-black">{message.decision.bestPath.outcome.successProbability}%</p>
                        <p className="text-[10px] font-bold text-teal-100">match</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
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

                    {/* Premium Career Match Charts */}
                    <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                      <RadarChart
                        growth={message.decision.bestPath.growth || 'Medium'}
                        skills={message.decision.bestPath.skills || []}
                        difficulty={message.decision.bestPath.difficulty || 'Medium'}
                        roadmapDuration={message.decision.bestPath.roadmapDuration}
                        salary={message.decision.bestPath.salary || 'Rs 3-8 LPA'}
                      />
                      <SkillGapGraph skills={message.decision.bestPath.skills || []} />
                      <div className="sm:col-span-2">
                        <SalaryTimeline salary={message.decision.bestPath.salary || 'Rs 3-8 LPA'} />
                      </div>
                      <div className="sm:col-span-2">
                        <GrowthMeter growth={message.decision.bestPath.growth || 'Medium'} />
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

                {message.role === 'assistant' && message.id !== 'welcome' ? (
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      onClick={() => speakMessage(message)}
                      className={`grid h-7 w-7 place-items-center rounded-lg bg-white text-slate-600 transition hover:text-indigo-700 ${
                        speakingMessageId === message.id ? 'text-indigo-700 ring-1 ring-indigo-200' : ''
                      }`}
                      aria-label={speakingMessageId === message.id ? 'Stop voice' : 'Speak response'}
                      title={speakingMessageId === message.id ? 'Stop voice' : 'Speak response'}
                    >
                      {speakingMessageId === message.id ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => sendFeedback(message, 'up')}
                      className={`grid h-7 w-7 place-items-center rounded-lg bg-white text-slate-600 transition hover:text-teal-700 ${
                        message.feedback === 'up' ? 'text-teal-700 ring-1 ring-teal-200' : ''
                      }`}
                      aria-label="Good response"
                      title="Good response"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => sendFeedback(message, 'down')}
                      className={`grid h-7 w-7 place-items-center rounded-lg bg-white text-slate-600 transition hover:text-rose-700 ${
                        message.feedback === 'down' ? 'text-rose-700 ring-1 ring-rose-200' : ''
                      }`}
                      aria-label="Poor response"
                      title="Poor response"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
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
      </div>

      <div className="surface p-2.5">
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={`grid h-11 w-11 place-items-center rounded-xl transition ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30 hover:bg-rose-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            aria-label="Voice input"
            title="Start voice input"
          >
            <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />
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
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      </div>

      <aside className="hidden min-h-0 grid-rows-[auto_auto_1fr_auto] gap-3 overflow-hidden lg:grid">
        <div className="grid grid-cols-2 gap-2">
          {(session?.stats || [
            { label: 'Messages', value: '0' },
            { label: 'Saved Careers', value: '0' },
          ]).slice(0, 4).map((stat) => (
            <div key={stat.label} className="surface p-3">
              <p className="text-xl font-black text-slate-950">{stat.value}</p>
              <p className="text-[11px] font-bold text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="gradient-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold text-teal-700">Quick Questions</p>
            <TrendingUp className="h-4 w-4 text-teal-650" />
          </div>
          <div className="mt-3 space-y-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-left text-xs font-bold text-slate-800 transition hover:bg-slate-50 shadow-2xs hover:-translate-y-0.5 duration-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
        <div className="surface min-h-0 overflow-hidden p-3 bg-white">
          <p className="section-title">Saved Careers</p>
          <div className="mt-3 space-y-2 overflow-hidden">
            {session?.savedCareers.length ? (
              session.savedCareers.slice(-4).map((career) => (
                <div key={`${career.title}-${career.savedAt}`} className="rounded-2xl bg-slate-50 border border-slate-150 p-2.5 text-xs font-black text-slate-800 shadow-2xs">
                  {career.title}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-xs font-bold text-slate-500">
                Saved career cards will appear here.
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="accent-card p-3">
            <Target className="mb-2 h-4 w-4 text-teal-700" />
            <p className="text-xs font-black text-slate-950">Match</p>
          </div>
          <div className="accent-card p-3">
            <Bookmark className="mb-2 h-4 w-4 text-indigo-700" />
            <p className="text-xs font-black text-slate-950">Save</p>
          </div>
          <div className="accent-card p-3">
            <Route className="mb-2 h-4 w-4 text-slate-700" />
            <p className="text-xs font-black text-slate-950">Plan</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
