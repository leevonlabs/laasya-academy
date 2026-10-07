'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, X, AlertCircle, ZoomIn, ZoomOut, Move, RotateCcw, Check, Sparkles } from 'lucide-react';

interface PhotoUploadInputProps {
  value?: string | null;
  onChange: (photoDataUrl: string | null) => void;
  label?: string;
  initials?: string;
  studentName?: string;
  rollNumber?: string;
  maxSizeMB?: number;
}

export default function PhotoUploadInput({
  value,
  onChange,
  label = 'Student Portrait Photo',
  initials = 'ST',
  studentName,
  rollNumber,
  maxSizeMB = 4
}: PhotoUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Adjuster modal state
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustImageSrc, setAdjustImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Fixed outlook frame dimensions: exact 4:5 portrait ratio (280px wide x 350px tall)
  const FRAME_W = 280;
  const FRAME_H = 350;
  const CANVAS_W = 560;
  const CANVAS_H = 700;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`Image size (${sizeMB} MB) exceeds ${maxSizeMB} MB limit.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      setAdjustImageSrc(rawDataUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsAdjustOpen(true);
    };

    reader.onerror = () => {
      setError('Failed to read image file.');
    };

    reader.readAsDataURL(file);
  };

  const handleOpenAdjusterForExisting = () => {
    if (!value) return;
    setAdjustImageSrc(value);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsAdjustOpen(true);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag handlers for interactive positioning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Compute exact image dimensions and offset
  const getRenderMetrics = () => {
    if (!imgNaturalSize) {
      return { renderedW: FRAME_W, renderedH: FRAME_H, offsetX: 0, offsetY: 0 };
    }
    const baseScale = Math.max(FRAME_W / imgNaturalSize.width, FRAME_H / imgNaturalSize.height);
    const renderedW = imgNaturalSize.width * baseScale * zoom;
    const renderedH = imgNaturalSize.height * baseScale * zoom;
    const offsetX = (FRAME_W - renderedW) / 2 + pan.x;
    const offsetY = (FRAME_H - renderedH) / 2 + pan.y;
    return { renderedW, renderedH, offsetX, offsetY };
  };

  const { renderedW, renderedH, offsetX, offsetY } = getRenderMetrics();

  // Save the adjusted crop onto canvas (560x700 px exact 4:5 ratio)
  const handleApplyAdjustment = () => {
    if (!adjustImageSrc || !imageElementRef.current || !imgNaturalSize) {
      setIsAdjustOpen(false);
      return;
    }

    try {
      const img = imageElementRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        onChange(adjustImageSrc);
        setIsAdjustOpen(false);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scale = CANVAS_W / FRAME_W;

      ctx.drawImage(
        img,
        offsetX * scale,
        offsetY * scale,
        renderedW * scale,
        renderedH * scale
      );

      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onChange(finalDataUrl);
    } catch {
      onChange(adjustImageSrc);
    } finally {
      setIsAdjustOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black text-[#590231] tracking-wide uppercase">
          {label} <span className="text-[11px] font-normal text-gray-400 capitalize">(4:5 Portrait Frame)</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
          >
            Remove Photo
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 p-3.5 bg-gray-50/90 rounded-2xl border border-gray-200">
        {/* Photo Preview / Initials */}
        <div className="relative group shrink-0">
          {value ? (
            <div className="relative w-16 h-20 rounded-2xl overflow-hidden border-2 border-[#F9E33A] shadow-md bg-white">
              <img
                src={value}
                alt="Profile preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                title="Remove photo"
                className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition shadow-xs cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-20 rounded-2xl bg-[#590231] text-[#F9E33A] font-black text-xl flex flex-col items-center justify-center border border-rose-200/50 shadow-md">
              <span>{initials}</span>
              <span className="text-[8px] text-white/70 font-sans uppercase tracking-widest mt-0.5">Photo</span>
            </div>
          )}
        </div>

        {/* Upload & Adjust Controls */}
        <div className="flex-1 min-w-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {value ? (
                <>
                  <Camera className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>Change Photo</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>Upload Photo</span>
                </>
              )}
            </button>

            {value && (
              <button
                type="button"
                onClick={handleOpenAdjusterForExisting}
                className="px-3 py-1.5 rounded-xl bg-[#FFF2F8] hover:bg-[#FCE7F3] text-[#8A064D] border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Adjust framing, zoom, or position"
              >
                <Move className="w-3 h-3 text-[#8A064D]" />
                <span>Adjust Framing</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-gray-400 mt-1">
            JPG, PNG or WEBP up to {maxSizeMB} MB. Adjust and frame portrait to match profile exactly.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold px-1 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* INTERACTIVE FIXED OUTLOOK FRAME PHOTO ADJUSTER MODAL */}
      {/* ===================================================================== */}
      {isAdjustOpen && adjustImageSrc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-80 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in zoom-in-95">
            
            {/* Modal Top Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-base text-[#2D041A]">Adjust Student Portrait Framing</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Fixed 4:5 portrait frame matching student cards</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-[#8A064D] hover:text-[#590231] border border-rose-200 flex items-center justify-center transition shadow-2xs cursor-pointer"
                title="Cancel adjustment"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* PREVIEW FRAME MATCHING FIXED 4:5 PROFILE OUTLOOK (280x350 px) */}
            <div className="flex justify-center mb-4">
              <div
                className="relative w-[280px] h-[350px] rounded-3xl overflow-hidden bg-[#1A010F] border-2 border-[#F0D5E4] shadow-2xl select-none cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Photo Element */}
                <img
                  ref={imageElementRef}
                  src={adjustImageSrc}
                  alt="Student adjustment"
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setImgNaturalSize({
                      width: img.naturalWidth || 600,
                      height: img.naturalHeight || 800
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${offsetX}px`,
                    top: `${offsetY}px`,
                    width: `${renderedW}px`,
                    height: `${renderedH}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                />

                {/* Floating status pills preview at top corners */}
                <div className="absolute top-2.5 left-2.5 pointer-events-none z-20">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-xs">
                    Active Student
                  </span>
                </div>
                {rollNumber && (
                  <div className="absolute top-2.5 right-2.5 pointer-events-none z-20">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-[#FFF2F8] text-[#8A064D] border border-rose-200 shadow-2xs">
                      {rollNumber}
                    </span>
                  </div>
                )}

                {/* BOTTOM GRADIENT OVERLAY & NAME GUIDE PREVIEW */}
                <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 bg-gradient-to-t from-black via-black/85 to-transparent pt-20 pb-3.5 px-4 flex flex-col justify-end">
                  <div className="text-white font-serif font-black text-sm truncate leading-tight">
                    {studentName || 'Student Full Name'}
                  </div>
                  <div className="mt-1 flex items-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F9E33A] text-[#2D041A] font-black text-[9px] uppercase tracking-wider">
                      <Sparkles className="w-2.5 h-2.5 fill-[#2D041A]" />
                      <span>Academy Disciple</span>
                    </span>
                  </div>
                </div>

                {/* Subtle boundary guide */}
                <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-3xl" />
              </div>
            </div>

            {/* Adjustment Controls */}
            <div className="space-y-3 mb-5 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1 text-[#590231]">
                  <Move className="w-3.5 h-3.5" />
                  <span>Zoom &amp; Framing</span>
                </span>
                <span className="font-mono text-xs text-[#8A064D]">{zoom.toFixed(2)}x</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.15).toFixed(2)))}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#8A064D]"
                />

                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.15).toFixed(2)))}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                <span>Drag photo to center face</span>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="hover:text-[#8A064D] flex items-center gap-1 cursor-pointer font-bold transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyAdjustment}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 text-[#F9E33A]" />
                <span>Apply &amp; Save Framing</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
