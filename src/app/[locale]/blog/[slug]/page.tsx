'use client';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { blogPosts, type BlogPost } from '@/lib/blog-posts';
import { getImages } from '@/lib/site-data';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { useEffect, useState } from 'react';
import { type Metadata } from 'next';

// This function now runs on the server
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = blogPosts.find((p) => p.id === params.slug);

  if (!post) {
    return {
      title: 'Artigo não encontrado',
      description: 'O artigo que você está procurando não existe.',
    };
  }

  return {
    title: `${post.title} | Blog NexusTalent`,
    description: post.excerpt,
  };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.id,
  }));
}


export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const post = blogPosts.find((p) => p.id === slug);

  if (!post) {
    notFound();
  }
  
  const images = getImages();
  const image = images.find(p => p.id === post.imageId);
  const authorAvatar = images.find(p => p.id === post.authorAvatarId);
  const relatedPosts = blogPosts.filter(p => p.category === post.category && p.id !== post.id).slice(0, 3);


  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  }

  const formattedDate = format(parseISO(post.date), "d 'de' MMMM 'de' yyyy", { locale: pt });

  return (
    <>
      <Header />
      <main className="bg-background py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
                <ArrowLeft size={16} /> Voltar para o blog
            </Link>

          <article className="max-w-4xl mx-auto">
            <header className="mb-8">
              <Badge variant="default" className="mb-4">{post.category}</Badge>
              <h1 className="font-headline text-3xl md:text-5xl font-bold text-foreground mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {authorAvatar && (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={authorAvatar.imageUrl} />
                            <AvatarFallback>{getInitials(post.author)}</AvatarFallback>
                        </Avatar>
                        <span>{post.author}</span>
                    </div>
                )}
                <span className="flex items-center gap-1.5"><Calendar size={14}/> {formattedDate}</span>
              </div>
            </header>

            {image && (
              <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-8 shadow-lg">
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  fill
                  className="object-cover"
                  data-ai-hint={image.imageHint}
                />
              </div>
            )}

            <div
              className="prose dark:prose-invert prose-lg max-w-none prose-h3:font-headline prose-h3:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground prose-li:marker:text-primary"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        </div>
      </main>

       {relatedPosts.length > 0 && (
          <section className="bg-card py-16 mt-16">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="font-headline text-3xl font-bold text-center mb-10">Artigos Relacionados</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                      {relatedPosts.map(relatedPost => (
                          <BlogPostCard key={relatedPost.id} post={relatedPost} />
                      ))}
                  </div>
              </div>
          </section>
        )}

      <Footer />
    </>
  );
}