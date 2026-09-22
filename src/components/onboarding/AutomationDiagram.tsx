import { CalendarCheck2, MessageCircle, ScanText } from "lucide-react";

type AutomationDiagramProps = {
  sourceLabel?: string;
  resultLabel?: string;
};

const AutomationDiagram = ({
  sourceLabel = "Despesa recebida",
  resultLabel = "No mês certo",
}: AutomationDiagramProps) => {
  const stages = [
    {
      label: "WhatsApp",
      detail: sourceLabel,
      icon: MessageCircle,
    },
    {
      label: "Organizze",
      detail: "Interpreta os dados",
      icon: ScanText,
    },
    {
      label: "Categorizado",
      detail: resultLabel,
      icon: CalendarCheck2,
    },
  ];

  return (
    <section aria-labelledby="automation-title" className="border-y border-border py-1">
      <h2 id="automation-title" className="sr-only">
        Como uma despesa é organizada
      </h2>
      <ol className="grid sm:grid-cols-3">
        {stages.map(({ label, detail, icon: Icon }, index) => (
          <li
            key={label}
            className="relative flex min-h-24 items-center gap-4 border-b border-border px-1 py-5 last:border-b-0 sm:min-h-32 sm:flex-col sm:items-start sm:justify-center sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary">
              <Icon size={19} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="font-mono text-label uppercase text-muted-foreground">
                0{index + 1}
              </span>
              <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default AutomationDiagram;
