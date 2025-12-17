import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Monitor, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.auth.forgotPassword(email);

      if (response.error) {
        throw new Error(response.error);
      }

      setEmailSent(true);
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Recuperar Senha
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {emailSent 
              ? "Email enviado! Verifique sua caixa de entrada."
              : "Digite seu email para receber o link de recuperação"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
