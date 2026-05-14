import type { ServiceCatalogItem } from "../types/servicos";

const services: ServiceCatalogItem[] = [
  {
    id: "testes-consultas",
    name: "Testes + Consultas",
    description:
      "Pacote completo para realizar testes de rastreio e receber acompanhamento em consulta.",
    priceInCents: 45000,
  },
  {
    id: "apenas-testes",
    name: "Apenas Testes",
    description: "Acesso aos testes de rastreio.",
    priceInCents: 4900,
  },
  {
    id: "apenas-consulta",
    name: "Apenas Consulta",
    description: "Consulta individual para analise de resultados e orientacao.",
    priceInCents: 40000,
  },
];

export function listServices(): ServiceCatalogItem[] {
  return services;
}

export function findServiceById(id: string): ServiceCatalogItem | null {
  return services.find((service) => service.id === id) ?? null;
}

export function formatPriceInCents(priceInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceInCents / 100);
}
