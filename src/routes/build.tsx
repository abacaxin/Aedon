import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { AppRoot } from "@/components/editor/AppRoot";

export const Route = createFileRoute("/build")({
  head: () => ({
    meta: [
      { title: "Aedon — Editor" },
      {
        name: "description",
        content: "Monte seu site combinando seções prontas, com preview em tempo real.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div className="h-screen w-screen bg-black" />}>
      <AppRoot />
    </ClientOnly>
  );
}
