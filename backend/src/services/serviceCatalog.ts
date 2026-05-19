import type { ServiceCatalogItem } from "../types/servicos";

const services: ServiceCatalogItem[] = [
  {
    id: "testes-consultas",
    name: "Testes + Consultas",
    description:
      "Pacote completo com acesso aos testes de rastreio, resultado preliminar em PDF e consulta de orientação para interpretar os sinais observados e definir os próximos passos.",
    priceInCents: 45000,
    grantsTestAccess: true,
    grantsConsultationAccess: true,
  },
  {
    id: "apenas-testes",
    name: "Apenas Testes",
    description:
      "Libera o questionário de rastreio, cálculo da pontuação, classificação preliminar e geração do PDF com o resultado. Ideal para quem deseja iniciar pela triagem.",
    priceInCents: 4900,
    grantsTestAccess: true,
    grantsConsultationAccess: false,
  },
  {
    id: "apenas-consulta",
    name: "Apenas Consulta",
    description:
      "Consulta individual para análise dos sinais, orientação clínica e definição dos próximos encaminhamentos. Indicado para quem já possui resultados ou deseja conversar com um profissional.",
    priceInCents: 40000,
    grantsTestAccess: false,
    grantsConsultationAccess: true,
  },
];

export function getDefaultServices(): ServiceCatalogItem[] {
  return services;
}

export function listServices(): ServiceCatalogItem[] {
  return services;
}

export function findServiceById(id: string): ServiceCatalogItem | null {
  return services.find((service) => service.id === id) ?? null;
}

export function getServiceAccessRules(
  id: string,
): Pick<ServiceCatalogItem, "grantsTestAccess" | "grantsConsultationAccess"> {
  const service = findServiceById(id);

  return {
    grantsTestAccess: service?.grantsTestAccess ?? false,
    grantsConsultationAccess: service?.grantsConsultationAccess ?? false,
  };
}

export function formatPriceInCents(priceInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}
