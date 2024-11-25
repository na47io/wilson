export interface Clause {
  type: string;
  summary: string;
  text: string;
  citation: string;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface Definition {
  term: string;
  definition: string;
  citation: string;
}

export interface AnalysisResult {
  clauses: Clause[];
  definitions: Definition[];
  metadata: PdfMetadata;
}
