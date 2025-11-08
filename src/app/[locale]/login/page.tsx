'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import Link from "next/link";
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-.97,2.53-2.09,3.31v2.77h3.57c2.08-1.92,3.28-4.74,3.28-8.09Z"/>
    <path fill="#34A853" d="M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98,.66-2.23,1.06-3.71,1.06-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z"/>
    <path fill="#FBBC05" d="M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43,.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l3.66-2.84Z"/>
    <path fill="#EA4335" d="M12,5.16c1.58,0,2.99,.54,4.1,1.62l3.15-3.15C17.46,1.99,14.97,1,12,1,7.7,1,3.99,3.47,2.18,7.07l3.66,2.84C6.71,7.09,9.14,5.16,12,5.16Z"/>
  </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o seu painel.',
      });

      router.push('/dashboard');

    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      let description = 'Ocorreu um erro inesperado. Verifique a consola para mais detalhes.';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          description = 'E-mail ou senha inválidos. Por favor, verifique os seus dados ou crie uma conta se ainda não tiver uma.';
          break;
        case 'auth/invalid-email':
          description = 'O formato do e-mail é inválido.';
          break;
        case 'auth/too-many-requests':
          description = 'O acesso a esta conta foi temporariamente desativado devido a muitas tentativas de login falhadas. Tente novamente mais tarde.';
          break;
        default:
          description = error.message || 'Não foi possível fazer login. Por favor, tente novamente.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email em falta',
        description: 'Por favor, insira o seu endereço de email no campo respetivo para redefinir a palavra-passe.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Email de recuperação enviado!',
        description: `Verifique o seu email (${email}) para obter as instruções de redefinição da palavra-passe.`,
      });
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      let description = 'Não foi possível enviar o email de recuperação. Tente novamente.';
      if (error.code === 'auth/invalid-email') {
        description = 'O endereço de email fornecido é inválido.';
      } else if (error.code === 'auth/user-not-found') {
        description = 'Não foi encontrada nenhuma conta com este endereço de email.';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao Recuperar Palavra-passe',
        description: description,
      });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        toast({
            title: 'Login com Google bem-sucedido!',
            description: 'Redirecionando para o seu painel.',
        });
        router.push('/dashboard');
    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        toast({
            variant: 'destructive',
            title: 'Erro no Login com Google',
            description: error.message || 'Não foi possível fazer login com o Google.',
        });
    } finally {
        setIsLoading(false);
    }
  }


  return (
    <>
      <Header />
      <main className="flex items-center justify-center flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
              <Link href="/" className="inline-block">
                  <Logo />
              </Link>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground font-headline">
              Acesse sua conta
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Ou{' '}
              <Link href="/signup" className="font-medium text-primary hover:text-primary/90">
                crie uma conta agora
              </Link>
            </p>
          </div>
          <Card>
              <CardHeader>
                  <CardTitle>Entrar</CardTitle>
                  <CardDescription>Use as credenciais da conta que você criou na página de registo.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" placeholder="seu@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <div className="flex items-center justify-between">
                          <Label htmlFor="password">Senha</Label>
                          <button type="button" onClick={handlePasswordReset} className="text-sm font-medium text-primary hover:underline">
                            Esqueceu sua senha?
                          </button>
                      </div>
                      <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
                  </Button>
                </form>
                 <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Ou continue com
                        </span>
                    </div>
                </div>
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Entrar com Google
                </Button>
              </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
