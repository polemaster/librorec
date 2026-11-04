export type RecommendationMethod = 'GEMINI' | 'OPENROUTER';

export interface RecommendationMethodOption {
  value: RecommendationMethod;
  label: string;
}

export const RECOMMENDATION_METHODS: RecommendationMethodOption[] = [
  { value: 'GEMINI', label: 'Gemini' },
  { value: 'OPENROUTER', label: 'OpenRouter' },
];

export interface Book {
  slug: string;
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
  slug: string;
  title: string;
  releaseDate: string | null;
  authors: string[];
  genres: string[];
  moods: string[];
  tags: string[];
}

export interface RecommendationResponse {
  slug: string;
  title: string;
  releaseDate: string | null;
  coverImgUrl: string | null;
  seriesName: string | null;
  description: string | null;
  authors: string[];
  genres: string[];
}

