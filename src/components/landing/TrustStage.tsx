import { FileLock2, KeyRound, ScanLine, UsersRound } from "lucide-react";

import LandingScene from "./LandingScene";
import { getLandingCopy, type PublicLocale } from "./landingCopy";
import ProductSurface from "./ProductSurface";
import PixelReveal from "./PixelReveal";

export type TrustStageProps = { locale?: PublicLocale };

// Evidence: space membership/storage policies in create_app_v2.sql, bridge
// normalization in _shared/whatsapp-ingest.ts, and DashboardLayout's account menu.
const trustCopy = {
  "pt-PT": [
    { Icon: UsersRound, title: "Espaços financeiros privados", description: "O acesso aos dados de um espaço depende da pertença a esse espaço. Proprietários e administradores gerem os convites e as funções dos membros.", field: "Acesso ao espaço", value: "Membros autorizados" },
    { Icon: FileLock2, title: "Recibos privados", description: "As imagens recebidas pelo WhatsApp ficam em armazenamento privado. A leitura exige uma conta autenticada e pertença ao espaço correspondente.", field: "Imagens recebidas", value: "Armazenamento privado" },
    { Icon: ScanLine, title: "Privacidade nos detalhes", description: "O código e a imagem do QR do WhatsApp ficam ocultos nos diagnósticos de ligação.", field: "Código e imagem do QR", value: "Ocultos nos diagnósticos" },
    { Icon: KeyRound, title: "Controlo da conta", description: "O menu identifica a conta e permite gerir a assinatura ou terminar sessão.", field: "Menu da conta", value: "Gerir assinatura / Terminar sessão" },
  ],
  "pt-BR": [
    { Icon: UsersRound, title: "Espaços financeiros privados", description: "O acesso aos dados de um espaço depende de fazer parte dele. Proprietários e administradores gerenciam os convites e as funções dos membros.", field: "Acesso ao espaço", value: "Membros autorizados" },
    { Icon: FileLock2, title: "Comprovantes privados", description: "As imagens recebidas pelo WhatsApp ficam em armazenamento privado. A leitura exige uma conta autenticada e participação no espaço correspondente.", field: "Imagens recebidas", value: "Armazenamento privado" },
    { Icon: ScanLine, title: "Privacidade nos detalhes", description: "O código e a imagem do QR do WhatsApp ficam ocultos nos diagnósticos de conexão.", field: "Código e imagem do QR", value: "Ocultos nos diagnósticos" },
    { Icon: KeyRound, title: "Controle da conta", description: "O menu identifica a conta e permite gerenciar a assinatura ou sair.", field: "Menu da conta", value: "Gerenciar assinatura / Sair da conta" },
  ],
};

const TrustStage = ({ locale = "pt-PT" }: TrustStageProps) => {
  const copy = getLandingCopy(locale).scenes.trust;

  return (
    <LandingScene
      id="trust"
      scene="trust"
      labelledBy="trust-title"
      className="reference-trust"
    >
      <div data-motion="trust-heading" className="reference-heading">
        <p className="public-label text-intelligence">{copy.eyebrow}</p>
        <PixelReveal as="h2" id="trust-title" text={copy.title} />
        <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">{copy.description}</p>
      </div>

      <div data-motion="trust-stage" className="mx-auto mt-12 min-w-0 max-w-5xl sm:mt-16">
        <ProductSurface className="min-w-0 overflow-hidden [overflow-wrap:anywhere]">
          <div className="divide-y divide-border">
            {trustCopy[locale].map(({ Icon, title, description, field, value }, index) => (
              <section key={title} aria-labelledby={`trust-evidence-${index}`} data-motion="trust-evidence" className="grid min-w-0 gap-5 px-5 py-6 sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-intelligence" aria-hidden="true" />
                    <h3 id={`trust-evidence-${index}`} className="text-base font-semibold">{title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
                <dl className="min-w-0 self-center border-l border-border pl-5">
                  <dt className="text-xs text-muted-foreground">{field}</dt>
                  <dd className="mt-2 text-sm font-medium text-foreground">{value}</dd>
                </dl>
              </section>
            ))}
          </div>
        </ProductSurface>
      </div>
    </LandingScene>
  );
};

export default TrustStage;
