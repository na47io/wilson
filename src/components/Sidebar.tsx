'use client';

import { useState, useEffect } from 'react';

interface AnalysisRecord {
  id: number;
  filename: string;
  created_at: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (id: number) => void;
}

export function Sidebar({ isOpen, onClose, onSelectDocument }: SidebarProps) {
  const [documents, setDocuments] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    async function fetchDocuments() {
      const response = await fetch('/api/analyses');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    }

    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-200 ease-in-out z-50">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Saved Documents</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Close sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-500"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 space-y-2">
        {documents.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents saved yet</p>
        ) : (
          documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 group"
            >
              <div className="font-medium text-gray-900 truncate">{doc.filename}</div>
              <div className="text-sm text-gray-500">
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
