'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface SelectedBatch {
  id: string;
  name: string;
  courseTitle: string;
  trainerName?: string;
  monthlyFee?: string | number;
  days?: any;
  room?: string;
}

interface EnquiryContextType {
  selectedBatches: SelectedBatch[];
  toggleBatchSelection: (batch: SelectedBatch) => void;
  removeBatch: (batchId: string) => void;
  clearBatches: () => void;
  isBatchSelected: (batchId: string) => boolean;
  isModalOpen: boolean;
  openEnquiryModal: () => void;
  closeEnquiryModal: () => void;
}

const EnquiryContext = createContext<EnquiryContextType | null>(null);

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [selectedBatches, setSelectedBatches] = useState<SelectedBatch[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load from session storage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('laasya_selected_batches');
      if (saved) {
        setSelectedBatches(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // Save to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('laasya_selected_batches', JSON.stringify(selectedBatches));
    } catch (_) {}
  }, [selectedBatches]);

  const toggleBatchSelection = (batch: SelectedBatch) => {
    setSelectedBatches((prev) => {
      const exists = prev.some((b) => b.id === batch.id);
      if (exists) {
        return prev.filter((b) => b.id !== batch.id);
      } else {
        return [...prev, batch];
      }
    });
  };

  const removeBatch = (batchId: string) => {
    setSelectedBatches((prev) => prev.filter((b) => b.id !== batchId));
  };

  const clearBatches = () => {
    setSelectedBatches([]);
  };

  const isBatchSelected = (batchId: string) => {
    return selectedBatches.some((b) => b.id === batchId);
  };

  return (
    <EnquiryContext.Provider
      value={{
        selectedBatches,
        toggleBatchSelection,
        removeBatch,
        clearBatches,
        isBatchSelected,
        isModalOpen,
        openEnquiryModal: () => setIsModalOpen(true),
        closeEnquiryModal: () => setIsModalOpen(false),
      }}
    >
      {children}
    </EnquiryContext.Provider>
  );
}

export function useEnquiry() {
  const ctx = useContext(EnquiryContext);
  if (!ctx) {
    throw new Error('useEnquiry must be used within an EnquiryProvider');
  }
  return ctx;
}
