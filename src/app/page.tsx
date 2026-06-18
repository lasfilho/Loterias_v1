import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Database,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/modules/shared/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-mesh">
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Loteria Analytics</span>
          </div>
          <Link href="/dashboard">
            <Button size="sm">Acessar Plataforma</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary mb-8">
            <Sparkles className="h-3 w-3" />
            Análise Estatística Profissional
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            Inteligência de dados para{" "}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Lotofácil, Mega-Sena e Quina
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Plataforma modular para coleta, armazenamento e análise estatística
            de resultados oficiais. Dashboards interativos, indicadores
            avançados e geração assistida de palpites.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Explorar Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/importacao">
              <Button size="lg" variant="outline" className="gap-2">
                <Database className="h-4 w-4" /> Importar Dados
              </Button>
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Database,
              title: "Coleta & ETL",
              desc: "Sincronização automática com API oficial da Caixa",
            },
            {
              icon: TrendingUp,
              title: "Análises Avançadas",
              desc: "Frequência, atrasos, pares, tendências e padrões",
            },
            {
              icon: Sparkles,
              title: "Palpites Assistidos",
              desc: "Geração por modelos estatísticos configuráveis",
            },
            {
              icon: Shield,
              title: "Transparência",
              desc: "Sem promessas de previsão — dados históricos reais",
            },
          ].map((f) => (
            <div key={f.title} className="glass rounded-xl p-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="glass rounded-2xl p-8 border border-amber-500/20">
            <p className="text-sm text-amber-300 font-medium mb-2">
              Aviso Legal
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {DISCLAIMER}
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Loteria Analytics &copy; {new Date().getFullYear()} — Ferramenta de estudo estatístico
      </footer>
    </div>
  );
}
