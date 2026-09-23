import type {
  SectionVariant,
  SectionKind,
  SectionInstance,
  PropMap,
  PropValue,
  ListItem,
  FieldSchema,
  LibraryCategory,
} from "./types";
import { uuid } from "./id";
import { NavbarModern, NavbarMinimal } from "@/components/editor/blocks/Navbar";
import { HeroGradient, HeroSplit } from "@/components/editor/blocks/Hero";
import { FeaturesGrid, FeaturesList } from "@/components/editor/blocks/Features";
import { GalleryMasonry, GalleryEditorial, GalleryFilmstrip } from "@/components/editor/blocks/Gallery";
import { TextManifesto, TextEditorial, TextQuote } from "@/components/editor/blocks/Text";
import { SectionComposer } from "@/components/editor/blocks/Composer";
import { TestimonialsCards } from "@/components/editor/blocks/Testimonials";
import { FAQAccordion } from "@/components/editor/blocks/FAQ";
import { CTABanner } from "@/components/editor/blocks/CTA";
import { FooterDark, FooterMinimal } from "@/components/editor/blocks/Footer";
import type { ComponentType } from "react";

export const ICON_OPTIONS = [
  { value: "zap", label: "Raio" },
  { value: "shield", label: "Escudo" },
  { value: "rocket", label: "Foguete" },
  { value: "sparkles", label: "Brilho" },
  { value: "star", label: "Estrela" },
  { value: "heart", label: "Coração" },
  { value: "gauge", label: "Velocímetro" },
  { value: "lock", label: "Cadeado" },
];

/** Build a list default item with a stable _id. */
function li(obj: Record<string, string>): ListItem {
  return { _id: uuid(), ...obj };
}

const COLOR_FIELDS: FieldSchema[] = [
  { key: "bg", label: "Cor de fundo", type: "color" },
  { key: "textColor", label: "Cor do texto", type: "color" },
  { key: "accent", label: "Cor de destaque", type: "color" },
];
const COLOR_DEFAULTS: PropMap = { bg: "#000000", textColor: "#FFFFFF", accent: "#D4D4D8" };

function withColors(v: SectionVariant): SectionVariant {
  return {
    ...v,
    schema: [...v.schema, ...COLOR_FIELDS],
    defaults: { ...COLOR_DEFAULTS, ...v.defaults },
  };
}

