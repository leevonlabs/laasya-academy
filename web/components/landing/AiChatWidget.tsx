'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  LogIn, 
  MessageCircle, 
  Bot, 
  User, 
  ExternalLink,
  ChevronRight,
  Clock,
  MapPin,
  BookOpen
} from 'lucide-react';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: "Namaste! 🙏 Welcome to **Laasya Cultural Academy**.\n\nI am your 24/7 AI Guide. You can ask me any questions about our 18+ fine arts courses, certified gurus, campus timings, fees, trial classes, or admissions.\n\nHow may I help you today?",
    time: 'Just now',
  },
];

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) {
        throw new Error('Network error');
      }

      const data = await res.json();
      const replyText = data.reply || "Thank you for reaching out. Please connect with our admissions team on WhatsApp at +91 8151 998 899 for immediate assistance.";

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "Thank you for reaching out to Laasya Cultural Academy! You can speak directly with our academy administrators on WhatsApp at **+91 8151 998 899** or visit our campus at VV Maple Hub, Kannamangala.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const formatMessageText = (text: string) => {
    // Quick bold parser for markdown
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-[#3d0c34]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Launcher Button at Bottom Right */}
      <div className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 flex flex-col items-end gap-2.5">
        {/* Helper popup pill when closed */}
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-full border border-[#D4AF37]/60 bg-white/95 px-4 py-2 shadow-xl backdrop-blur-md cursor-pointer hover:scale-105 transition-transform"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#8A064D]">Ask Laasya AI</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Laasya AI Assistant"
          className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#3d0c34] via-[#8A064D] to-[#e8c078] text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer border-2 border-white/60"
        >
          {isOpen ? (
            <X className="h-6 w-6 sm:h-7 sm:w-7 transition-transform duration-300 group-hover:rotate-90" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-[#fbf0b9]" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-white">
                <Sparkles className="h-2 w-2 text-white" />
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Floating Chat Modal / Drawer - Vertically Long Expanded Size */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:bottom-24 sm:right-7 z-50 w-[420px] sm:w-[500px] md:w-[540px] max-w-[95vw] h-[740px] sm:h-[820px] max-h-[93vh] rounded-3xl border-2 border-[#D4AF37]/50 bg-white shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#3d0c34] via-[#610a39] to-[#8A064D] p-4 sm:p-5 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/images/laasya_logo.png"
                    alt="Laasya Academy"
                    className="h-11 w-11 rounded-full bg-white/20 p-1 object-contain"
                  />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#3d0c34]" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#fbf0b9] leading-tight">
                    Laasya AI Assistant
                  </h3>
                  <p className="text-[0.7rem] sm:text-xs text-white/80">
                    Online 24/7 · Ask any questions about our academy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick WhatsApp Admin Action Button */}
            <div className="mt-3.5">
              <a
                href="https://wa.me/918151998899"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#20ba59] transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat with Academy Admin on WhatsApp (+91 8151 998 899)</span>
              </a>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF5F7]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8A064D] text-white text-xs font-bold shadow-xs">
                    <Bot className="h-4 w-4 text-[#fbf0b9]" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-[#8A064D] to-[#610a39] text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-[#D4BAC7]/70 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {formatMessageText(m.text)}
                  </div>
                  <span
                    className={`block mt-1 text-[0.6rem] text-right ${
                      m.role === 'user' ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>

                {m.role === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[#8A064D] text-xs font-bold shadow-xs">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8A064D] text-white text-xs font-bold shadow-xs">
                  <Bot className="h-4 w-4 text-[#fbf0b9]" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white p-3 border border-[#D4BAC7]/70 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#8A064D] animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-[#8A064D] animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-[#8A064D] animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about academy, courses, ERP system..."
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2 text-xs sm:text-sm text-gray-900 focus:border-[#8A064D] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8A064D]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-gradient text-[#220314] shadow-sm hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 transition-transform cursor-pointer shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
