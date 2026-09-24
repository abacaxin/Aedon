import type { PropMap } from "@/lib/editor/types";
import { SiteLink, SmartImage, list } from "./_shared";

export function CustomElements({ props }: { props: PropMap }) {
  const elements = list(props, "customElements");
  if (elements.length === 0) return null;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-8 sm:px-6">
      {elements.map((item) => {
        if (item.type === "image") return <div key={item._id} className="aspect-video overflow-hidden rounded-2xl border border-white/10"><SmartImage value={item.src} alt={item.alt || ""} /></div>;
        if (item.type === "button") return <SiteLink key={item._id} link={item.link} className="inline-flex w-fit rounded-full bg-white px-5 py-3 text-sm font-medium text-black">{item.text || "Botão"}</SiteLink>;
        if (item.type === "divider") return <div key={item._id} className="h-px w-full bg-white/20" />;
        if (item.type === "box") return <div key={item._id} className="min-h-24 rounded-2xl border border-white/15 bg-white/[0.04] p-5 text-sm text-white/75">{item.text || "Container"}</div>;
        return <p key={item._id} className="max-w-2xl text-base leading-7 text-white/75">{item.text || "Escreva aqui"}</p>;
      })}
    </div>
  );
}
