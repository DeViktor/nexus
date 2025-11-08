'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { Menu, X, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

const navLinks = [
    { href: '/courses', label: 'Cursos' },
    { href: '/recruitment', label: 'Vagas' },
    { href: '/about', label: 'Sobre Nós' },
    { href: '/blog', label: 'Blog' },
];

export function DashboardHeader() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [user, firestore]);
    
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  }

  const getSettingsLink = () => {
    if (!userProfile) return '/dashboard/student/profile'; // Default fallback
    switch (userProfile.userType) {
      case 'recruiter':
        return '/dashboard/recruiter/company-profile';
      case 'student':
        return '/dashboard/student/profile';
      case 'instructor':
        return '/dashboard/instructor'; // Or a specific instructor profile page
      case 'admin':
        return '/dashboard/settings'; // Admin has site-wide settings
      default:
        return '/dashboard';
    }
  }


  return (
    <header className="bg-card shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
          </div>

          <nav className="hidden md:flex md:items-center md:space-x-8">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "font-medium transition-colors",
                            pathname.endsWith(link.href) ? "text-primary font-semibold" : "text-foreground/80 hover:text-foreground"
                        )}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>

          <div className="flex items-center space-x-2">

            {isUserLoading || isProfileLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                     <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className='hidden sm:inline'>{user.displayName || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Painel</Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                    <Link href={getSettingsLink()}><Settings className="mr-2 h-4 w-4"/>Configurações</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                    <LogOut className="mr-2 h-4 w-4"/>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className='hidden md:flex'>
                <Button variant="ghost" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                  <Link href="/signup">Cadastre-se</Link>
                </Button>
              </div>
            )}

            <div className="md:hidden flex items-center">
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </div>

             <div
                className={cn(
                'md:hidden transition-all duration-300 ease-in-out absolute top-full left-0 w-full bg-card',
                isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                )}
            >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
                    {navLinks.map((link) => (
                        <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "block px-3 py-2 rounded-md text-base font-medium",
                            pathname.endsWith(link.href) ? "bg-secondary text-primary font-semibold" : "text-foreground/80 hover:bg-secondary"
                        )}
                        onClick={() => setIsMenuOpen(false)}
                        >
                        {link.label}
                        </Link>
                    ))}
                   <div className="pt-4 border-t">
                    {user ? (
                       <div className="space-y-2 px-3">
                         <p className="font-medium">{user.displayName || user.email}</p>
                         <Button variant="outline" className="w-full" asChild><Link href="/dashboard">Painel</Link></Button>
                         <Button variant="destructive" className="w-full" onClick={handleLogout}>Sair</Button>
                       </div>
                    ) : (
                      <div className="flex items-center px-3 space-x-2">
                         <Button variant="ghost" className="w-full" asChild>
                          <Link href="/login">Entrar</Link>
                        </Button>
                        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                          <Link href="/signup">Cadastre-se</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
            </div>
            
          </div>
        </div>
      </div>
    </header>
  );
}
