'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, X, AlertCircle, ZoomIn, ZoomOut, Move, RotateCcw, Check, Sliders, Image as ImageIcon } from 'lucide-react';

interface CourseImageUploadInputProps {
  value?: string | null;
  onChange: (photoDataUrl: string | null) => void;
  label?: string;
  maxSizeMB?: number;
}

export default function CourseImageUploadInput({
  value,
  onChange,
  label = 'Course Cover Image',
  maxSizeMB = 5
}: CourseImageUploadInputProps) {
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

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`Image size (${sizeMB} MB) exceeds the ${maxSizeMB} MB limit. Please select an image under ${maxSizeMB} MB.`);
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

  // Save the adjusted crop onto 16:9 canvas (800x450)
  const handleApplyAdjustment = () => {
    if (!adjustImageSrc || !imageElementRef.current) {
      setIsAdjustOpen(false);
      return;
    }

    try {
      const img = imageElementRef.current;
      const canvas = document.createElement('canvas');
      const targetW = 800;
      const targetH = 450;
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        onChange(adjustImageSrc);
        setIsAdjustOpen(false);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // The preview container box is 360x202 px (approx 16:9)
      const containerW = 360;
      const containerH = 202;
      const scaleFactorW = targetW / containerW;
      const scaleFactorH = targetH / containerH;

      const baseScale = Math.max(containerW / img.naturalWidth, containerH / img.naturalHeight);
      const renderedWidth = img.naturalWidth * baseScale * zoom;
      const renderedHeight = img.naturalHeight * baseScale * zoom;

      const centerOffsetX = (containerW - renderedWidth) / 2 + pan.x;
      const centerOffsetY = (containerH - renderedHeight) / 2 + pan.y;

      ctx.drawImage(
        img,
        centerOffsetX * scaleFactorW,
        centerOffsetY * scaleFactorH,
        renderedWidth * scaleFactorW,
        renderedHeight * scaleFactorH
      );

      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.88);
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
        <label className="text-xs font-black text-[#590231] tracking-wide uppercase flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#8A064D]" />
          <span>{label}</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
          >
            Clear Image
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {value ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-[#F0D5E4] bg-gray-900 group shadow-sm">
          {/* 16:9 ratio container */}
          <div className="w-full h-44 relative overflow-hidden bg-black/40">
            <img
              src={value}
              alt="Course Cover Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';
              }}
            />
            {/* Gradient Scrim & Badges */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 flex items-end justify-between">
              <span className="text-[10px] font-bold text-white bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20">
                16:9 Banner Framed
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenAdjusterForExisting}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-gray-100 text-[#8A064D] text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                >
                  <Sliders className="w-3 h-3 text-[#8A064D]" />
                  <span>Adjust</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                >
                  <Upload className="w-3 h-3 text-[#F9E33A]" />
                  <span>Replace</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#F0D5E4] hover:border-[#8A064D] bg-[#FFF9FB] hover:bg-[#FFF2F8] rounded-2xl cursor-pointer transition group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-rose-200 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
            <Upload className="w-6 h-6 text-[#8A064D]" />
          </div>
          <span className="text-xs font-bold text-[#2D041A]">Upload Course Cover Image</span>
          <span className="text-[11px] text-gray-500 mt-0.5">Device file upload • JPG, PNG, WEBP up to {maxSizeMB} MB</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold px-1 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 16:9 INTERACTIVE IMAGE ADJUSTER MODAL */}
      {/* ===================================================================== */}
      {isAdjustOpen && adjustImageSrc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-70 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-base text-[#2D041A] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#8A064D]" />
                  <span>Adjust Course Framing</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Drag photo to position • Use slider to zoom</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-[#8A064D] hover:text-[#590231] border border-rose-200 flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* 16:9 Viewport (360x202 px) */}
            <div className="flex justify-center mb-4">
              <div
                className="relative w-[360px] h-[202px] rounded-2xl overflow-hidden bg-[#1A010F] border-3 border-[#8A064D] shadow-xl select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  ref={imageElementRef}
                  src={adjustImageSrc}
                  alt="Crop adjustment"
                  draggable={false}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    maxWidth: 'none',
                    maxHeight: 'none',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  className="pointer-events-none"
                />

                {/* 16:9 Framing Guidelines */}
                <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-xl">
                  <div className="absolute inset-0 border border-dashed border-[#F9E33A]/50 m-2 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Adjustment Controls */}
            <div className="space-y-3 mb-5 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span className="flex items-center gap-1 text-[#590231]">
                  <Move className="w-3.5 h-3.5" />
                  <span>Zoom Level</span>
                </span>
                <span className="font-mono text-xs text-[#8A064D]">{zoom.toFixed(2)}x</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.15).toFixed(2)))}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs"
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
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Framing Presets */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-500">Framing:</span>
                  <button
                    type="button"
                    onClick={() => setPan({ x: 0, y: 35 })}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-gray-100 border border-gray-200 font-semibold text-gray-700"
                  >
                    Top
                  </button>
                  <button
                    type="button"
                    onClick={() => setPan({ x: 0, y: 0 })}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-gray-100 border border-gray-200 font-semibold text-gray-700"
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setPan({ x: 0, y: -35 })}
                    className="px-2 py-0.5 rounded-md bg-white hover:bg-gray-100 border border-gray-200 font-semibold text-gray-700"
                  >
                    Bottom
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="font-semibold text-gray-500 hover:text-[#8A064D] flex items-center gap-1 cursor-pointer transition"
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 text-[#F9E33A]" />
                <span>Apply & Save Framing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
