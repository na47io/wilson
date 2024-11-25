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
    <div 
      className="border rounded-lg p-4 mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <h3 className="text-lg font-semibold mb-2">{clause.type}</h3>
      <p className="text-gray-600 mb-2">{clause.summary}</p>
      
      {isExpanded && (
        <div className="mt-4 border-t pt-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="font-mono text-sm whitespace-pre-wrap">{clause.text}</p>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Citation: {clause.citation}
          </p>
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
      {Object.entries(groupedClauses).map(([type, clauses]) => (
        <div key={type} className="mb-8">
          <h2 className="text-xl font-bold mb-4">{type}</h2>
          {clauses.map((clause, index) => (
            <ClauseCard key={index} clause={clause} />
          ))}
        </div>
      ))}
      
      {missingTypes.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">Missing Clause Types:</h2>
          <ul className="list-disc list-inside">
            {missingTypes.map((type) => (
              <li key={type} className="text-gray-600">{type}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
