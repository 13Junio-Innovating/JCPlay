import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, Film, Image as ImageIcon, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  description?: string;
  items: PlaylistItem[];
  created_at: string;
}

interface PlaylistListProps {
  playlist: Playlist;
  mediaFiles: MediaFile[];
  onDelete: (id: string) => void;
}

const PlaylistList = ({ playlist, mediaFiles, onDelete }: PlaylistListProps) => {
  const getMediaById = (id: string) => mediaFiles.find((m) => m.id === id);

  const totalDuration = (playlist.items || []).reduce(
    (acc, item) => acc + (item.duration || 0),
    0
  );

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-xl hover:shadow-glow transition-all flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold truncate" title={playlist.name}>
              {playlist.name}
            </CardTitle>
            {playlist.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {playlist.description}
              </p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/20">
            {playlist.items?.length || 0} itens
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock className="h-4 w-4" />
          <span>Duração total: {formatDuration(totalDuration)}</span>
        </div>

        <ScrollArea className="h-[120px] rounded-md border border-border/50 bg-secondary/20 p-2">
          <div className="space-y-2">
            {(playlist.items || []).map((item, index) => {
              const media = getMediaById(item.mediaId);
              return (
                <div key={`${item.mediaId}-${index}`} className="flex items-center gap-2 text-sm p-1 rounded hover:bg-white/5">
                  <div className="shrink-0">
                    {media?.type === 'video' ? (
                      <Film className="h-3 w-3 text-blue-400" />
                    ) : (
                      <ImageIcon className="h-3 w-3 text-purple-400" />
                    )}
                  </div>
                  <span className="truncate flex-1" title={media?.name || "Mídia desconhecida"}>
                    {media?.name || "Mídia removida"}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {item.duration}s
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="pt-0 flex justify-between gap-2">
        <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground w-full justify-start"
            // Placeholder for preview functionality if needed
            onClick={() => window.open(`/preview/${playlist.id}`, '_blank')}
        >
            <Play className="h-4 w-4 mr-2" />
            Preview
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(playlist.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          title="Excluir Playlist"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlaylistList;
