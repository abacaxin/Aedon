import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { ProjectsDashboard } from "@/components/projects/ProjectsDashboard";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [{ title: "Aedon — Meus projetos" }],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div className="h-screen w-screen bg-black" />}>
      <ProjectsDashboard />
    </ClientOnly>
  );
}
