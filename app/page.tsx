import ModsList from "@/components/mods-list"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="ADOMODS Logo" width={60} height={60} className="object-contain" />
              <div>
                <h1 className="text-3xl font-bold text-balance">
                  <span className="text-primary">ADO</span>MODS
                </h1>
                <p className="text-sm text-muted-foreground mt-1">A Dance of Fire and Ice Mods</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ModsList />
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Data from{" "}
            <a
              href="https://bot.adofai.gg/api/mods/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              bot.adofai.gg
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
