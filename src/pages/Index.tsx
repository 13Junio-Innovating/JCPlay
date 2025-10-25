import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Monitor, PlaySquare, Image, Tv2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
         <img src="/logo-costao.png" alt="Costão JCVision" className="mx-auto mb-8 h-24 w-auto" />
           <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
             COSTAO JCVISION PLAY
           </h1>
           <p className="text-xl md:text-2xl text-muted-foreground mb-8">
             Gerencie seus painéis digitais de forma simples e profissional
           </p>
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-lg px-8 py-6 shadow-glow"
          >
            Começar agora
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl border border-border/50 hover:shadow-glow transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4 shadow-lg">
              <Image className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Mídias</h3>
            <p className="text-muted-foreground">
              Upload de imagens e vídeos com controle total de duração e organização
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl border border-border/50 hover:shadow-glow transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-cyan-400 flex items-center justify-center mb-4 shadow-lg">
              <PlaySquare className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Playlists</h3>
            <p className="text-muted-foreground">
              Crie sequências personalizadas de conteúdo com tempo de exibição ajustável
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl border border-border/50 hover:shadow-glow transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-success to-emerald-400 flex items-center justify-center mb-4 shadow-lg">
              <Tv2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Telas</h3>
            <p className="text-muted-foreground">
              Gerencie múltiplos dispositivos e monitore o status em tempo real
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-xl border border-border/50 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-muted-foreground mb-6 text-lg">
              Crie sua conta gratuitamente e comece a gerenciar seus painéis digitais agora mesmo
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              Criar conta grátis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
