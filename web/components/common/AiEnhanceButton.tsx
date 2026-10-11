'use client';

import React, { useState } from 'react';
import { Sparkles, RotateCcw, Loader2, Check } from 'lucide-react';

interface AiEnhanceButtonProps {
  value: string;
  onEnhance: (newValue: string) => void;
  context: string;
  className?: string;
  size?: 'xs' | 'sm';
}

export default function AiEnhanceButton({
  value,
  onEnhance,
  context,
  className = '',
  size = 'xs'
}: AiEnhanceButtonProps) {
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleEnhance = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!value || !value.trim()) {
      setStatusMessage('Enter text first');
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }

    setIsEnhancing(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: value,
          context
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to enhance text');
      }

      setPreviousValue(value);
      onEnhance(data.enhancedText);
      setStatusMessage('Enhanced!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Enhancement error:', err);
      setStatusMessage('Error enhancing');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndo = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (previousValue !== null) {
      onEnhance(previousValue);
      setPreviousValue(null);
      setStatusMessage('Reverted');
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  const paddingClass = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {statusMessage && (
        <span className="text-[10px] font-bold text-[#8A064D] animate-fade-in flex items-center gap-0.5">
          {statusMessage === 'Enhanced!' && <Check className="w-2.5 h-2.5 text-emerald-600 inline" />}
          {statusMessage}
        </span>
      )}

      {/* Enhance Button */}
      <button
        type="button"
        onClick={handleEnhance}
        disabled={isEnhancing}
        title="Enhance spelling, grammar, tone & clarity with AI"
        className={`${paddingClass} rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
          isEnhancing
            ? 'bg-purple-100 text-[#8A064D] cursor-wait'
            : 'bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-[#8A064D] border border-purple-200/80 hover:border-purple-300 shadow-2xs'
        }`}
      >
        {isEnhancing ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin text-[#8A064D]" />
            <span>Enhancing...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Enhance</span>
          </>
        )}
      </button>

      {/* Undo Button */}
      {previousValue !== null && (
        <button
          type="button"
          onClick={handleUndo}
          title="Undo enhancement and restore original text"
          className={`${paddingClass} rounded-lg font-bold flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs transition cursor-pointer`}
        >
          <RotateCcw className="w-3 h-3 text-amber-700" />
          <span>Undo</span>
        </button>
      )}
    </div>
  );
}
