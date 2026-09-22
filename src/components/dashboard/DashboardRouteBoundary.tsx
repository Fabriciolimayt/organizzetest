import { Component, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default class DashboardRouteBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section role="alert" className="space-y-4 border-t border-border py-8">
        <h1 className="editorial-display text-2xl">Esta página não carregou.</h1>
        <p className="text-sm text-muted-foreground">Podes tentar novamente ou continuar noutra página pelo menu.</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw aria-hidden="true" /> Tentar novamente
        </Button>
      </section>
    );
  }
}
