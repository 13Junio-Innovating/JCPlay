import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loggingService } from "@/services/loggingService";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import PlaylistList from "@/components/PlaylistList";

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

const Playlists = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<PlaylistItem[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [playlistsData, mediaData] = await Promise.all([
        api.playlists.list(user.id),
        api.media.list(user.id),
      ]);

      // Parse items from JSON string if necessary, though the API might return it as object/array depending on PHP implementation.
      // Assuming PHP returns JSON string for 'items' column if it's stored as TEXT/JSON, or if PHP json_decodes it.
      // My PHP code sends it as string in DB, but when fetching, if I just do fetchAll, it comes as string.
      // I should check if I need to parse. In JS, if it comes as string, I parse.
      
      const parsedPlaylists = (playlistsData.data || []).map((p: any) => ({
        ...p,
        items: typeof p.items === 'string' ? JSON.parse(p.items) : p.items
      }));

      setPlaylists(parsedPlaylists);
      setMediaFiles(mediaData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedia = (media: MediaFile) => {
    if (selectedMedia.some((item) => item.mediaId === media.id)) {
      toast.error("Mídia já adicionada");
      return;
    }
    setSelectedMedia([...selectedMedia, { mediaId: media.id, duration: media.duration }]);
  };

  const handleRemoveMedia = (mediaId: string) => {
    setSelectedMedia(selectedMedia.filter((item) => item.mediaId !== mediaId));
  };

  const handleUpdateDuration = (mediaId: string, duration: number) => {
    setSelectedMedia(
      selectedMedia.map((item) =>
        item.mediaId === mediaId ? { ...item, duration } : item
      )
    );
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMedia.length === 0) {
      toast.error("Adicione pelo menos uma mídia");
      return;
    }

    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      const newPlaylist = {
        name: playlistName,
        items: selectedMedia,
        created_by: user.id,
      };

      const response = await api.playlists.create(newPlaylist);

      if (response.error) throw new Error(response.error);

      // Log da atividade de criação de playlist
      // Note: response might not include the full object with ID depending on my PHP implementation, 
      // but let's assume success means it's done. 
      // Ideally API should return the created ID. My PHP returns {"message": "..."}. 
      // I should update PHP to return ID if I want to log it correctly or use it.
      // For now, I'll just log success.
      
      await loggingService.logUserActivity(
        'create_playlist',
        'playlist',
        'new', // Placeholder if ID not returned
        { 
          playlist_name: playlistName,
          media_count: selectedMedia.length,
          media_items: selectedMedia.map(item => item.mediaId).join(',')
        }
      );

      toast.success("Playlist criada com sucesso!");
      setDialogOpen(false);
      setPlaylistName("");
      setSelectedMedia([]);
      fetchData();
    } catch (error) {
      await loggingService.logError(
        error instanceof Error ? error : new Error('Erro desconhecido ao criar playlist'),
        'create_playlist_error',
        { 
          playlist_name: playlistName,
          media_count: selectedMedia.length,
          attempted_action: 'create_playlist'
        },
        'medium'
      );
      
      console.error("Error creating playlist:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar playlist");
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta playlist?")) return;

    try {
      const playlistToDelete = playlists.find(p => p.id === id);
      
      const response = await api.playlists.delete(id);
      if (response.error) throw new Error(response.error);

      await loggingService.logUserActivity(
        'delete_playlist',
        'playlist',
        id,
        { 
          playlist_name: playlistToDelete?.name,
          media_count: playlistToDelete?.items?.length || 0
        }
      );

      toast.success("Playlist excluída com sucesso!");
      fetchData();
    } catch (error) {
      await loggingService.logError(
        error instanceof Error ? error : new Error('Erro desconhecido ao excluir playlist'),
        'delete_playlist_error',
        { playlist_id: id, attempted_action: 'delete_playlist' },
        'medium'
      );
      
      console.error("Error deleting playlist:", error);
      toast.error("Erro ao excluir playlist");
    }
  };

  const handleCreateAllPlaylists = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const playlistsToCreate = [
      {
        name: "Entretenimento Geral",
        description: "Conteúdo para áreas de espera e entretenimento"
      },
      {
        name: "Informações Operacionais", 
        description: "Instruções, mapas e informações importantes"
      },
      {
        name: "Cardápio Digital",
        description: "Pratos, bebidas e promoções da lanchonete"
      },
      {
        name: "Bem-vindo Hóspede",
        description: "Informações e serviços do hotel para quartos"
      }
    ];

    try {
      // Primeiro, criar as mídias de exemplo sequencialmente
      const sampleMedias = [
        {
          name: "Entretenimento Geral",
          url: "/sample-images/entretenimento-geral.svg",
          type: "image",
          duration: 10,
          uploaded_by: user.id
        },
        {
          name: "Informações Operacionais",
          url: "/sample-images/informacoes-operacionais.svg", 
          type: "image",
          duration: 15,
          uploaded_by: user.id
        },
        {
          name: "Cardápio Digital",
          url: "/sample-images/cardapio-digital.svg",
          type: "image", 
          duration: 12,
          uploaded_by: user.id
        },
        {
          name: "Bem-vindo Hóspede",
          url: "/sample-images/bem-vindo-hospede.svg",
          type: "image",
          duration: 8,
          uploaded_by: user.id
        },
        {
          name: "Totem Vertical",
          url: "/sample-images/totem-vertical.svg",
          type: "image",
          duration: 10,
          uploaded_by: user.id
        }
      ];

      const createdMediaIds: string[] = [];

      for (const media of sampleMedias) {
        const response = await api.media.createLink(media);
        if (response.error) throw new Error(response.error);
        if (response.id) {
            createdMediaIds.push(response.id);
        } else {
            // Fallback if ID is not returned, though we fixed API to return it.
            // If it fails, we might skip or error out.
            console.warn("Media ID not returned for", media.name);
            createdMediaIds.push(""); // Push empty to keep index alignment or handle differently
        }
      }

      // Criar as playlists com as mídias
      for (let i = 0; i < playlistsToCreate.length; i++) {
        const playlist = playlistsToCreate[i];
        const mediaId = createdMediaIds[i];
        
        // Skip if media creation failed for this index
        if (!mediaId) continue;

        const items = [{
            mediaId: mediaId,
            duration: sampleMedias[i].duration
        }];

        const playlistData = {
            name: playlist.name,
            description: playlist.description,
            items: items,
            created_by: user.id
        };

        const response = await api.playlists.create(playlistData);
        if (response.error) throw new Error(response.error);
      }

      toast.success(`${playlistsToCreate.length} playlists criadas com mídias de exemplo!`);
      fetchData();
    } catch (error) {
      console.error("Error creating playlists:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar playlists");
    }
  };

  const getMediaById = (id: string) => mediaFiles.find((m) => m.id === id);

  const handleAutoUpdatePlaylists = async () => {
    if (!user) {
        toast.error("Usuário não autenticado");
        return;
    }

    try {
      // Buscar todas as mídias do usuário
      const mediaResponse = await api.media.list(user.id);
      const allMedia = mediaResponse.data || [];

      // Buscar todas as playlists existentes
      const playlistResponse = await api.playlists.list(user.id);
      const existingPlaylists = (playlistResponse.data || []).map((p: any) => ({
        ...p,
        items: typeof p.items === 'string' ? JSON.parse(p.items) : p.items
      }));

      if (allMedia.length === 0) {
        toast.error("Nenhuma mídia encontrada para adicionar às playlists");
        return;
      }

      // Categorizar mídias (mesma lógica)
      const categorizeMidiaForPlaylist = (media: MediaFile, playlistName: string) => {
        const mediaName = media.name.toLowerCase();
        
        switch (playlistName) {
          case "Entretenimento Geral":
            return mediaName.includes("entretenimento") || 
                   mediaName.includes("diversão") || 
                   mediaName.includes("lazer") ||
                   mediaName.includes("social") ||
                   media.type === "video";
          
          case "Informações Operacionais":
            return mediaName.includes("informação") || 
                   mediaName.includes("operacional") || 
                   mediaName.includes("instrução") ||
                   mediaName.includes("mapa") ||
                   mediaName.includes("aviso");
          
          case "Cardápio Digital":
            return mediaName.includes("cardápio") || 
                   mediaName.includes("menu") || 
                   mediaName.includes("comida") ||
                   mediaName.includes("bebida") ||
                   mediaName.includes("lanchonete");
          
          case "Bem-vindo Hóspede":
            return mediaName.includes("bem-vindo") || 
                   mediaName.includes("hospede") || 
                   mediaName.includes("quarto") ||
                   mediaName.includes("hotel") ||
                   mediaName.includes("serviço");
          
          case "Totem Vertical":
            return mediaName.includes("totem") || 
                   mediaName.includes("vertical") ||
                   false ||
                   false;
          
          default:
            return false;
        }
      };

      let updatedCount = 0;

      // Atualizar cada playlist com mídias relevantes
      for (const playlist of existingPlaylists) {
        const relevantMedia = allMedia.filter((media: MediaFile) => 
          categorizeMidiaForPlaylist(media, playlist.name)
        );

        if (relevantMedia.length === 0) continue;

        // Obter itens atuais da playlist
        const currentItems = Array.isArray(playlist.items) ? playlist.items : [];
        const currentMediaIds = currentItems.map((item: PlaylistItem) => item.mediaId);

        // Adicionar novas mídias que não estão na playlist
        const newItems = relevantMedia
          .filter((media: MediaFile) => !currentMediaIds.includes(media.id))
          .map((media: MediaFile) => ({
            mediaId: media.id,
            duration: media.duration || 10
          }));

        if (newItems.length > 0) {
          const updatedItems = [...currentItems, ...newItems];

          const response = await api.playlists.update(playlist.id, { items: updatedItems });

          if (response.error) throw new Error(response.error);
          updatedCount++;
        }
      }

      // Se não há playlists, adicionar todas as mídias a uma playlist geral
      if (existingPlaylists.length === 0) {
        const allMediaItems = allMedia.map((media: MediaFile) => ({
          mediaId: media.id,
          duration: media.duration || 10
        }));

        const response = await api.playlists.create({
            name: "Todas as Mídias",
            items: allMediaItems,
            created_by: user.id
        });

        if (response.error) throw new Error(response.error);
        updatedCount = 1;
      }

      if (updatedCount > 0) {
        toast.success(`${updatedCount} playlist(s) atualizada(s) com suas novas mídias!`);
        fetchData();
      } else {
        toast.info("Todas as mídias já estão nas playlists apropriadas");
      }

    } catch (error) {
      console.error("Error updating playlists:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar playlists");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Playlists
            </h1>
            <p className="text-muted-foreground">
              Crie sequências de conteúdo para suas telas
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Playlist
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Playlist</DialogTitle>
                <DialogDescription>
                  Adicione mídias e configure a duração de cada uma
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePlaylist} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist-name">Nome da Playlist</Label>
                  <Input
                    id="playlist-name"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="Ex: Playlist Manhã"
                    required
                    className="bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mídias Selecionadas ({selectedMedia.length})</Label>
                  {selectedMedia.length === 0 ? (
                    <div className="p-4 border border-dashed border-border rounded-lg text-center text-muted-foreground">
                      Nenhuma mídia selecionada
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedMedia.map((item) => {
                        const media = getMediaById(item.mediaId);
                        if (!media) return null;
                        return (
                          <div
                            key={item.mediaId}
                            className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
                          >
                            <div className="w-16 h-16 bg-secondary rounded overflow-hidden shrink-0">
                              {media.type === "image" ? (
                                <img
                                  src={media.url}
                                  alt={media.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <video
                                  src={media.url}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{media.name}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Input
                                type="number"
                                value={item.duration}
                                onChange={(e) =>
                                  handleUpdateDuration(
                                    item.mediaId,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                min={1}
                                className="w-20 bg-background"
                              />
                              <span className="text-sm text-muted-foreground">s</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveMedia(item.mediaId)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Adicionar Mídias</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-border rounded-lg bg-secondary/20">
                    {mediaFiles.length === 0 ? (
                      <div className="col-span-full text-center py-4 text-muted-foreground">
                        Nenhuma mídia disponível
                      </div>
                    ) : (
                      mediaFiles.map((media) => (
                        <button
                          key={media.id}
                          type="button"
                          onClick={() => handleAddMedia(media)}
                          className="aspect-video relative rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                          disabled={selectedMedia.some((item) => item.mediaId === media.id)}
                        >
                          {media.type === "image" ? (
                            <img
                              src={media.url}
                              alt={media.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={media.url}
                              className="w-full h-full object-cover"
                              muted
                            />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-xs text-white truncate">
                            {media.name}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Criar Playlist
                </Button>
              </form>
            </DialogContent>
            </Dialog>

            <Button
                variant="outline" 
                onClick={handleCreateAllPlaylists}
                title="Criar playlists de exemplo"
            >
                <Plus className="mr-2 h-4 w-4" />
                Exemplos
            </Button>
            
            {/* 
            <Button
                variant="outline"
                onClick={handleAutoUpdatePlaylists}
                title="Auto-organizar mídias"
            >
                <RefreshCw className="mr-2 h-4 w-4" />
                Auto
            </Button>
             */}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-card/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-4">
              Nenhuma playlist criada
            </h3>
            <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <PlaylistList
                key={playlist.id}
                playlist={playlist}
                mediaFiles={mediaFiles}
                onDelete={handleDeletePlaylist}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Playlists;
