import { useState } from 'react';

interface Clause {
  type: string;
  summary: string;
  text: string;
  citation: string;
}

interface ClauseCardProps {
  clause: Clause;
}

export function ClauseCard({ clause }: ClauseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-6 mb-4 hover:shadow-lg transition-all duration-200 bg-white">
      <div
        className="flex justify-between items-start cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{clause.type}</h3>
          <p className="text-gray-600 leading-relaxed">{clause.summary}</p>
        </div>
        <button
          className={`p-2 rounded-full transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
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

      {isExpanded && (
        <div className="mt-6 border-t border-gray-100 pt-6 space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Original Text</h4>
            <p className="font-mono text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">
              {clause.text}
            </p>
          </div>
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
            <span>{clause.citation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ClauseGroupProps {
  clauses: Clause[];
  missingTypes: string[];
}

export function ClauseGroup({ clauses, missingTypes }: ClauseGroupProps) {
  // Group clauses by type
  const groupedClauses = clauses.reduce((acc, clause) => {
    const type = clause.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(clause);
    return acc;
  }, {} as Record<string, Clause[]>);

  return (
    <div>
      <div className="grid gap-8">
        {Object.entries(groupedClauses).map(([type, clauses]) => (
          <section key={type} className="space-y-4">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-gray-900">{type}</h2>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                {clauses.length} {clauses.length === 1 ? 'clause' : 'clauses'}
              </span>
            </div>
            <div className="space-y-4">
              {clauses.map((clause, index) => (
                <ClauseCard key={index} clause={clause} />
              ))}
            </div>
          </section>
        ))}

        {missingTypes.length > 0 && (
          <section className="mt-8">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-amber-500"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h2 className="text-lg font-semibold text-amber-800">Missing Clause Types</h2>
              </div>
              <ul className="space-y-2">
                {missingTypes.map((type) => (
                  <li key={type} className="flex items-center text-amber-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mr-2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {type}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
