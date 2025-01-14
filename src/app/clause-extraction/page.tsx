'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ClauseGroup } from '@/components/ClauseCard';
import { Sidebar } from '@/components/Sidebar';

import { AnalysisResult } from '@/lib/models';

export default function ClauseExtraction() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefinitionsExpanded, setIsDefinitionsExpanded] = useState(true);
  const [isClausesExpanded, setIsClausesExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setAnalysis(null);
    setStatus('Uploading PDF...');

    try {
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);
      formData.append('model', 'openai');

      // Set up SSE connection for status updates first
      const eventSource = new EventSource('/api/extract-clauses/status');

      eventSource.onmessage = (event) => {
        setStatus(event.data);
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      // Then start the extraction process
      const response = await fetch('/api/extract-clauses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        eventSource.close();
        throw new Error('Failed to process PDF');
      }

      const data = await response.json();
      eventSource.close();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
      setStatus('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const loadSavedAnalysis = async (id: number) => {
    try {
      const response = await fetch(`/api/extract-clauses/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-4xl relative flex-grow">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectDocument={loadSavedAnalysis}
        />
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Open saved documents"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-600"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold">Contract Clause Extraction</h1>
          </div>
        </div>

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

        {isProcessing && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">{status || 'Processing...'}</p>
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
          <div className="mt-8 space-y-12">
            {analysis.metadata && (
              <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">Document Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.metadata.title && (
                    <div>
                      <span className="font-medium text-gray-600">Title:</span>
                      <p className="text-gray-800">{analysis.metadata.title}</p>
                    </div>
                  )}
                  {analysis.metadata.author && (
                    <div>
                      <span className="font-medium text-gray-600">Author:</span>
                      <p className="text-gray-800">{analysis.metadata.author}</p>
                    </div>
                  )}
                  {analysis.metadata.subject && (
                    <div>
                      <span className="font-medium text-gray-600">Subject:</span>
                      <p className="text-gray-800">{analysis.metadata.subject}</p>
                    </div>
                  )}
                  {analysis.metadata.creationDate && (
                    <div>
                      <span className="font-medium text-gray-600">Created:</span>
                      <p className="text-gray-800">
                        {new Date(analysis.metadata.creationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {analysis.metadata.modificationDate && (
                    <div>
                      <span className="font-medium text-gray-600">Modified:</span>
                      <p className="text-gray-800">
                        {new Date(analysis.metadata.modificationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {analysis.definitions && analysis.definitions.length > 0 && (
              <section className="rounded-lg p-6 bg-white grid gap-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setIsDefinitionsExpanded(!isDefinitionsExpanded)}
                >
                  <div className="flex items-center space-x-2">
                    <h2 className="text-2xl font-bold text-gray-900">Definitions</h2>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                      {analysis.definitions.length} {analysis.definitions.length === 1 ? 'term' : 'terms'}
                    </span>
                  </div>
                  <button
                    className={`p-2 rounded-full transition-transform duration-200 ${isDefinitionsExpanded ? 'rotate-180' : ''}`}
                    aria-label={isDefinitionsExpanded ? 'Collapse' : 'Expand'}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-gray-400"
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {isDefinitionsExpanded && (
                  <div className="grid gap-4">
                    {analysis.definitions.map((def, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{def.term}</h3>
                        <p className="text-gray-600 mb-4">{def.definition}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="mr-2"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          <span>{def.citation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
            <section className="rounded-lg p-6 bg-white grid gap-4">
              <div
                className="flex items-center justify-between cursor-pointer mb-8"
                onClick={() => setIsClausesExpanded(!isClausesExpanded)}
              >
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-gray-900">Contract Clauses</h2>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                    {analysis.clauses.length} {analysis.clauses.length === 1 ? 'clause' : 'clauses'}
                  </span>
                </div>
                <button
                  className={`p-2 rounded-full transition-transform duration-200 ${isClausesExpanded ? 'rotate-180' : ''}`}
                  aria-label={isClausesExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-400"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {isClausesExpanded && (
                <ClauseGroup
                  clauses={analysis.clauses}
                />
              )}
            </section>
          </div>
        )}
      </div>
      <footer className="w-full py-4 px-4 border-t bg-white mt-auto">
        <div className="container flex justify-center">
          <a
            href="https://github.com/na47io/wilson"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 flex items-center space-x-2"
          >
            <svg
              height="20"
              width="20"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="text-gray-600"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>source code</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
