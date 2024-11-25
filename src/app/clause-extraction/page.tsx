'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ClauseGroup } from '@/components/ClauseCard';

interface Clause {
  type: string;
  summary: string;
  text: string;
  citation: string;
}

interface AnalysisResult {
  clauses: Clause[];
  missingTypes: string[];
}

export default function ClauseExtraction() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);

      const response = await fetch('/api/extract-clauses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process PDF');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Contract Clause Extraction</h1>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        <p className="text-lg text-gray-600">
          {isDragActive
            ? 'Drop the PDF here...'
            : 'Drag and drop a PDF contract, or click to select'}
        </p>
      </div>

      {loading && (
        <div className="mt-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Analyzing contract...</p>
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {analysis && (
        <div className="mt-8">
          <ClauseGroup
            clauses={analysis.clauses}
            missingTypes={analysis.missingTypes}
          />
        </div>
      )}
    </div>
  );
}
