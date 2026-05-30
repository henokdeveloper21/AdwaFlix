import axios, { AxiosInstance } from 'axios';
import {
  Movie,
  TVShow,
  MediaDetail,
  PaginatedResponse,
  SearchResult,
  Video,
  Genre,
} from '@/types/tmdb';

// ─── Additional response types ─────────────────────────────
interface Credits {
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    profile_path: string | null;
  }[];
}

interface VideosResponse {
  id: number;
  results: Video[];
}

class TMDBService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
    this.baseURL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || '';

    this.client = axios.create({
      baseURL: this.baseURL,
      params: {
        api_key: this.apiKey,
      },
      timeout: 15000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('TMDB API Error:', error?.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ── Trending ──────────────────────────────────────────────
  async getTrending(
    mediaType: 'all' | 'movie' | 'tv' = 'all',
    timeWindow: 'day' | 'week' = 'week',
    page = 1
  ) {
    const response = await this.client.get<PaginatedResponse<Movie | TVShow>>(
      `/trending/${mediaType}/${timeWindow}`,
      { params: { page } }
    );
    return response.data;
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1) {
    const response = await this.client.get<PaginatedResponse<Movie>>(
      `/trending/movie/${timeWindow}`,
      { params: { page } }
    );
    return response.data;
  }

  async getTrendingTVShows(timeWindow: 'day' | 'week' = 'week', page = 1) {
    const response = await this.client.get<PaginatedResponse<TVShow>>(
      `/trending/tv/${timeWindow}`,
      { params: { page } }
    );
    return response.data;
  }

  // ── Movies ────────────────────────────────────────────────
  async getPopularMovies(page = 1) {
    const response = await this.client.get<PaginatedResponse<Movie>>(
      '/movie/popular',
      { params: { page } }
    );
    return response.data;
  }

  async getTopRatedMovies(page = 1) {
    const response = await this.client.get<PaginatedResponse<Movie>>(
      '/movie/top_rated',
      { params: { page } }
    );
    return response.data;
  }

  async getUpcomingMovies(page = 1) {
    const response = await this.client.get<PaginatedResponse<Movie>>(
      '/movie/upcoming',
      { params: { page } }
    );
    return response.data;
  }

  async getNowPlayingMovies(page = 1) {
    const response = await this.client.get<PaginatedResponse<Movie>>(
      '/movie/now_playing',
      { params: { page } }
    );
    return response.data;
  }

  async getMovieDetails(id: number) {
    const response = await this.client.get<MediaDetail>(`/movie/${id}`, {
      params: {
        append_to_response: 'videos,credits,similar,recommendations',
      },
    });
    return response.data;
  }

  // ── TV Shows ─────────────────────────────────────────────
  async getPopularTVShows(page = 1) {
    const response = await this.client.get<PaginatedResponse<TVShow>>(
      '/tv/popular',
      { params: { page } }
    );
    return response.data;
  }

  async getTopRatedTVShows(page = 1) {
    const response = await this.client.get<PaginatedResponse<TVShow>>(
      '/tv/top_rated',
      { params: { page } }
    );
    return response.data;
  }

  async getOnTheAirTVShows(page = 1) {
    const response = await this.client.get<PaginatedResponse<TVShow>>(
      '/tv/on_the_air',
      { params: { page } }
    );
    return response.data;
  }

  async getTVShowDetails(id: number) {
    const response = await this.client.get<MediaDetail>(`/tv/${id}`, {
      params: {
        append_to_response: 'videos,credits,similar,recommendations',
      },
    });
    return response.data;
  }

  // ── Detailed sub‑resources ────────────────────────────────
  async getVideos(mediaType: 'movie' | 'tv', id: number) {
    const response = await this.client.get<VideosResponse>(
      `/${mediaType}/${id}/videos`
    );
    return response.data;
  }

  async getCredits(mediaType: 'movie' | 'tv', id: number) {
    const response = await this.client.get<Credits>(
      `/${mediaType}/${id}/credits`
    );
    return response.data;
  }

  async getSimilar(mediaType: 'movie' | 'tv', id: number, page = 1) {
    const response = await this.client.get<PaginatedResponse<Movie | TVShow>>(
      `/${mediaType}/${id}/similar`,
      { params: { page } }
    );
    return response.data;
  }

  async getRecommendations(mediaType: 'movie' | 'tv', id: number, page = 1) {
    const response = await this.client.get<PaginatedResponse<Movie | TVShow>>(
      `/${mediaType}/${id}/recommendations`,
      { params: { page } }
    );
    return response.data;
  }

  // ── Search ────────────────────────────────────────────────
  async searchMulti(query: string, page = 1) {
    const response = await this.client.get<PaginatedResponse<SearchResult>>(
      '/search/multi',
      { params: { query, page } }
    );
    return response.data;
  }

  async searchMovies(query: string, page = 1) {
    const response = await this.client.get<PaginatedResponse<Movie>>(
      '/search/movie',
      { params: { query, page } }
    );
    return response.data;
  }

  async searchTVShows(query: string, page = 1) {
    const response = await this.client.get<PaginatedResponse<TVShow>>(
      '/search/tv',
      { params: { query, page } }
    );
    return response.data;
  }

  // ── Discover ──────────────────────────────────────────────
  async discoverMovies(params: Record<string, string | number | boolean> = {}) {
    const response = await this.client.get<PaginatedResponse<Movie>>(
      '/discover/movie',
      { params }
    );
    return response.data;
  }

  async discoverTVShows(params: Record<string, string | number | boolean> = {}) {
    const response = await this.client.get<PaginatedResponse<TVShow>>(
      '/discover/tv',
      { params }
    );
    return response.data;
  }

  // ── Genres ────────────────────────────────────────────────
  async getMovieGenres() {
    const response = await this.client.get<{ genres: Genre[] }>(
      '/genre/movie/list'
    );
    return response.data.genres;
  }

  async getTVGenres() {
    const response = await this.client.get<{ genres: Genre[] }>(
      '/genre/tv/list'
    );
    return response.data.genres;
  }

  // ── Image URL Helpers (return empty string if no path) ───
  getImageUrl(
    path: string,
    size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
  ) {
    if (!path) return '';
    return `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  getBackdropUrl(
    path: string,
    size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'
  ) {
    if (!path) return '';
    return `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  getProfileUrl(
    path: string,
    size: 'w45' | 'w185' | 'h632' | 'original' = 'w185'
  ) {
    if (!path) return '';
    return `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  // ── Trailer URL builder ───────────────────────────────────
  getTrailerUrl(key: string) {
    return `https://www.youtube.com/embed/${key}?autoplay=0&rel=0&modestbranding=1`;
  }
}

export const tmdbService = new TMDBService();