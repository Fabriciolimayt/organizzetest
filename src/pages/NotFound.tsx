import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("404 Warning: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16 text-center">
      <div className="flex max-w-lg flex-col items-center">
        <div className="mb-6 flex size-12 items-center justify-center rounded-md border border-intelligence/35 bg-intelligence-wash text-intelligence">
          <FileQuestion aria-hidden="true" size={20} />
        </div>
        <p className="mb-3 text-label font-semibold uppercase text-intelligence">Erro 404</p>
        <h1 className="editorial-display text-3xl font-semibold text-foreground sm:text-4xl">
          Página não encontrada
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          O endereço <code className="financial-value text-xs text-foreground">{location.pathname}</code> não existe ou foi movido.
        </p>
        <Button asChild variant="outline" className="mt-7 gap-2">
          <Link to="/">
            <ArrowLeft aria-hidden="true" size={16} />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </main>
  );
};

export default NotFound;
