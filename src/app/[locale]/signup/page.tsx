
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
import Link from "next/link";
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserProfile } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-.97,2.53-2.09,3.31v2.77h3.57c2.08-1.92,3.28-4.74,3.28-8.09Z"/>
    <path fill="#34A853" d="M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98,.66-2.23,1.06-3.71,1.06-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z"/>
    <path fill="#FBBC05" d="M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43,.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l3.66-2.84Z"/>
    <path fill="#EA4335" d="M12,5.16c1.58,0,2.99,.54,4.1,1.62l3.15-3.15C17.46,1.99,14.97,1,12,1,7.7,1,3.99,3.47,2.18,7.07l3.66,2.84C6.71,7.09,9.14,5.16,12,5.16Z"/>
  </svg>
);


const formSchema = z.object({
  userType: z.enum(['student', 'instructor', 'recruiter'], { required_error: 'Por favor, selecione um papel.' }),
  firstName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  lastName: z.string().min(2, 'O apelido deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  companyName: z.string().optional(),
  specialization: z.string().optional(),
}).refine(data => {
    if (data.userType === 'recruiter' && (!data.companyName || data.companyName.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: 'O nome da empresa é obrigatório para recrutadores.',
    path: ['companyName'],
}).refine(data => {
    if (data.userType === 'instructor' && (!data.specialization || data.specialization.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: 'A área de especialização é obrigatória para formadores.',
    path: ['specialization'],
});


type FormValues = z.infer<typeof formSchema>;


export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userType: 'student',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      companyName: '',
      specialization: '',
    }
  });

  const selectedRole = form.watch('userType');

  const createFirestoreUser = (userCredential: UserCredential, userType: 'student' | 'instructor' | 'recruiter', additionalData?: Partial<UserProfile>) => {
    if (!firestore) return;
    const user = userCredential.user;
    const [firstName, ...lastNameParts] = user.displayName?.split(' ') || [additionalData?.firstName || '', ''];
    
    const userDocRef = doc(firestore, 'users', user.uid);
    
    const profileData: UserProfile = {
      id: user.uid,
      email: user.email!,
      firstName: firstName,
      lastName: lastNameParts.join(' '),
      userType: userType,
      ...additionalData,
    };
    
    // Explicitly add photoURL only if it exists to avoid 'undefined'
    if (user.photoURL) {
        profileData.profilePictureUrl = user.photoURL;
    }

    setDoc(userDocRef, profileData)
        .then(() => {
          toast({
            title: 'Conta criada com sucesso!',
            description: `Bem-vindo(a)! Você já pode fazer o login.`,
          });
          router.push('/login');
        })
        .catch((error) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: profileData
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        });
  };

  const handleSignup: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    if (!firestore || !auth) {
        toast({
            variant: "destructive",
            title: "Erro de Configuração",
            description: "Os serviços da Firebase não estão disponíveis.",
        });
        setIsLoading(false);
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: `${data.firstName} ${data.lastName}` });
      createFirestoreUser(userCredential, data.userType, {
        firstName: data.firstName,
        lastName: data.lastName,
        academicTitle: data.userType === 'instructor' ? data.specialization : undefined,
      });

    } catch (error: any) {
        console.error("Signup Error (Auth):", error);
        let description = 'Ocorreu um erro. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'Este endereço de e-mail já está a ser utilizado por outra conta.';
        }
        toast({
            variant: 'destructive',
            title: 'Erro ao criar conta',
            description: description,
        });
        setIsLoading(false);
    } 
  };

  const handleGoogleSignUp = async () => {
    const userType = form.getValues('userType');
    // Validação manual para campos condicionais antes de abrir o popup
    if (userType === 'recruiter' && !form.getValues('companyName')) {
        form.setError('companyName', { type: 'manual', message: 'O nome da empresa é obrigatório.' });
        return;
    }
     if (userType === 'instructor' && !form.getValues('specialization')) {
        form.setError('specialization', { type: 'manual', message: 'A área de especialização é obrigatória.' });
        return;
    }

    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        createFirestoreUser(userCredential, userType, {
            // Os nomes são obtidos do perfil Google, mas podemos passar os dados do formulário como fallback
            academicTitle: userType === 'instructor' ? form.getValues('specialization') : undefined,
        });
    } catch (error: any) {
        console.error("Google Sign-Up Error:", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao registar com Google',
            description: error.message || 'Não foi possível registar com o Google.',
        });
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
              Crie sua conta gratuita
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary/90">
                Faça login
              </Link>
            </p>
          </div>
          <Card>
              <CardHeader>
                  <CardTitle>Cadastre-se</CardTitle>
                  <CardDescription>Para testar o painel de recrutador, use o email 'recruiter@nexustalent.com.br' e a senha '123456', selecionando o papel "Recrutador / Empresa" abaixo.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="userType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Eu sou um...</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione o seu papel" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="student">Candidato / Formando</SelectItem>
                                            <SelectItem value="recruiter">Recrutador / Empresa</SelectItem>
                                            <SelectItem value="instructor">Formador / Instrutor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {selectedRole === 'recruiter' && (
                             <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Empresa</FormLabel>
                                        <FormControl>
                                            <Input placeholder="O nome da sua empresa" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {selectedRole === 'instructor' && (
                             <FormField
                                control={form.control}
                                name="specialization"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Área de Especialização</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Finanças, Gestão de Projetos" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                Ou registe-se com
                                </span>
                            </div>
                        </div>

                         <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignUp} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                            Registar com Google
                        </Button>

                         <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                Ou com o seu e-mail
                                </span>
                            </div>
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input placeholder="O seu nome" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Apelido</FormLabel>
                                        <FormControl>
                                            <Input placeholder="O seu apelido" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="seu@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Senha</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar Conta com E-mail'}
                        </Button>
                    </form>
                </Form>
              </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
