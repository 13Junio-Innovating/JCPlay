import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Tv2, Circle, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { loggingService } from "@/services/loggingService";

interface Playlist {
  id: string;
  name: string;
}

interface Screen {
  id: string;
  name: string;
  player_key: string;
  assigned_playlist: string | null;
  last_seen: string | null;
  created_at: string;
  notification_emails?: string[];
}

const Screens = () => {
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [screenName, setScreenName] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Atualiza a cada 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      if (!user) return;

      const [screensData, playlistsData] = await Promise.all([
        api.screens.list(user.id),
        api.playlists.list(user.id)
      ]);

      setScreens(screensData.data || []);
      setPlaylists(playlistsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScreen = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!user) throw new Error("Usuário não autenticado");

      const response = await api.screens.create(screenName, user.id);

      if (response.error) throw new Error(response.error);

      // Log da atividade de criação de tela
      await loggingService.logUserActivity(
        'create_screen',
        'screen',
        response.id,
        { screen_name: screenName }
      );

      toast.success("Tela criada com sucesso!");
      setDialogOpen(false);
      setScreenName("");
      fetchData();
    } catch (error) {
      // Log do erro de criação de tela
      await loggingService.logError(
        error instanceof Error ? error : new Error('Erro desconhecido ao criar tela'),
        'create_screen_error',
        { screen_name: screenName, attempted_action: 'create_screen' },
        'medium'
      );
      
      console.error("Error creating screen:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar tela");
    }
  };

  const handleUpdatePlaylist = async (screenId: string, playlistId: string | null) => {
    try {
      const response = await api.screens.updatePlaylist(screenId, playlistId);

      if (response.error) throw new Error(response.error);

      // Log da atividade de atualização de playlist
      await loggingService.logUserActivity(
        'update_screen_playlist',
        'screen',
        screenId,
        { playlist_id: playlistId }
      );

      toast.success("Playlist atualizada!");
      fetchData();
    } catch (error) {
      // Log do erro de atualização de playlist
      await loggingService.logError(
        error instanceof Error ? error : new Error('Erro desconhecido ao atualizar playlist'),
        'update_screen_playlist_error',
        { screen_id: screenId, playlist_id: playlistId, attempted_action: 'update_screen_playlist' },
        'medium'
      );
      
      console.error("Error updating playlist:", error);
      toast.error("Erro ao atualizar playlist");
    }
  };

  const handleDeleteScreen = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta tela?")) return;

    try {
      // Buscar informações da tela antes de excluir para o log
      const screenToDelete = screens.find(s => s.id === id);

      const response = await api.screens.delete(id);
      if (response.error) throw new Error(response.error);

      // Log da atividade de exclusão de tela
      await loggingService.logUserActivity(
        'delete_screen',
        'screen',
        id,
        { screen_name: screenToDelete?.name }
      );

      toast.success("Tela excluída com sucesso!");
      fetchData();
    } catch (error) {
      // Log do erro de exclusão de tela
      await loggingService.logError(
        error instanceof Error ? error : new Error('Erro desconhecido ao excluir tela'),
        'delete_screen_error',
        { screen_id: id, attempted_action: 'delete_screen' },
        'medium'
      );
      
      console.error("Error deleting screen:", error);
      toast.error("Erro ao excluir tela");
    }
  };

  const handleCreateAllScreens = async () => {
    const screenNames = [
      "TOTEM - ÁREA SOCIAL",
      "TOTEM - CATRACA CIE", 
      "TOTEM - FOYER CIE",
      "TOTEM - HI",
      "TV - CAMINHO AÇORIANO",
      "TV - CANAL 3 (QUARTOS)",
      "TV - CENTRAL DO HÓSPEDE",
      "TV - LANCHONETE",
      "VIDEOWALL - HI",
      "VIDEOWALL - ÁREA SOCIAL"
    ];

    if (!confirm(`Deseja criar ${screenNames.length} telas automaticamente?`)) return;

    try {
      if (!user) throw new Error("Usuário não autenticado");

      for (const name of screenNames) {
        await api.screens.create(name, user.id);
      }

      toast.success(`${screenNames.length} telas criadas com sucesso!`);
      fetchData();
    } catch (error) {
      console.error("Error creating all screens:", error);
      toast.error("Erro ao criar telas");
    }
  };

  const handleAutoAssignPlaylists = async () => {
    try {
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar todas as telas do usuário
      const screensResponse = await api.screens.list(user.id);
      const allScreens: Screen[] = screensResponse.data || [];

      // Buscar todas as playlists do usuário
      const playlistsResponse = await api.playlists.list(user.id);
      const allPlaylists: Playlist[] = playlistsResponse.data || [];

      if (!allScreens || allScreens.length === 0) {
        toast.error("Nenhuma tela encontrada. Crie telas primeiro.");
        return;
      }

      if (!allPlaylists || allPlaylists.length === 0) {
        toast.error("Nenhuma playlist encontrada. Crie playlists primeiro.");
        return;
      }

      // Mapear telas para playlists baseado no nome
      const screenPlaylistMapping = (screenName: string) => {
        const name = screenName.toLowerCase();
        
        // Procurar playlist que melhor combina com o nome da tela
        const matchingPlaylist = allPlaylists.find(playlist => {
          const playlistName = playlist.name.toLowerCase();
          
          // Mapeamento específico baseado no nome da tela
          if (name.includes("entretenimento") || name.includes("espera") || name.includes("lobby")) {
            return playlistName.includes("entretenimento");
          }
          
          if (name.includes("operacional") || name.includes("informação") || name.includes("mapa")) {
            return playlistName.includes("operacional") || playlistName.includes("informação");
          }
          
          if (name.includes("cardápio") || name.includes("menu") || name.includes("lanchonete") || name.includes("restaurante")) {
            return playlistName.includes("cardápio") || playlistName.includes("menu");
          }
          
          if (name.includes("quarto") || name.includes("hóspede") || name.includes("hospede") || name.includes("hotel")) {
            return playlistName.includes("bem-vindo") || playlistName.includes("hóspede") || playlistName.includes("hospede");
          }
          
          if (name.includes("totem") || name.includes("vertical")) {
            return playlistName.includes("totem") || playlistName.includes("vertical");
          }
          
          return false;
        });

        // Se não encontrou correspondência específica, usar a primeira playlist disponível
        return matchingPlaylist || allPlaylists[0];
      };

      let updatedCount = 0;

      // Atualizar cada tela com a playlist apropriada
      for (const screen of allScreens) {
        const targetPlaylist = screenPlaylistMapping(screen.name);
        
        if (targetPlaylist && screen.assigned_playlist !== targetPlaylist.id) {
          const response = await api.screens.updatePlaylist(screen.id, targetPlaylist.id);
          
          if (!response.error) {
            updatedCount++;
          }
        }
      }

      if (updatedCount > 0) {
        toast.success(`${updatedCount} tela(s) associada(s) com playlists automaticamente!`);
        fetchData();
      } else {
        toast.info("Todas as telas já estão associadas com playlists apropriadas");
      }

    } catch (error) {
      console.error("Error auto-assigning playlists:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao associar playlists às telas");
    }
  };

  const copyPlayerKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Código copiado!");
  };

  const isOnline = (lastSeen: string | null) => {
    if (!lastSeen) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  const getPlaylistName = (playlistId: string | null) => {
    if (!playlistId) return "Nenhuma";
    const playlist = playlists.find((p) => p.id === playlistId);
    return playlist?.name || "Desconhecida";
  };

  const getPlayerUrl = (playerKey: string) => {
    return `${window.location.origin}/player/${playerKey}`;
  };
  const getShortPlayerUrl = (playerKey: string) => {
    return `${window.location.origin}/p/${playerKey}`;
  };

  // Removido gerenciamento de e-mails de notificação nesta interface

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Telas
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus dispositivos e monitore o status
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Tela
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                  <DialogTitle>Criar Nova Tela</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo dispositivo para exibir conteúdo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateScreen} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="screen-name">Nome da Tela</Label>
                    <Input
                      id="screen-name"
                      value={screenName}
                      onChange={(e) => setScreenName(e.target.value)}
                      placeholder="Ex: Recepção, Corredor A"
                      required
                      className="bg-secondary/50"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    Criar Tela
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="h-6 bg-secondary/50 animate-pulse rounded mb-4" />
                  <div className="h-4 bg-secondary/50 animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : screens.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tv2 className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhuma tela cadastrada</p>
              <p className="text-muted-foreground text-center mb-4">
                Cadastre dispositivos para começar a exibir conteúdo
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {screens.map((screen) => (
              <Card
                key={screen.id}
                className="border-border/50 bg-card/50 backdrop-blur-xl hover:shadow-glow transition-all"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">{screen.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            isOnline(screen.last_seen)
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }
                        >
                          <Circle
                            className="h-2 w-2 mr-1"
                            fill="currentColor"
                          />
                          {isOnline(screen.last_seen) ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Playlist: {getPlaylistName(screen.assigned_playlist)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteScreen(screen.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Código do Player
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={screen.player_key}
                        readOnly
                        className="bg-secondary/50 text-xs font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyPlayerKey(screen.player_key)}
                        className="border-border/50 shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Label className="text-xs text-muted-foreground mt-3">
                      URL Curta
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={getShortPlayerUrl(screen.player_key)}
                        readOnly
                        className="bg-secondary/50 text-xs font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigator.clipboard.writeText(getShortPlayerUrl(screen.player_key))}
                        className="border-border/50 shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Atribuir Playlist
                    </Label>
                    <Select
                      value={screen.assigned_playlist || "none"}
                      onValueChange={(value) =>
                        handleUpdatePlaylist(
                          screen.id,
                          value === "none" ? null : value
                        )
                      }
                    >
                      <SelectTrigger className="bg-secondary/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {playlists.map((playlist) => (
                          <SelectItem key={playlist.id} value={playlist.id}>
                            {playlist.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-border/50"
                    onClick={() => window.open(getShortPlayerUrl(screen.player_key), "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Player (URL curta)
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Screens;
