import { Metadata } from 'next';
import { tmdbService } from '@/api/tmdb';
import { MovieDetailClient } from '@/components/MovieDetailClient';

interface Props {
  params: { id: string };
}

// Dynamic SEO metadata – this runs on the server
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const movie = await tmdbService.getMovieDetails(parseInt(params.id));
    const title = `${movie.title} – AdwaFlix`;
    const description = movie.overview || '';
    const poster = tmdbService.getImageUrl(movie.poster_path, 'w500');

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [poster],
        type: 'video.movie',
        url: `https://adwastream.xyz/movies/${params.id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [poster],
      },
    };
  } catch {
    return {
      title: 'Movie – AdwaFlix',
      description: 'Watch movies for free on AdwaFlix.',
    };
  }
}

export default async function MoviePage({ params }: Props) {
  let movieData = null;
  try {
    movieData = await tmdbService.getMovieDetails(parseInt(params.id));
  } catch {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400">Failed to load movie data.</p>
      </div>
    );
  }

  return <MovieDetailClient movieData={movieData} movieId={parseInt(params.id)} />;
}