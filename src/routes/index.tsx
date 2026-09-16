import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/landing/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aedon — Construtor visual de sites" },
      {
        name: "description",
        content:
          "Crie sites profissionais em minutos combinando seções pré-desenhadas. Editor visual com preview em tempo real.",
      },
      { property: "og:title", content: "Aedon — Construtor visual de sites" },
      {
        property: "og:description",
        content: "Editor de sites baseado em componentes premium. Sem código.",
      },
    ],
  }),
  component: Landing,
});
