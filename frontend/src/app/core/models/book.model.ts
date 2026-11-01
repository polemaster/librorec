export interface Book {
  slug: string;
  title: string;
  releaseDate: string | null;
  coverImgUrl: string | null;
  authors: string[];
  genres: string[];
  moods: string[];
  tags: string[];
}
