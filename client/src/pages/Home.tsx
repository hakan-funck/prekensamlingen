import { Link } from "wouter";
import { BookOpen, Search, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallPWA } from "@/components/InstallPWA";
import heroBanner from "@assets/ChatGPT Image 4. okt. 2025, 00_11_32_1759529595739.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-serif font-semibold text-foreground">
                Prekensamlingen
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <InstallPWA />
              <Button variant="ghost" size="sm" data-testid="button-about" asChild>
                <Link href="/about">Om</Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative h-[300px] md:h-[400px] overflow-hidden mt-[73px]">
        <img
          src={heroBanner}
          alt="Åpen bibel med kors i bakgrunnen"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white text-center px-4">
            Prekensamlingen
          </h2>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Welcome Text */}
        <section className="mb-12">
          <p className="text-lg text-foreground mb-4">
            Velkommen til Prekensamlingen.
          </p>
          <p className="text-base text-muted-foreground mb-4">
            Her finner du et bibliotek av lydopptak fra gudstjenester og samlinger innen den læstadianske bevegelsen. Målet er å gjøre Guds ord lett tilgjengelig, slik at du enkelt kan lytte, søke og finne prekener etter bibeltekst, taler eller sted.
          </p>
          <p className="text-sm text-muted-foreground">
            Les mer under{' '}
            <Link href="/about" className="text-primary hover:text-primary/80 underline underline-offset-4" data-testid="link-about">
              Om Prekensamlingen
            </Link>
            .
          </p>
        </section>

        {/* Search Section */}
        <section className="mb-8">
          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Search className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold text-foreground">Søk i prekener</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Bruk søk og filtre for å finne prekener etter taler, bibeltekst, år eller tolk.
              </p>
              <Button 
                className="w-full" 
                size="lg"
                data-testid="button-search-sermons"
                asChild
              >
                <Link href="/prekener">
                  <Search className="h-4 w-4 mr-2" />
                  Søk og filtrer prekener
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Browse All Card */}
        <section>
          <Card className="bg-accent/10 border-accent/20 hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-serif font-semibold text-foreground mb-2">
                    Bla i alle prekener
                  </h3>
                  <p className="text-base text-muted-foreground mb-4">
                    190 prekener tilgjengelig
                  </p>
                  <Button 
                    variant="default" 
                    size="lg"
                    className="gap-2"
                    data-testid="button-browse-all"
                    asChild
                  >
                    <Link href="/prekener">
                      Se alle prekener
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <BookOpen className="h-16 w-16 text-accent opacity-20" />
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
