import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, PlaySquare, Tv2, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [stats, setStats] = useState({
    screens: 0,
    playlists: 0,
    media: 0,
    activeScreens: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [screensData, playlistsData, mediaData] = await Promise.all([
          supabase.from("screens").select("*", { count: "exact" }).eq("created_by", user.id),
          supabase.from("playlists").select("*", { count: "exact" }).eq("created_by", user.id),
          supabase.from("media").select("*", { count: "exact" }).eq("uploaded_by", user.id),
        ]);

        // Count active screens (online in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const activeScreens = screensData.data?.filter(
          (screen) => screen.last_seen && screen.last_seen > fiveMinutesAgo
        ).length || 0;

        setStats({
          screens: screensData.count || 0,
          playlists: playlistsData.count || 0,
          media: mediaData.count || 0,
          activeScreens,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Telas Totais",
      value: stats.screens,
      description: "Dispositivos cadastrados",
      icon: Tv2,
      color: "from-primary to-primary-glow",
    },
    {
      title: "Telas Ativas",
      value: stats.activeScreens,
      description: "Online nos últimos 5 min",
      icon: Activity,
      color: "from-success to-emerald-400",
    },
    {
      title: "Playlists",
      value: stats.playlists,
      description: "Sequências criadas",
      icon: PlaySquare,
      color: "from-accent to-cyan-400",
    },
    {
      title: "Mídias",
      value: stats.media,
      description: "Arquivos enviados",
      icon: Image,
      color: "from-warning to-yellow-400",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral do seu sistema de painéis digitais
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card
              key={card.title}
              className="border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl hover:shadow-glow transition-all duration-300"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-bold">{card.value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Bem-vindo ao JC VISION PLAY</CardTitle>
            <CardDescription>
              Gerencie facilmente suas telas, mídias e playlists
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Image className="h-4 w-4 text-primary" />
                  Mídias
                </h3>
                <p className="text-sm text-muted-foreground">
                  Faça upload de imagens e vídeos para exibir em suas telas
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <PlaySquare className="h-4 w-4 text-primary" />
                  Playlists
                </h3>
                <p className="text-sm text-muted-foreground">
                  Crie sequências de conteúdo com tempo de exibição personalizado
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Tv2 className="h-4 w-4 text-primary" />
                  Telas
                </h3>
                <p className="text-sm text-muted-foreground">
                  Cadastre dispositivos e atribua playlists para cada um
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Monitoramento
                </h3>
                <p className="text-sm text-muted-foreground">
                  Acompanhe o status online/offline de cada tela em tempo real
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
