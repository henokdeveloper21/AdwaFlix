import { Metadata } from 'next';
import { tmdbService } from '@/api/tmdb';
import { TVDetailClient } from '@/components/TVDetailClient';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const show = await tmdbService.getTVShowDetails(parseInt(params.id));
    const title = `${show.name} – AdwaFlix`;
    const description = show.overview || '';
    const poster = tmdbService.getImageUrl(show.poster_path, 'w500');

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [poster],
        type: 'video.tv_show',
        url: `https://adwastream.xyz/tv/${params.id}`,
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
      title: 'TV Show – AdwaFlix',
      description: 'Watch TV shows for free on AdwaFlix.',
    };
  }
}

export default async function TVPage({ params }: Props) {
  let showData = null;
  try {
    showData = await tmdbService.getTVShowDetails(parseInt(params.id));
  } catch {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400">Failed to load TV show data.</p>
      </div>
    );
  }

  return <TVDetailClient showData={showData} showId={parseInt(params.id)} />;
}