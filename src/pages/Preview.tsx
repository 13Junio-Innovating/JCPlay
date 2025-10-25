import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { toast } from "sonner";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  duration: number;
}

interface PlaylistItem {
  mediaId: string;
  duration: number;
}

interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
}

const Preview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  useEffect(() => {
    if (!isPlaying || !playlist || playlist.items.length === 0) return;

    const currentItem = playlist.items[currentIndex];
    const duration = currentItem.duration * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.items.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, playlist]);

  const fetchPlaylist = async () => {
    try {
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", id)
        .single();

      if (playlistError) throw playlistError;

      const items = playlistData.items as unknown as PlaylistItem[];
      const mediaIds = items.map((item) => item.mediaId);
      const { data: mediaData, error: mediaError } = await supabase
        .from("media")
        .select("*")
        .in("id", mediaIds);

      if (mediaError) throw mediaError;

      setPlaylist({ ...playlistData, items });
      setMediaFiles(mediaData || []);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      toast.error("Erro ao carregar playlist");
      navigate("/playlists");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMedia = () => {
    if (!playlist || playlist.items.length === 0) return null;
    const currentItem = playlist.items[currentIndex];
    return mediaFiles.find((m) => m.id === currentItem.mediaId);
  };

  const currentMedia = getCurrentMedia();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando preview...</p>
        </div>
      </div>
    );
  }

  if (!playlist || !currentMedia) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Playlist não encontrada ou vazia</p>
          <Button onClick={() => navigate("/playlists")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/playlists")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold">{playlist.name}</h1>
            <p className="text-sm text-white/80">
              {currentIndex + 1} de {playlist.items.length}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Media Display */}
      <div className="w-full h-screen flex items-center justify-center bg-black">
        {currentMedia.type === "image" ? (
          <img
            key={currentMedia.id}
            src={currentMedia.url}
            alt={currentMedia.name}
            className="max-w-full max-h-full object-contain animate-in fade-in duration-500"
          />
        ) : isYouTubeUrl(currentMedia.url) && getYouTubeEmbedUrl(currentMedia.url) ? (
          <iframe
            key={currentMedia.id}
            src={getYouTubeEmbedUrl(currentMedia.url) || ''}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
            frameBorder="0"
          />
        ) : (
          <video
            key={currentMedia.id}
            src={currentMedia.url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            loop
          />
        )}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center gap-2 mb-2">
          {playlist.items.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full transition-colors ${
                index === currentIndex
                  ? "bg-primary"
                  : index < currentIndex
                  ? "bg-primary/50"
                  : "bg-white/30"
              }`}
            />
          ))}
        </div>
        <p className="text-white text-center text-sm">{currentMedia.name}</p>
      </div>
    </div>
  );
};

export default Preview;

// Helpers para suporte a YouTube
const isYouTubeUrl = (url: string) =>
  /(?:youtube\.com|youtu\.be)/.test(url) || /vid:[A-Za-z0-9_-]+/.test(url);

const extractYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1).split('?')[0] || null;
    }
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/')[2] || null;
      }
      const v = u.searchParams.get('v');
      if (v) return v;
    }
  } catch {}
  const match = url.match(/vid:([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&iv_load_policy=3&rel=0&modestbranding=1`;
};
