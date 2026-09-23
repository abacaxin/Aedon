import type { PropMap } from "@/lib/editor/types";
import { list, str, headingStyle, SiteLink, SmartImage, textVars } from "./_shared";

type P = { props: PropMap };

export function SectionComposer({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const accent = str(props, "accent", "#D4D4D8");
  const blocks = list(props, "blocks");
  const align = str(props, "align", "left");
  const alignment = align === "center" ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start text-left";

  return (
    <section className="py-16 sm:py-24" style={{ background: bg, ...textVars(textColor) }}>
      <div className={`mx-auto flex max-w-4xl flex-col gap-6 px-4 sm:px-6 ${alignment}`}>
        {blocks.map((block) => {
          const type = block.type || "text";
          if (type === "heading") {
            return <h2 key={block._id} className="max-w-3xl text-4xl font-bold leading-tight text-[color:var(--tc)] sm:text-6xl" style={headingStyle}>{block.title}</h2>;
          }
          if (type === "image") {
            return block.image ? (
              <div key={block._id} className="aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10">
                <SmartImage value={block.image} alt={block.alt || ""} className="h-full w-full" />
              </div>
            ) : null;
          }
          if (type === "button") {
            return (
              <SiteLink
                key={block._id}
                link={block.link}
                className="rounded-full px-5 py-3 text-sm font-medium text-black transition-transform hover:scale-[1.02]"
                style={{ background: accent }}
              >
                {block.label || "Botão"}
              </SiteLink>
            );
          }
          if (type === "divider") return <div key={block._id} className="h-px w-full bg-white/15" />;
          return <p key={block._id} className="max-w-2xl whitespace-pre-line text-base leading-8 text-[color:var(--tc-75)] sm:text-lg">{block.text || block.title}</p>;
        })}
      </div>
    </section>
  );
}
