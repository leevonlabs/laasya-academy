'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
X, 
  Send, 
  MessageCircle, 
  Bot, 
  User, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { useEnquiry } from './EnquiryContext';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: string;
  hasMore?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome',
    role: 'assistant',
    text: "Namaste! 🙏 Welcome to **Laasya Cultural Academy**.\n\nI am your live AI Admissions Assistant. You can ask me about our courses (Bharatanatyam, Carnatic Music, Western Dance, Yoga, Instruments), published fees, batch timings, seat availability, or booking a complimentary trial class.\n\nHow may I help you today?",
    time: 'Just now',
  },
];

const SUGGESTION_CHIPS = [
  'Bharatanatyam batches & fees',
  'Complimentary trial class',
  'Weekend batch timings',
  'Age criteria & admissions',
];

// --------------------------------------------------------------------------
// ROBUST MARKDOWN PARSER FOR CHAT MESSAGES
// --------------------------------------------------------------------------
function renderInline(str: string): React.ReactNode[] {
  // Matches markdown links [text](url), bold **text**, and italic *text*
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.substring(lastIdx, match.index));
    }
    if (match[2] && match[3]) {
      // Link [text](url)
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[3]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#8A064D] underline hover:text-[#3d0c34] transition-colors"
        >
          {match[2]}
        </a>
      );
    } else if (match[4]) {
      // Bold **text**
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold text-[#3d0c34]">
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      // Italic *text*
      parts.push(
        <em key={`italic-${match.index}`} className="italic text-gray-700">
          {match[5]}
        </em>
      );
    }
    lastIdx = pattern.lastIndex;
  }

  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }

  return parts.length > 0 ? parts : [str];
}

function FormattedMarkdown({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      renderedElements.push(<div key={`sp-${i}`} className="h-1.5" />);
      continue;
    }

    // Dividers: ---, ***, ___
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      renderedElements.push(<hr key={`hr-${i}`} className="my-2 border-t border-[#D4BAC7]/60" />);
      continue;
    }

    // Headings: ###, ##, #
    if (trimmed.startsWith('### ')) {
      renderedElements.push(
        <h4 key={`h4-${i}`} className="text-xs sm:text-sm font-bold text-[#3d0c34] mt-2 mb-1 flex items-center gap-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      renderedElements.push(
        <h3 key={`h3-${i}`} className="text-sm sm:text-base font-bold text-[#3d0c34] mt-2.5 mb-1">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      renderedElements.push(
        <h2 key={`h2-${i}`} className="text-base sm:text-lg font-bold text-[#3d0c34] mt-3 mb-1.5">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Unordered list items: •, *, -
    if (trimmed.startsWith('• ') || trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const content = trimmed.slice(2);
      renderedElements.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 pl-1">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8A064D] shrink-0" />
          <span className="flex-1 leading-relaxed">{renderInline(content)}</span>
        </div>
      );
      continue;
    }

    // Numbered list items: 1. , 2. , etc.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      renderedElements.push(
        <div key={`ol-${i}`} className="flex items-start gap-2 my-1 pl-1">
          <span className="font-bold text-[#8A064D] text-xs shrink-0 mt-0.5">{numMatch[1]}.</span>
          <span className="flex-1 leading-relaxed">{renderInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Default regular paragraph
    renderedElements.push(
      <p key={`p-${i}`} className="my-0.5 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  }

  return <div className="space-y-0.5">{renderedElements}</div>;
}

interface AiChatWidgetProps {
  whatsappNumber?: string;
  campusAddress?: string;
}

export function AiChatWidget({ whatsappNumber, campusAddress }: AiChatWidgetProps = {}) {
  const targetWa = whatsappNumber?.trim() || '+91 8151 998 899';
  const cleanWa = targetWa.replace(/[^0-9]/g, '');
  const targetAddress = campusAddress?.trim() || 'VV Maple Hub, Kannamangala';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { openEnquiryModal } = useEnquiry();

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
      const replyText = data.reply || `Thank you for reaching out. Please connect with our admissions team on WhatsApp at ${targetWa} for immediate assistance.`;
      const hasMore = Boolean(data.hasMore);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasMore,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `Thank you for reaching out to Laasya Cultural Academy! You can speak directly with our academy administrators on WhatsApp at **${targetWa}** or visit our campus at ${targetAddress}.`,
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
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Floating Chat Modal / Drawer */}
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
                    Online 24/7 · Live Admissions & Academy Guide
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

            {/* Quick Actions Bar */}
            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/${cleanWa}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white shadow hover:bg-[#20ba59] transition-all"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp Admissions</span>
              </a>
              <button
                type="button"
                onClick={() => openEnquiryModal()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#3d0c34] px-3 py-2 text-xs font-bold shadow hover:brightness-105 transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Book Trial / Enquiry</span>
              </button>
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
                  className={`max-w-[85%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-[#8A064D] to-[#610a39] text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-[#D4BAC7]/70 rounded-tl-none'
                  }`}
                >
                  <FormattedMarkdown text={m.text} isUser={m.role === 'user'} />

                  {/* Interactive continuation button if more results exist */}
                  {m.hasMore && (
                    <div className="mt-3 pt-2.5 border-t border-[#D4BAC7]/60 flex items-center justify-between">
                      <span className="text-[0.7rem] text-gray-500 italic">More batches available</span>
                      <button
                        type="button"
                        onClick={() => handleSendMessage('Show more batches and timings')}
                        disabled={loading}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#3d0c34] px-3 py-1.5 text-xs font-bold shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <span>➕ Show More Batches</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

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

          {/* Quick Suggestions Chips */}
          <div className="px-3 pt-2 pb-1 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSendMessage(chip)}
                disabled={loading}
                className="whitespace-nowrap rounded-full border border-[#D4AF37]/50 bg-[#FAF5F7] px-2.5 py-1 text-[0.7rem] font-medium text-[#8A064D] hover:bg-[#8A064D] hover:text-white transition-colors cursor-pointer shrink-0 disabled:opacity-40"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about courses, batch timings, fees, trial class..."
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
