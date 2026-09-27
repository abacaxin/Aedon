/** Page presets are compositions of regular section variants, never special renderers. */
export interface PagePreset {
  id: string;
  name: string;
  description: string;
  sectionIds: string[];
}

export const PAGE_PRESETS: PagePreset[] = [
  {
    id: "landing",
    name: "Landing page",
    description: "Uma página de conversão completa para apresentar uma oferta.",
    sectionIds: ["navbar.modern", "hero.gradient", "features.grid", "testimonials.cards", "cta.banner", "footer.dark"],
  },
  {
    id: "saas",
    name: "SaaS",
    description: "Apresente produto, benefícios, prova social e chamada para ação.",
    sectionIds: ["navbar.minimal", "hero.split", "features.list", "testimonials.cards", "faq.accordion", "cta.banner", "footer.minimal"],
  },
  {
    id: "portfolio",
    name: "Portfólio",
    description: "Uma composição visual para destacar projetos e trabalho autoral.",
    sectionIds: ["navbar.minimal", "hero.gradient", "gallery.editorial", "text.manifesto", "cta.banner", "footer.minimal"],
  },
  {
    id: "agency",
    name: "Agência",
    description: "Apresente serviços, resultados e formas de contato.",
    sectionIds: ["navbar.modern", "hero.split", "features.grid", "gallery.masonry", "testimonials.cards", "cta.banner", "footer.dark"],
  },
  {
    id: "about",
    name: "Sobre",
    description: "Conte a história da marca com conteúdo editorial e destaques.",
    sectionIds: ["navbar.minimal", "hero.gradient", "text.editorial", "features.list", "text.quote", "footer.minimal"],
  },
  {
    id: "contact",
    name: "Contato",
    description: "Uma página simples com apresentação, próximos passos e contato.",
    sectionIds: ["navbar.minimal", "hero.split", "text.manifesto", "cta.banner", "footer.minimal"],
  },
];
