export type RecommendationMethod = 'GEMINI' | 'OPENROUTER';

export interface RecommendationMethodOption {
  value: RecommendationMethod;
  label: string;
  description?: string;
}

export const RECOMMENDATION_METHODS: RecommendationMethodOption[] = [
  { value: 'GEMINI', label: 'Gemini', description: 'Google Gemini AI model' },
  { value: 'OPENROUTER', label: 'OpenRouter', description: 'OpenRouter LLM gateway' },
];

export type BookSearchApi = 'HARDCOVER' | 'OPENLIBRARY';

export interface BookSearchApiOption {
  value: BookSearchApi;
  label: string;
  description?: string;
}

export const BOOK_SEARCH_APIS: BookSearchApiOption[] = [
  { value: 'HARDCOVER', label: 'Hardcover', description: 'Rich metadata & book descriptions' },
  { value: 'OPENLIBRARY', label: 'OpenLibrary', description: 'Open community book catalog' },
];

export interface Book {
  id: string;
  title: string;
  releaseDate: string | null;
  coverImgUrl: string | null;
  seriesName?: string | null;
  authors: string[];
  genres: string[];
  moods: string[];
  tags: string[];
}

export interface BookRequest {
  id: string;
  title: string;
  releaseDate: string | null;
  authors: string[];
  genres: string[];
  moods: string[];
  tags: string[];
}

export interface RecommendationResponse {
  id: string;
  title: string;
  releaseDate: string | null;
  coverImgUrl: string | null;
  seriesName: string | null;
  description: string | null;
  authors: string[];
  genres: string[];
}
