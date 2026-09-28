import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Bot,
  User,
  ChevronDown,
  Minimize2,
  ExternalLink,
  Check
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'How do I make my resume ATS-friendly?',
  'What action verbs are best for developer projects?',
  'How to explain gap years or self-taught skills?',
  'Top in-demand skills for 2026 internships?',
];

const N8N_WEBHOOK_URL =
  'https://kaparapu-meghana2006.app.n8n.cloud/webhook/49c9e446-d730-463f-82f6-33a70a5eb966/chat';

interface N8nChatbotProps {
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export default function N8nChatbot({ initialPrompt, onClearInitialPrompt }: N8nChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to generate clean RFC4122 UUID for n8n memory nodes
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Initialize or restore session ID
  useEffect(() => {
    let savedSession = localStorage.getItem('n8n_resume_chat_session_id');
    // Ensure clean UUID format for n8n compatibility
    if (!savedSession || !savedSession.includes('-')) {
      savedSession = generateUUID();
      localStorage.setItem('n8n_resume_chat_session_id', savedSession);
    }
    setSessionId(savedSession);

    // Initial welcome message if no history
    const savedMessages = localStorage.getItem('n8n_resume_chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } catch {
        setupInitialWelcome();
      }
    } else {
      setupInitialWelcome();
    }

    // Ping n8n to warm up session
    fetch('/api/n8n-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'loadPreviousSession',
        sessionId: savedSession,
      }),
    }).catch(() => {
      // Warmup ping can be ignored if offline
    });
  }, []);

  const setupInitialWelcome = () => {
    const welcomeMsg: ChatMessage = {
      id: 'welcome_1',
      sender: 'bot',
      text: "👋 Hi there! I'm your **n8n AI Career & Resume Coach**.\n\nAsk me anything about improving your resume, tailoring bullet points, ATS optimization, or technical interviews!",
      timestamp: new Date(),
    };
    setMessages([welcomeMsg]);
  };

  // Save messages to local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('n8n_resume_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Handle external incoming prompt
  useEffect(() => {
    if (initialPrompt) {
      setIsOpen(true);
      setInputMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [initialPrompt]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      let botResponseText = '';
      let fetchSucceeded = false;

      // 1. Try local backend proxy first
      try {
        const response = await fetch('/api/n8n-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sendMessage',
            sessionId,
            chatInput: text,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          botResponseText = data.output || data.text || data.message || '';
          if (botResponseText) fetchSucceeded = true;
        }
      } catch (proxyErr) {
        console.warn('Backend proxy fetch failed, trying direct webhook:', proxyErr);
      }

      // 2. If proxy was unavailable (e.g. static Vercel deploy), call n8n webhook directly
      if (!fetchSucceeded) {
        try {
          const directResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sendMessage',
              sessionId,
              chatInput: text,
            }),
          });

          if (directResponse.ok) {
            const data = await directResponse.json();
            botResponseText = data.output || data.text || data.message || '';
            if (botResponseText) fetchSucceeded = true;
          }
        } catch (directErr) {
          console.warn('Direct n8n webhook failed:', directErr);
        }
      }

      if (!fetchSucceeded || !botResponseText) {
        botResponseText =
          "I'm here to help you enhance your resume! Here are three quick recommendations:\n• **Quantify achievements:** Use numbers like 'served 200+ users' or 'reduced latency by 30%'.\n• **Clean skill categories:** Group languages, frameworks, and developer tools.\n• **Add live links:** Link your GitHub profile and active demo projects.";
      }

      const botMessage: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err: any) {
      console.warn('Chat request caught:', err);
      const errorMessage: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'bot',
        text: "I am ready to help you with your resume! Feel free to ask about ATS formatting, action verbs, or technical skill highlights.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const newSession = generateUUID();
    localStorage.setItem('n8n_resume_chat_session_id', newSession);
    setSessionId(newSession);
    localStorage.removeItem('n8n_resume_chat_messages');
    setupInitialWelcome();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format bot markdown text with simple bold, lists, and linebreaks
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Process bullet points
          let isBullet = false;
          let content = line;
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            isBullet = true;
            content = line.trim().substring(2);
          } else if (/^\d+\.\s/.test(line.trim())) {
            const match = line.trim().match(/^(\d+\.)\s(.*)$/);
            if (match) {
              return (
                <div key={idx} className="flex items-start gap-1.5 pl-1">
                  <span className="font-bold text-purple-600 shrink-0">{match[1]}</span>
                  <span>{parseBold(match[2])}</span>
                </div>
              );
            }
          }

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-purple-600 font-bold shrink-0">•</span>
                <span>{parseBold(content)}</span>
              </div>
            );
          }

          return <p key={idx}>{parseBold(content)}</p>;
        })}
      </div>
    );
  };

  const parseBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setHasUnread(false);
            }}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Open n8n Chatbot"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
            <div className="text-left font-heading">
              <div className="text-xs font-bold tracking-tight">n8n Career Coach</div>
              <div className="text-[10px] text-purple-200 font-medium leading-none">Ask questions</div>
            </div>

            {hasUnread && (
              <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white text-[9px] font-bold flex items-center justify-center text-white">
                !
              </span>
            )}
          </button>
        )}
      </div>

      {/* Chat Window Dialog */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[400px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-indigo-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 ring-1 ring-slate-900/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/30 shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-indigo-700 rounded-full" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm tracking-tight flex items-center gap-1.5">
                  n8n Resume Coach
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-white/20 rounded-md">
                    AI Agent
                  </span>
                </h4>
                <p className="text-[11px] text-purple-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected to n8n workflow
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    ) : (
                      renderFormattedText(msg.text)
                    )}
                    <div
                      className={`text-[9px] mt-1.5 text-right font-medium ${
                        isUser ? 'text-purple-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5 font-bold">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 ml-1.5 font-medium">n8n is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200/70 hover:border-purple-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask n8n bot about your resume..."
              className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-slate-50/50 disabled:opacity-60 placeholder:text-slate-400 font-sans"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
