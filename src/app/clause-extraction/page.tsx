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

interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creationDate?: string;
  modificationDate?: string;
  creator?: string;
  producer?: string;
}

interface Definition {
  term: string;
  definition: string;
  citation: string;
}

interface AnalysisResult {
  clauses: Clause[];
  definitions: Definition[];
  metadata: PdfMetadata;
}

export default function ClauseExtraction() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'anthropic' | 'openai'>('anthropic');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setAnalysis(null);
    setStatus('Uploading PDF...');

    try {
      const formData = new FormData();
      formData.append('file', acceptedFiles[0]);
      formData.append('model', selectedModel);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Contract Clause Extraction</h1>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as 'anthropic' | 'openai')}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="anthropic">Claude (Anthropic)</option>
          <option value="openai">GPT-4 Vision (OpenAI)</option>
        </select>
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
          {analysis.definitions && analysis.definitions.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Definitions</h2>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                  {analysis.definitions.length} {analysis.definitions.length === 1 ? 'term' : 'terms'}
                </span>
              </div>
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
            </section>
          )}
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
          <ClauseGroup
            clauses={analysis.clauses}
          />
        </div>
      )}
    </div>
  );
}
