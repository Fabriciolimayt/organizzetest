export type PublicLocale = "pt-PT" | "pt-BR";

export type SceneId =
  | "prelude"
  | "promise"
  | "month"
  | "sources"
  | "whatsapp"
  | "available"
  | "future"
  | "planning"
  | "trust"
  | "plans"
  | "signature";

export type SceneCopy = {
  eyebrow: string;
  title: string;
  description: string;
};

export type LandingCopy = {
  header: { method: string; whatsapp: string; plans: string; signIn: string };
  primaryCta: string;
  secondaryCta: string;
  promiseTitle: string;
  scenes: Record<SceneId, SceneCopy>;
  sourceLabels: {
    manual: string;
    receipt: string;
    recurring: string;
    shared: string;
    whatsapp: string;
  };
  planNames: { pro: string; premium: string };
  finalStatement: string;
};

const publicCopy: Record<PublicLocale, LandingCopy> = {
  "pt-PT": {
    header: {
      method: "Como funciona",
      whatsapp: "WhatsApp",
      plans: "Planos",
      signIn: "Entrar",
    },
    primaryCta: "Começar 15 dias grátis",
    secondaryCta: "Ver como funciona",
    promiseTitle: "Tudo o que gastas, organizado. O que podes gastar, claro.",
    scenes: {
      prelude: {
        eyebrow: "O teu mês, num só lugar",
        title: "Decisões financeiras com o contexto à vista.",
        description:
          "Vê o valor disponível, o ritmo das despesas, a distribuição por categoria e os próximos compromissos numa leitura contínua.",
      },
      promise: {
        eyebrow: "Clareza antes da próxima despesa",
        title: "Tudo o que gastas, organizado. O que podes gastar, claro.",
        description:
          "A Organizze reúne os movimentos que registas e explica o mês em linguagem simples, para decidires com mais contexto.",
      },
      month: {
        eyebrow: "Um mês completo",
        title: "Do resumo ao detalhe, sem perder o fio.",
        description:
          "Despesas, rendimentos, compromissos e objetivos. O mesmo mês, com cada detalhe no seu lugar.",
      },
      sources: {
        eyebrow: "Uma contabilidade organizada",
        title: "Cada origem converge no mesmo mês.",
        description:
          "Registos manuais, recibos, regras recorrentes, espaços partilhados e WhatsApp alimentam uma única leitura de despesas e valor disponível.",
      },
      whatsapp: {
        eyebrow: "Da mensagem à decisão",
        title: "Envia a despesa. Confirma o que foi interpretado.",
        description:
          "Uma mensagem ou recibo torna-se numa proposta de categoria e transação; depois de confirmada, o valor disponível é atualizado.",
      },
      available: {
        eyebrow: "Disponível para gastar",
        title: "Um valor explicado, não um número isolado.",
        description:
          "Rendimentos esperados, custos comprometidos, despesas variáveis e objetivos reservados mostram como o valor é calculado com os dados registados.",
      },
      future: {
        eyebrow: "Próximos compromissos",
        title: "Vê o que vem a seguir antes de decidir.",
        description:
          "Subscrições, despesas recorrentes e limites de categoria distinguem situações dentro do limite, próximas do limite e ultrapassadas.",
      },
      planning: {
        eyebrow: "Planear em conjunto",
        title: "Orçamentos, objetivos e espaços ligados ao mesmo plano.",
        description:
          "Compara cenários, reserva valores para objetivos e acompanha decisões partilhadas sem separar o planeamento do mês real.",
      },
      trust: {
        eyebrow: "Fronteiras claras",
        title: "As tuas finanças. O teu espaço.",
        description:
          "Os recibos ficam em armazenamento privado, o acesso aos espaços depende dos membros que autorizas e a titularidade da conta é explícita.",
      },
      plans: {
        eyebrow: "Escolhe o teu plano",
        title: "Duas formas de acompanhar o mês com clareza.",
        description:
          "Experimenta durante 15 dias. Depois, escolhe o acompanhamento que faz sentido para ti.",
      },
      signature: {
        eyebrow: "O próximo mês começa agora",
        title: "É tempo de ver o mês antes que ele aconteça.",
        description:
          "Reúne o que já aconteceu e os compromissos conhecidos para entrares no próximo mês com uma visão mais completa.",
      },
    },
    sourceLabels: {
      manual: "Registo manual",
      receipt: "Recibo",
      recurring: "Regra recorrente",
      shared: "Espaço partilhado",
      whatsapp: "WhatsApp",
    },
    planNames: { pro: "Pro", premium: "Premium" },
    finalStatement: "É tempo de ver o mês antes que ele aconteça.",
  },
  "pt-BR": {
    header: {
      method: "Como funciona",
      whatsapp: "WhatsApp",
      plans: "Planos",
      signIn: "Entrar",
    },
    primaryCta: "Começar 15 dias grátis",
    secondaryCta: "Ver como funciona",
    promiseTitle: "Tudo o que você gasta, organizado. O que pode gastar, claro.",
    scenes: {
      prelude: {
        eyebrow: "Seu mês, em um só lugar",
        title: "Decisões financeiras com o contexto à vista.",
        description:
          "Veja o valor disponível, o ritmo dos gastos, a distribuição por categoria e os próximos compromissos em uma leitura contínua.",
      },
      promise: {
        eyebrow: "Clareza antes do próximo gasto",
        title: "Tudo o que você gasta, organizado. O que pode gastar, claro.",
        description:
          "A Organizze reúne os movimentos que você registra e explica o mês em linguagem simples, para decidir com mais contexto.",
      },
      month: {
        eyebrow: "Um mês completo",
        title: "Do resumo ao detalhe, sem perder o fio.",
        description:
          "Gastos, receitas, compromissos e objetivos. O mesmo mês, com cada detalhe no seu lugar.",
      },
      sources: {
        eyebrow: "Um registro organizado",
        title: "Cada origem converge no mesmo mês.",
        description:
          "Lançamentos manuais, comprovantes, regras recorrentes, espaços compartilhados e WhatsApp alimentam uma única leitura de gastos e valor disponível.",
      },
      whatsapp: {
        eyebrow: "Da mensagem à decisão",
        title: "Envie o gasto. Confirme o que foi interpretado.",
        description:
          "Uma mensagem ou comprovante vira uma proposta de categoria e transação; depois da confirmação, o valor disponível é atualizado.",
      },
      available: {
        eyebrow: "Disponível para gastar",
        title: "Um valor explicado, não um número isolado.",
        description:
          "Rendas esperadas, custos comprometidos, gastos variáveis e objetivos reservados mostram como o valor é calculado com os dados registrados.",
      },
      future: {
        eyebrow: "Próximos compromissos",
        title: "Veja o que vem a seguir antes de decidir.",
        description:
          "Assinaturas, gastos recorrentes e limites por categoria distinguem situações dentro do limite, próximas do limite e excedidas.",
      },
      planning: {
        eyebrow: "Planejar em conjunto",
        title: "Orçamentos, objetivos e espaços ligados ao mesmo plano.",
        description:
          "Compare cenários, reserve valores para objetivos e acompanhe decisões compartilhadas sem separar o planejamento do mês real.",
      },
      trust: {
        eyebrow: "Limites claros",
        title: "Suas finanças. Seu espaço.",
        description:
          "Os comprovantes ficam em armazenamento privado, o acesso aos espaços depende dos membros autorizados e a titularidade da conta é explícita.",
      },
      plans: {
        eyebrow: "Escolha seu plano",
        title: "Duas formas de acompanhar o mês com clareza.",
        description:
          "Experimente durante 15 dias. Depois, escolha o acompanhamento que faz sentido para você.",
      },
      signature: {
        eyebrow: "O próximo mês começa agora",
        title: "É hora de ver o mês antes que ele aconteça.",
        description:
          "Reúna o que já aconteceu e os compromissos conhecidos para entrar no próximo mês com uma visão mais completa.",
      },
    },
    sourceLabels: {
      manual: "Lançamento manual",
      receipt: "Comprovante",
      recurring: "Regra recorrente",
      shared: "Espaço compartilhado",
      whatsapp: "WhatsApp",
    },
    planNames: { pro: "Pro", premium: "Premium" },
    finalStatement: "É hora de ver o mês antes que ele aconteça.",
  },
};

export const resolvePublicLocale = (
  stored?: string | null,
  browser = "pt-PT",
): PublicLocale => {
  if (stored === "pt-BR" || stored === "pt-PT") return stored;
  return browser.toLowerCase().startsWith("pt-br") ? "pt-BR" : "pt-PT";
};

export const getLandingCopy = (locale: PublicLocale): LandingCopy =>
  publicCopy[locale];