const RAW: SectionVariant[] = [
  {
    id: "navbar.modern",
    kind: "navbar",
    name: "Navbar Modern",
    description: "Logo + links + CTA com efeito glass",
    schema: [
      { key: "brand", label: "Nome da marca", type: "text" },
      {
        key: "links",
        label: "Itens do menu",
        type: "list",
        itemLabel: "Link",
        itemSchema: [
          { key: "label", label: "Texto", type: "text" },
          { key: "link", label: "Destino", type: "link" },
        ],
        itemDefaults: { label: "Novo link", link: "" },
        min: 0,
        max: 6,
      },
      { key: "showCta", label: "Mostrar botão CTA", type: "toggle" },
      {
        key: "ctaText",
        label: "Texto do botão",
        type: "text",
        showWhen: { key: "showCta", equals: true },
      },
      {
        key: "ctaLink",
        label: "Destino do botão",
        type: "link",
        showWhen: { key: "showCta", equals: true },
      },
    ],
    defaults: {
      brand: "AEDON",
      links: [
        li({ label: "Produto", link: "" }),
        li({ label: "Preços", link: "" }),
        li({ label: "Contato", link: "" }),
      ],
      showCta: true,
      ctaText: "Começar",
      ctaLink: "",
    },
  },
  {
    id: "navbar.minimal",
    kind: "navbar",
    name: "Navbar Minimal",
    description: "Apenas marca e um link",
    schema: [
      { key: "brand", label: "Nome da marca", type: "text" },
      { key: "ctaText", label: "Texto do link", type: "text" },
      { key: "ctaLink", label: "Destino do link", type: "link" },
    ],
    defaults: { brand: "AEDON", ctaText: "Entrar", ctaLink: "" },
  },
  {
    id: "hero.gradient",
    kind: "hero",
    name: "Hero Gradient",
    description: "Título grande com gradiente e CTA",
    schema: [
      { key: "showEyebrow", label: "Mostrar etiqueta", type: "toggle" },
      {
        key: "eyebrow",
        label: "Etiqueta",
        type: "text",
        showWhen: { key: "showEyebrow", equals: true },
      },
      { key: "title", label: "Título", type: "textarea" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      { key: "cta", label: "Botão principal", type: "text" },
      { key: "ctaLink", label: "Destino do botão", type: "link" },
      { key: "showSecondaryCta", label: "Mostrar botão secundário", type: "toggle" },
      {
        key: "ctaSecondary",
        label: "Botão secundário",
        type: "text",
        showWhen: { key: "showSecondaryCta", equals: true },
      },
      {
        key: "ctaSecondaryLink",
        label: "Destino do secundário",
        type: "link",
        showWhen: { key: "showSecondaryCta", equals: true },
      },
      { key: "showStats", label: "Mostrar estatísticas", type: "toggle" },
      {
        key: "stats",
        label: "Estatísticas",
        type: "list",
        itemLabel: "Estatística",
        itemSchema: [
          { key: "value", label: "Número", type: "text" },
          { key: "label", label: "Rótulo", type: "text" },
        ],
        itemDefaults: { value: "100+", label: "Clientes" },
        min: 0,
        max: 4,
        showWhen: { key: "showStats", equals: true },
      },
    ],
    defaults: {
      showEyebrow: true,
      eyebrow: "Novo · v1.0",
      title: "Construa sites cinematográficos em minutos",
      subtitle: "Combine seções pré-desenhadas e publique com um clique. Sem código, sem limites.",
      cta: "Começar grátis",
      ctaLink: "",
      showSecondaryCta: true,
      ctaSecondary: "Ver demo",
      ctaSecondaryLink: "",
      showStats: false,
      stats: [
        li({ value: "12k+", label: "Sites criados" }),
        li({ value: "99.9%", label: "Uptime" }),
        li({ value: "4.9/5", label: "Avaliação" }),
      ],
    },
  },
  {
    id: "hero.split",
    kind: "hero",
    name: "Hero Split",
    description: "Texto à esquerda, imagem à direita",
    schema: [
      { key: "showBadge", label: "Mostrar selo", type: "toggle" },
      {
        key: "badge",
        label: "Texto do selo",
        type: "text",
        showWhen: { key: "showBadge", equals: true },
      },
      { key: "title", label: "Título", type: "textarea" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      { key: "cta", label: "Botão", type: "text" },
      { key: "ctaLink", label: "Destino do botão", type: "link" },
      { key: "showSecondaryCta", label: "Mostrar botão secundário", type: "toggle" },
      {
        key: "ctaSecondary",
        label: "Botão secundário",
        type: "text",
        showWhen: { key: "showSecondaryCta", equals: true },
      },
      {
        key: "ctaSecondaryLink",
        label: "Destino do secundário",
        type: "link",
        showWhen: { key: "showSecondaryCta", equals: true },
      },
      { key: "showImage", label: "Mostrar imagem", type: "toggle" },
      {
        key: "image",
        label: "URL da imagem",
        type: "image",
        showWhen: { key: "showImage", equals: true },
      },
    ],
    defaults: {
      showBadge: false,
      badge: "Em destaque",
      title: "Design que sangra qualidade",
      subtitle: "Cada seção foi desenhada por profissionais. Você apenas escolhe e edita.",
      cta: "Explorar",
      ctaLink: "",
      showSecondaryCta: false,
      ctaSecondary: "Saiba mais",
      ctaSecondaryLink: "",
      showImage: true,
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200",
    },
  },
  {
    id: "features.grid",
    kind: "features",
    name: "Serviços · Grid",
    description: "Colunas com ícones",
    schema: [
      { key: "title", label: "Título da seção", type: "text" },
      {
        key: "columns",
        label: "Colunas",
        type: "select",
        options: [
          { value: "2", label: "2 colunas" },
          { value: "3", label: "3 colunas" },
          { value: "4", label: "4 colunas" },
        ],
      },
      {
        key: "items",
        label: "Cards",
        type: "list",
        itemLabel: "Card",
        itemSchema: [
          { key: "icon", label: "Ícone", type: "select", options: ICON_OPTIONS },
          { key: "title", label: "Título", type: "text" },
          { key: "desc", label: "Descrição", type: "textarea" },
        ],
        itemDefaults: { icon: "sparkles", title: "Novo recurso", desc: "Descreva este recurso." },
        min: 1,
        max: 8,
      },
    ],
    defaults: {
      title: "Tudo o que você precisa",
      columns: "3",
      items: [
        li({
          icon: "zap",
          title: "Componentes prontos",
          desc: "Mais de 50 seções cuidadosamente projetadas.",
        }),
        li({
          icon: "shield",
          title: "Preview em tempo real",
          desc: "Edite e veja o resultado instantaneamente.",
        }),
        li({
          icon: "rocket",
          title: "Publicação em um clique",
          desc: "SSL, CDN e domínio próprio já incluídos.",
        }),
      ],
    },
  },
  {
    id: "features.list",
    kind: "features",
    name: "Serviços · Lista",
    description: "Lista vertical com bullets",
    schema: [
      { key: "title", label: "Título da seção", type: "text" },
      {
        key: "items",
        label: "Itens",
        type: "list",
        itemLabel: "Item",
        itemSchema: [{ key: "text", label: "Texto", type: "text" }],
        itemDefaults: { text: "Novo item" },
        min: 1,
        max: 8,
      },
    ],
    defaults: {
      title: "Por que escolher",
      items: [
        li({ text: "Design system consistente" }),
        li({ text: "Performance A+ em Lighthouse" }),
        li({ text: "Totalmente responsivo" }),
        li({ text: "SEO otimizado por padrão" }),
      ],
    },
  },
  {
    id: "text.manifesto",
    kind: "features",
    name: "Texto Manifesto",
    description: "Título amplo com texto centralizado",
    schema: [
      { key: "eyebrow", label: "Etiqueta", type: "text" },
      { key: "title", label: "Título", type: "textarea" },
      { key: "body", label: "Texto", type: "textarea" },
    ],
    defaults: {
      eyebrow: "Nossa visão",
      title: "Uma ideia clara muda tudo.",
      body: "Use este bloco para dar ritmo à página e comunicar uma mensagem que merece espaço.",
    },
  },
  {
    id: "text.editorial",
    kind: "features",
    name: "Texto Editorial",
    description: "Composição em duas colunas para narrativas",
    schema: [
      { key: "eyebrow", label: "Etiqueta", type: "text" },
      { key: "title", label: "Título", type: "textarea" },
      { key: "body", label: "Texto", type: "textarea" },
      { key: "caption", label: "Assinatura", type: "text" },
    ],
    defaults: {
      eyebrow: "Por trás do processo",
      title: "Detalhes que fazem a marca permanecer.",
      body: "Uma coluna para a ideia e outra para desenvolvê-la. Essa composição cria uma pausa elegante entre imagens, produtos e chamadas para ação.",
      caption: "Aedon — criação com intenção",
    },
  },
  {
    id: "text.quote",
    kind: "features",
    name: "Citação em Destaque",
    description: "Frase marcante com autoria",
    schema: [
      { key: "quote", label: "Citação", type: "textarea" },
      { key: "author", label: "Autoria", type: "text" },
    ],
    defaults: {
      quote: "O melhor design é aquele que faz a próxima ação parecer inevitável.",
      author: "Aedon Studio",
    },
  },
  {
    id: "layout.composer",
    kind: "features",
    name: "Seção Livre",
    description: "Monte uma seção com texto, imagem, botão e divisor",
    schema: [
      {
        key: "align",
        label: "Alinhamento",
        type: "select",
        options: [
          { value: "left", label: "Esquerda" },
          { value: "center", label: "Centro" },
          { value: "right", label: "Direita" },
        ],
      },
      {
        key: "blocks",
        label: "Blocos da seção",
        type: "list",
        itemLabel: "Bloco",
        itemSchema: [
          {
            key: "type",
            label: "Tipo",
            type: "select",
            options: [
              { value: "heading", label: "Título" },
              { value: "text", label: "Texto" },
              { value: "image", label: "Imagem" },
              { value: "button", label: "Botão" },
              { value: "divider", label: "Divisor" },
            ],
          },
          { key: "title", label: "Título", type: "textarea" },
          { key: "text", label: "Texto", type: "textarea" },
          { key: "image", label: "Imagem", type: "image" },
          { key: "alt", label: "Descrição da imagem", type: "text" },
          { key: "label", label: "Texto do botão", type: "text" },
          { key: "link", label: "Destino do botão", type: "link" },
        ],
        itemDefaults: { type: "text", title: "Novo título", text: "Escreva algo que importe.", image: "", alt: "", label: "Conhecer", link: "" },
        min: 1,
        max: 18,
      },
    ],
    defaults: {
      align: "left",
      blocks: [
        li({ type: "heading", title: "Uma seção com a sua voz", text: "", image: "", alt: "", label: "", link: "" }),
        li({ type: "text", title: "", text: "Misture textos, imagens, botões e divisores. Cada bloco pode ser rearranjado sem precisar de código.", image: "", alt: "", label: "", link: "" }),
        li({ type: "button", title: "", text: "", image: "", alt: "", label: "Começar agora", link: "" }),
      ],
    },
  },
  {
    id: "gallery.masonry",
    kind: "gallery",
    name: "Galeria",
    description: "Grid de imagens estilo masonry",
    schema: [
      { key: "title", label: "Título", type: "text" },
      {
        key: "images",
        label: "Imagens",
        type: "list",
        itemLabel: "Imagem",
        itemSchema: [{ key: "src", label: "URL", type: "image" }],
        itemDefaults: { src: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800" },
        min: 1,
        max: 12,
      },
    ],
    defaults: {
      title: "Nosso trabalho",
      images: [
        li({ src: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800" }),
        li({ src: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=800" }),
        li({ src: "https://images.unsplash.com/photo-1614852206738-c1706ecebbc4?w=800" }),
        li({ src: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800" }),
      ],
    },
  },
  {
    id: "gallery.editorial",
    kind: "gallery",
    name: "Galeria Editorial",
    description: "Foto principal com composições laterais",
    schema: [
      { key: "title", label: "Título", type: "text" },
      {
        key: "images",
        label: "Fotos",
        type: "list",
        itemLabel: "Foto",
        itemSchema: [{ key: "src", label: "Imagem", type: "image" }],
        itemDefaults: { src: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200" },
        min: 1,
        max: 8,
      },
    ],
    defaults: {
      title: "Pontos de vista",
      images: [
        li({ src: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200" }),
        li({ src: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=900" }),
        li({ src: "https://images.unsplash.com/photo-1614852206738-c1706ecebbc4?w=900" }),
        li({ src: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=900" }),
      ],
    },
  },
  {
    id: "gallery.filmstrip",
    kind: "gallery",
    name: "Galeria em Filme",
    description: "Sequência horizontal com formatos alternados",
    schema: [
      { key: "title", label: "Título", type: "text" },
      {
        key: "images",
        label: "Fotos",
        type: "list",
        itemLabel: "Foto",
        itemSchema: [{ key: "src", label: "Imagem", type: "image" }],
        itemDefaults: { src: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200" },
        min: 1,
        max: 10,
      },
    ],
    defaults: {
      title: "Em movimento",
      images: [
        li({ src: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200" }),
        li({ src: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200" }),
        li({ src: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=1200" }),
        li({ src: "https://images.unsplash.com/photo-1614852206738-c1706ecebbc4?w=1200" }),
      ],
    },
  },
  {
    id: "testimonials.cards",
    kind: "testimonials",
    name: "Depoimentos",
    description: "Cards com quote e autor",
    schema: [
      { key: "title", label: "Título", type: "text" },
      {
        key: "items",
        label: "Depoimentos",
        type: "list",
        itemLabel: "Depoimento",
        itemSchema: [
          { key: "quote", label: "Citação", type: "textarea" },
          { key: "author", label: "Autor", type: "text" },
        ],
        itemDefaults: { quote: "Nova citação de cliente.", author: "Nome · Cargo" },
        min: 1,
        max: 9,
      },
    ],
    defaults: {
      title: "O que dizem",
      items: [
        li({ quote: "Publiquei meu site em 12 minutos. Absurdo.", author: "Marina · Designer" }),
        li({ quote: "Parece que contratei uma agência inteira.", author: "Rafael · Fundador" }),
        li({ quote: "A ferramenta mais afiada que já usei.", author: "Julia · Product" }),
      ],
    },
  },
  {
    id: "faq.accordion",
    kind: "faq",
    name: "FAQ",
    description: "Perguntas frequentes em acordeão",
    schema: [
      { key: "title", label: "Título", type: "text" },
      {
        key: "items",
        label: "Perguntas",
        type: "list",
        itemLabel: "Pergunta",
        itemSchema: [
          { key: "q", label: "Pergunta", type: "text" },
          { key: "a", label: "Resposta", type: "textarea" },
        ],
        itemDefaults: { q: "Nova pergunta?", a: "Resposta." },
        min: 1,
        max: 12,
      },
    ],
    defaults: {
      title: "Perguntas frequentes",
      items: [
        li({
          q: "Preciso saber programar?",
          a: "Não. Todas as edições são feitas em formulários simples.",
        }),
        li({
          q: "Posso usar meu domínio?",
          a: "Sim, conecte qualquer domínio com SSL automático.",
        }),
        li({
          q: "Como funciona a exportação?",
          a: "Você pode exportar como HTML, React, Next.js ou Astro.",
        }),
      ],
    },
  },
  {
    id: "cta.banner",
    kind: "cta",
    name: "CTA Banner",
    description: "Chamada final com botão",
    schema: [
      { key: "title", label: "Título", type: "textarea" },
      { key: "showSubtitle", label: "Mostrar subtítulo", type: "toggle" },
      {
        key: "subtitle",
        label: "Subtítulo",
        type: "textarea",
        showWhen: { key: "showSubtitle", equals: true },
      },
      { key: "cta", label: "Botão", type: "text" },
      { key: "ctaLink", label: "Destino do botão", type: "link" },
    ],
    defaults: {
      title: "Pronto para lançar?",
      showSubtitle: false,
      subtitle: "Comece agora, é grátis.",
      cta: "Começar agora",
      ctaLink: "",
    },
  },
  {
    id: "footer.dark",
    kind: "footer",
    name: "Footer Dark",
    description: "Footer completo com colunas",
    schema: [
      { key: "brand", label: "Marca", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
      {
        key: "links",
        label: "Links",
        type: "list",
        itemLabel: "Link",
        itemSchema: [
          { key: "label", label: "Texto", type: "text" },
          { key: "link", label: "Destino", type: "link" },
        ],
        itemDefaults: { label: "Link", link: "" },
        min: 0,
        max: 8,
      },
      { key: "copyright", label: "Copyright", type: "text" },
    ],
    defaults: {
      brand: "AEDON",
      tagline: "Sites que impressionam.",
      links: [
        li({ label: "Produto", link: "" }),
        li({ label: "Preços", link: "" }),
        li({ label: "Contato", link: "" }),
      ],
      copyright: "© 2026 Aedon. Todos os direitos reservados.",
    },
  },
  {
    id: "footer.minimal",
    kind: "footer",
    name: "Footer Minimal",
    description: "Uma linha centralizada",
    schema: [{ key: "copyright", label: "Copyright", type: "text" }],
    defaults: { copyright: "© 2026 Aedon" },
  },
];

const CATEGORY_BY_KIND: Record<SectionKind, LibraryCategory> = {
  navbar: "Header",
  hero: "Hero",
  features: "Corpo",
  gallery: "Corpo",
  testimonials: "Corpo",
  faq: "Corpo",
  cta: "Conversão",
  footer: "Footer",
};

export const CATEGORY_ORDER: LibraryCategory[] = ["Header", "Hero", "Corpo", "Conversão", "Footer"];

/** Variants flagged as premium (shown with a badge; access gating is server-side, #7). */
const PREMIUM_IDS = new Set<string>(["hero.split", "gallery.masonry", "gallery.editorial", "footer.dark"]);

export const VARIANTS: SectionVariant[] = RAW.map((v) =>
  withColors({
    ...v,
    category: CATEGORY_BY_KIND[v.kind],
    premium: PREMIUM_IDS.has(v.id),
  }),
);

export const RENDERERS: Record<string, ComponentType<{ props: PropMap }>> = {
  "navbar.modern": NavbarModern,
  "navbar.minimal": NavbarMinimal,
  "hero.gradient": HeroGradient,
  "hero.split": HeroSplit,
  "features.grid": FeaturesGrid,
  "features.list": FeaturesList,
  "text.manifesto": TextManifesto,
  "text.editorial": TextEditorial,
  "text.quote": TextQuote,
  "layout.composer": SectionComposer,
  "gallery.masonry": GalleryMasonry,
  "gallery.editorial": GalleryEditorial,
  "gallery.filmstrip": GalleryFilmstrip,
  "testimonials.cards": TestimonialsCards,
  "faq.accordion": FAQAccordion,
  "cta.banner": CTABanner,
  "footer.dark": FooterDark,
  "footer.minimal": FooterMinimal,
};

export function getVariant(id: string): SectionVariant | undefined {
  return VARIANTS.find((v) => v.id === id);
}

export function variantsByKind(): Record<SectionKind, SectionVariant[]> {
  const out = {} as Record<SectionKind, SectionVariant[]>;
  for (const v of VARIANTS) {
    (out[v.kind] ||= []).push(v);
  }
  return out;
}

/** Deep-clone a prop value, regenerating list item ids so instances stay independent. */
function cloneProp(value: PropValue): PropValue {
  if (Array.isArray(value)) {
    return value.map((item) => ({ ...item, _id: uuid() }));
  }
  return value;
}

export function cloneProps(props: PropMap): PropMap {
  const out: PropMap = {};
  for (const [k, v] of Object.entries(props)) out[k] = cloneProp(v);
  return out;
}

export function createInstance(variantId: string): SectionInstance {
  const v = getVariant(variantId)!;
  return {
    id: uuid(),
    variantId,
    props: cloneProps(v.defaults),
  };
}
