import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Monitor, LayoutDashboard, Image, PlaySquare, Tv2, LogOut, Menu, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { User } from "@supabase/supabase-js";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const VIDEO_MODE = import.meta.env.VITE_VIDEO_MODE === "true";
      if (VIDEO_MODE) {
        setUser({ email: "video@example.com" } as unknown as User);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const VIDEO_MODE = import.meta.env.VITE_VIDEO_MODE === "true";
    if (!VIDEO_MODE) {
      await supabase.auth.signOut();
    }
    toast.success("Logout realizado com sucesso");
    navigate("/login");
  };

  const BILLING_ENABLED = import.meta.env.VITE_ENABLE_BILLING === "true";
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Image, label: "Mídias", path: "/media" },
    { icon: PlaySquare, label: "Playlists", path: "/playlists" },
    { icon: Tv2, label: "Telas", path: "/screens" },
    { icon: FileText, label: "Logs", path: "/logs" },
    ...(BILLING_ENABLED ? [{ icon: CreditCard, label: "Pagamento", path: "/billing" }] : []),
  ];

  const NavigationContent = () => (
    <>
      {navItems.map((item) => (
        <Button
          key={item.path}
          variant="ghost"
          className="w-full justify-start hover:bg-secondary/80 transition-colors"
          onClick={() => {
            navigate(item.path);
            setMobileMenuOpen(false);
          }}
        >
          <item.icon className="mr-2 h-5 w-5" />
          {item.label}
        </Button>
      ))}
    </>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-card/95 backdrop-blur-xl">
                <div className="flex flex-col gap-2 mt-8">
                  <NavigationContent />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
                           <img src="/logo-costao.png" alt="Costão JCVision" className="h-10 w-auto" />
                           <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                             COSTAO JCVISION PLAY
                           </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex w-64 min-h-[calc(100vh-4rem)] border-r border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="flex flex-col gap-2 p-4 w-full">
            <NavigationContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
