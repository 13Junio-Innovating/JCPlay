import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, Trash2, Image as ImageIcon, Video, Clock, RotateCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { loggingService } from "@/services/loggingService";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  duration: number;
  rotation?: number; // Tornando opcional já que pode não existir no banco
  uploaded_by: string; // Adicionando campo que vem do banco
  created_at: string;
}

const Media = () => {
  const { user } = useAuth();
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const MAX_UPLOAD_MB = parseInt(import.meta.env.VITE_MAX_UPLOAD_MB || '70');

  useEffect(() => {
    if (user) {
      fetchMedia();
    }
  }, [user]);

  const fetchMedia = async () => {
    try {
      if (!user) return;

      const response = await api.media.list(user.id);

      if (response.error) throw new Error(response.error);
      setMediaFiles(response.data || []);
    } catch (error) {
      console.error("Error fetching media:", error);
      toast.error("Erro ao carregar mídias");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "Power BI";
    const url = (formData.get("url") as string) || "";
    const duration = parseInt((formData.get("duration") as string) || "10", 10);

    if (!url) {
      toast.error("Informe o link");
      return;
    }

    if (isPowerBIUrl(url)) {
      if (isPublicPowerBI(url)) {
        toast.success("Link Power BI público detectado");
      } else {
        toast.warning("Link Power BI pode exigir login. Use ‘Publicar na web’. ");
      }
    } else if (isYouTubeUrl(url)) {
      toast.info("Link YouTube detectado");
    }

    try {
      if (!user) throw new Error("Usuário não autenticado");

      const response = await api.media.createLink({
        name,
        url,
        type: "video",
        duration,
        uploaded_by: user.id,
      });

      if (response.error) throw new Error(response.error);

      await loggingService.logUserActivity(
        'add_link_media',
        'media',
        '',
        { media_name: name, url_type: getLinkType(url), duration }
      );

      toast.success("Link adicionado com sucesso!");
      setLinkDialogOpen(false);
      setLinkUrl("");
      fetchMedia();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      await loggingService.logError(
        error instanceof Error ? error : new Error('Erro desconhecido ao adicionar link'),
        'add_link_media_error',
        { media_name: name, url },
        'medium'
      );
      console.error("Error adding link:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar link");
    }
  };

  const isYouTubeUrl = (url: string) => /(?:youtube\.com|youtu\.be)/.test(url);
  const isPowerBIUrl = (url: string) => /app\.powerbi\.com/.test(url);
  const getLinkType = (url: string) => (isPowerBIUrl(url) ? 'powerbi' : (isYouTubeUrl(url) ? 'youtube' : 'outro'));
  const isPublicPowerBI = (url: string) => /app\.powerbi\.com\/view\?/.test(url);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const duration = parseInt(formData.get("duration") as string) || 10;
    const rotation = parseInt(formData.get("rotation") as string) || 0;

    if (!file) {
      toast.error("Selecione um arquivo");
      setUploading(false);
      return;
    }

    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`Arquivo acima de ${MAX_UPLOAD_MB}MB`);
      setUploading(false);
      return;
    }

    try {
      if (!user) throw new Error("Usuário não autenticado");

      const fileExt = file.name.split(".").pop();
      // const fileName = `${user.id}/${Date.now()}.${fileExt}`; // Not used with PHP backend in the same way
      const fileType = file.type.startsWith("video") ? "video" : "image";

      // Simular progresso do upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name || file.name);
      formData.append('duration', duration.toString());
      formData.append('rotation', rotation.toString());
      formData.append('uploaded_by', user.id);
      formData.append('type', fileType);

      const response = await api.media.upload(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.error) throw new Error(response.error);

      // Log da atividade de upload de mídia
      await loggingService.logUserActivity(
        'upload_media',
        'media',
        '', // ID será gerado pelo banco
        { 
          media_name: name || file.name,
          file_type: fileType,
          file_size: file.size,
          duration: duration,
          rotation: rotation
        }
      );

      toast.success("Mídia enviada com sucesso!");
      setDialogOpen(false);
      fetchMedia();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      // Log do erro de upload de mídia
      await loggingService.logError(
        error instanceof Error ? error : new Error('Erro desconhecido ao fazer upload'),
        'upload_media_error',
        { 
          media_name: name || file.name,
          file_type: file?.type,
          file_size: file?.size,
          attempted_action: 'upload_media'
        },
        'medium'
      );
      
      console.error("Error uploading:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mídia");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm("Deseja realmente excluir esta mídia?")) return;

    try {
      // Buscar informações da mídia antes de excluir para o log
      const mediaToDelete = mediaFiles.find(m => m.id === id);

      const response = await api.media.delete(id);
      if (response.error) throw new Error(response.error);

      // Log da atividade de exclusão de mídia
      await loggingService.logUserActivity(
        'delete_media',
        'media',
        id,
        { 
          media_name: mediaToDelete?.name,
          file_type: mediaToDelete?.type,
          duration: mediaToDelete?.duration
        }
      );

      toast.success("Mídia excluída com sucesso!");
      fetchMedia();
    } catch (error) {
      // Log do erro de exclusão de mídia
      await loggingService.logError(
        error instanceof Error ? error : new Error('Erro desconhecido ao excluir mídia'),
        'delete_media_error',
        { 
          media_id: id,
          attempted_action: 'delete_media'
        },
        'medium'
      );
      
      console.error("Error deleting:", error);
      toast.error("Erro ao excluir mídia");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Mídias
            </h1>
            <p className="text-muted-foreground">
              Gerencie imagens e vídeos para suas telas
            </p>
          </div>

          <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                  <DialogTitle>Enviar Mídia</DialogTitle>
                  <DialogDescription>
                  Faça upload de imagens ou vídeos (até {MAX_UPLOAD_MB}MB)
                  </DialogDescription>
                </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="image/*,video/*"
                    required
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome (opcional)</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Nome da mídia"
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração de exibição (segundos)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    defaultValue={10}
                    min={1}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rotation">Rotação da tela</Label>
                  <Select name="rotation" defaultValue="0">
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Normal (0°)</SelectItem>
                      <SelectItem value="90">90° (Horário)</SelectItem>
                      <SelectItem value="180">180° (Invertido)</SelectItem>
                      <SelectItem value="270">270° (Anti-horário)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-muted-foreground text-center">
                      Enviando... {uploadProgress}%
                    </p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={uploading}
                >
                  {uploading ? "Enviando..." : "Enviar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border/50">
                <LinkIcon className="mr-2 h-4 w-4" />
                Adicionar Link
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
                <DialogHeader>
                  <DialogTitle>Adicionar Link</DialogTitle>
                  <DialogDescription>
                  Informe um link (YouTube ou Power BI) e a duração
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" name="name" type="text" placeholder="Ex: Relatório Vendas" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Link</Label>
                    <Input id="url" name="url" type="url" placeholder="https://app.powerbi.com/..." className="bg-secondary/50" required value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
                    {linkUrl && isPowerBIUrl(linkUrl) && (
                      <p className="text-xs text-muted-foreground">
                        {isPublicPowerBI(linkUrl) ? 'Detectado link público do Power BI' : 'Detectado link do Power BI que pode exigir login'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (segundos)</Label>
                    <Input id="duration" name="duration" type="number" defaultValue={10} min={5} className="bg-secondary/50" />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">Salvar</Button>
                </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-xl">
                <div className="aspect-video bg-secondary/50 animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-4 bg-secondary/50 animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : mediaFiles.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">Nenhuma mídia encontrada</p>
              <p className="text-muted-foreground text-center mb-4">
                Comece enviando imagens e vídeos para usar em suas playlists
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mediaFiles.map((media) => (
              <Card
                key={media.id}
                className="border-border/50 bg-card/50 backdrop-blur-xl hover:shadow-glow transition-all group"
              >
                <div className="aspect-video bg-secondary/50 overflow-hidden rounded-t-xl relative">
                  {media.type === "image" ? (
                    <img
                      src={media.url}
                      alt={media.name}
                      className={`w-full h-full object-cover ${media.rotation ? `rotate-${media.rotation}` : ''}`}
                    />
                  ) : isYouTubeUrl(media.url) ? (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-xs text-muted-foreground">
                      YouTube
                    </div>
                  ) : isPowerBIUrl(media.url) ? (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-xs text-muted-foreground">
                      {isPublicPowerBI(media.url) ? 'Power BI (público)' : 'Power BI (login)'}
                    </div>
                  ) : (
                    <video
                      src={media.url}
                      className={`w-full h-full object-cover ${media.rotation ? `rotate-${media.rotation}` : ''}`}
                      muted
                    />
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm flex items-center gap-1">
                    {media.type === "image" ? (
                      <ImageIcon className="h-3 w-3" />
                    ) : isPowerBIUrl(media.url) ? (
                      <LinkIcon className="h-3 w-3" />
                    ) : isYouTubeUrl(media.url) ? (
                      <LinkIcon className="h-3 w-3" />
                    ) : (
                      <Video className="h-3 w-3" />
                    )}
                    <span className="text-xs">{media.type}</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{media.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {media.duration}s
                        </p>
                        {(media.rotation || 0) > 0 && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <RotateCw className="h-3 w-3" />
                            {media.rotation || 0}°
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(media.id, media.url)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Media;
