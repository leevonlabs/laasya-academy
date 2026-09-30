'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, X, AlertCircle, ZoomIn, ZoomOut, Move, RotateCcw, Check } from 'lucide-react';

interface PhotoUploadInputProps {
  value?: string | null;
  onChange: (photoDataUrl: string | null) => void;
  label?: string;
  initials?: string;
  maxSizeMB?: number;
}

export default function PhotoUploadInput({
  value,
  onChange,
  label = 'Profile Photo',
  initials = 'LA',
  maxSizeMB = 1
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

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (1 MB limit)
    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`Image size (${sizeMB} MB) exceeds the ${maxSizeMB} MB limit. Please select an image under ${maxSizeMB} MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate mime type
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

      // Open adjuster modal directly so user can frame the image perfectly
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

  // Save the adjusted crop onto canvas (400x400)
  const handleApplyAdjustment = () => {
    if (!adjustImageSrc || !imageElementRef.current) {
      setIsAdjustOpen(false);
      return;
    }

    try {
      const img = imageElementRef.current;
      const canvas = document.createElement('canvas');
      const targetSize = 400;
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        onChange(adjustImageSrc);
        setIsAdjustOpen(false);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // The preview container box is 260x260 px
      const containerSize = 260;
      const scaleFactor = targetSize / containerSize;

      // Base scaling to fit image inside container
      const baseScale = Math.max(containerSize / img.naturalWidth, containerSize / img.naturalHeight);
      const renderedWidth = img.naturalWidth * baseScale * zoom;
      const renderedHeight = img.naturalHeight * baseScale * zoom;

      const centerOffsetX = (containerSize - renderedWidth) / 2 + pan.x;
      const centerOffsetY = (containerSize - renderedHeight) / 2 + pan.y;

      ctx.drawImage(
        img,
        centerOffsetX * scaleFactor,
        centerOffsetY * scaleFactor,
        renderedWidth * scaleFactor,
        renderedHeight * scaleFactor
      );

      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onChange(finalDataUrl);
    } catch {
      onChange(adjustImageSrc);
    } finally {
      setIsAdjustOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-black text-[#590231] tracking-wide uppercase">
        {label} <span className="text-[11px] font-normal text-gray-400 capitalize">(Max {maxSizeMB} MB)</span>
      </label>

      <div className="flex items-center gap-4 p-3.5 bg-gray-50/90 rounded-2xl border border-gray-200">
        {/* Photo Preview / Initials */}
        <div className="relative group shrink-0">
          {value ? (
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#F9E33A] shadow-md bg-white">
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
            <div className="w-16 h-16 rounded-2xl bg-[#590231] text-[#F9E33A] font-black text-lg flex items-center justify-center border border-rose-200/50 shadow-md">
              {initials}
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
              <>
                <button
                  type="button"
                  onClick={handleOpenAdjusterForExisting}
                  className="px-3 py-1.5 rounded-xl bg-[#FFF2F8] hover:bg-[#FCE7F3] text-[#8A064D] border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Adjust framing, zoom, or position"
                >
                  <Move className="w-3 h-3 text-[#8A064D]" />
                  <span>Adjust Position</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                >
                  Remove
                </button>
              </>
            )}
          </div>

          <p className="text-[11px] text-gray-400 mt-1">
            JPG, PNG or WEBP up to {maxSizeMB} MB. You can pan and zoom to fit.
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
      {/* INTERACTIVE PHOTO ADJUSTER MODAL */}
      {/* ===================================================================== */}
      {isAdjustOpen && adjustImageSrc && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-70 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in zoom-in-95">
            
            {/* Modal Top Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-base text-[#2D041A]">Adjust Profile Photo</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Drag to reposition • Use slider to zoom</p>
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

            {/* Viewport Frame (260x260 px) */}
            <div className="flex justify-center mb-4">
              <div
                className="relative w-[260px] h-[260px] rounded-3xl overflow-hidden bg-[#1A010F] border-4 border-[#F9E33A] shadow-xl select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
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

                {/* Framing Center Reticle Guide */}
                <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-2xl">
                  <div className="absolute inset-0 border border-dashed border-[#F9E33A]/40 rounded-full m-3" />
                </div>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="space-y-3 mb-5 bg-gray-50 p-3 rounded-2xl border border-gray-200">
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
                  onClick={() => setZoom(prev => Math.max(1, +(prev - 0.15).toFixed(2)))}
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
                  onClick={() => setZoom(prev => Math.min(3, +(prev + 0.15).toFixed(2)))}
                  className="p-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="text-[11px] font-semibold text-gray-500 hover:text-[#8A064D] flex items-center gap-1 cursor-pointer transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Position</span>
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
                <span>Apply & Save Photo</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
