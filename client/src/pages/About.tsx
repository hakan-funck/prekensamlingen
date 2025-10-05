import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with back button */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Tilbake til prekener
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Om Prekensamlingen</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-4xl mx-auto px-4 py-8 pt-20">
        <div className="space-y-8">
          
          {/* Introduction */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Om Prekensamlingen</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong className="text-foreground">Prekensamlingen</strong> er en web-app som er laget for å gjøre Guds ord lett tilgjengelig for alle som ønsker å lytte. Samlingen består av lydopptak av prekener fra gudstjenester, samlinger og stevner.
                </p>
                <p>
                  Talene har ulike kilder, og mange av dem er hentet fra private opptak, CD-er, minnepinner eller publiserte opptak fra forsamlinger.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Funksjonalitet */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Funksjonalitet</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  For å gjøre det enklere å finne det du leter etter, er appen utstyrt med flere filterfunksjoner. Du kan filtrere taler basert på bibelbøker, talere og steder. I tillegg er det for hver preken en lenke til den tilhørende bibelteksten. Denne lenken fører deg til den norske 1930-oversettelsen på bible.com, hvor du selv kan velge en annen oversettelse hvis du ønsker det.
                </p>

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-foreground">Installér som app (PWA)</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Android (Chrome/Edge/Brave)</h4>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Åpne Prekensamlingen i nettleseren.</li>
                        <li>Trykk på Meny (⋮).</li>
                        <li>Velg Installer app / Legg til på startskjermen og bekreft.</li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-2">iOS (Safari)</h4>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Åpne Prekensamlingen i Safari.</li>
                        <li>Trykk Del-knappen (firkant med pil opp).</li>
                        <li>Velg Legg til på Hjem-skjermen og trykk Legg til.</li>
                      </ol>
                    </div>

                    <p className="text-sm italic">
                      Tips: App-ikonet vises på hjemskjermen. Oppdateringer skjer automatisk når du åpner appen med nett. Hvis du ikke ser «Installer»/«Legg til», prøv å laste siden på nytt.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Læstadiansk bakgrunn */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Læstadiansk bakgrunn</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Alle prekenene i denne samlingen stammer fra samme læstadianske retning. Denne bevegelsen er kjent under ulike navn, avhengig av land og språk:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>I Norge: <strong className="text-foreground">småførstefødte</strong> eller <strong className="text-foreground">Altaretningen</strong></li>
                  <li>I Sverige: <strong className="text-foreground">Östlaestadianismen</strong></li>
                  <li>I Finland: <strong className="text-foreground">Pikku-esikoiset</strong>, som inkluderer arrangementer i regi av <strong className="text-foreground">LFF</strong> og <strong className="text-foreground">Rauhan Sana</strong></li>
                  <li>I USA: <strong className="text-foreground">Apostolic Lutheran Church (ALC)</strong></li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Om initiativtakeren */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Om initiativtakeren</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Dette er et privat initiativ fra <strong className="text-foreground">Håkan Funck</strong>. Jeg er oppvokst i Sverige og har tilhørt den læstadianske bevegelsen hele mitt liv. I dag bor jeg i Alta og tilhører Elvebakken Læstadianske menighet.
                </p>
                <p>
                  Har du spørsmål eller kommentarer, kan du kontakte meg på{' '}
                  <a 
                    href="mailto:hakan.funck@gmail.com" 
                    className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-4"
                    data-testid="link-email-contact"
                  >
                    <Mail className="h-4 w-4" />
                    e-post
                  </a>
                  .
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Formål */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Formål</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Hensikten med Prekensamlingen er å gjøre det enklere å finne og lytte til Guds ord. Det er mitt ønske at du, med bønn i hjertet, kan lytte til talene og la Guds ord tale til deg personlig.
                </p>
                
                {/* Bible verse quote */}
                <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded-r-md">
                  <p className="text-foreground font-medium italic">
                    "Ditt ord er en lykte for min fot og et lys for min sti."
                  </p>
                  <cite className="text-sm text-muted-foreground">— Sal. 119,105</cite>
                </blockquote>
                
                <p className="text-foreground font-medium">
                  Med ønske om Guds velsignelse til alle som lytter til Guds ord!
                </p>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}