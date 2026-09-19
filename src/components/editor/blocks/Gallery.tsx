import type { PropMap } from "@/lib/editor/types";
import { str, list, headingStyle, SmartImage, textVars } from "./_shared";

type P = { props: PropMap };

export function GalleryMasonry({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const images = list(props, "images");
  return (
    <section
      className="py-16 sm:py-24 border-t border-white/5"
      style={{ background: bg, ...textVars(textColor) }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          className="text-2xl sm:text-3xl md:text-5xl font-bold text-[color:var(--tc)] text-center mb-10 sm:mb-12"
          style={headingStyle}
        >
          {str(props, "title")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={img._id}
              className={`overflow-hidden rounded-xl border border-white/10 ${i % 3 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`}
            >
              <SmartImage
                value={img.src}
                className="hover:scale-110 transition-transform duration-700"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GalleryEditorial({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const images = list(props, "images");
  const [lead, ...rest] = images;
  return (
    <section className="py-16 sm:py-24" style={{ background: bg, ...textVars(textColor) }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-2xl text-3xl font-bold text-[color:var(--tc)] sm:text-5xl" style={headingStyle}>
            {str(props, "title")}
          </h2>
          <p className="max-w-xs text-sm text-[color:var(--tc-60)]">Uma seleção visual com enquadramentos independentes em cada imagem.</p>
        </div>
        {lead && (
          <div className="grid gap-3 md:grid-cols-[1.45fr_0.9fr]">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 md:aspect-[5/4]">
              <SmartImage value={lead.src} className="transition-transform duration-700 hover:scale-105" />
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              {rest.slice(0, 4).map((img, index) => (
                <div key={img._id} className={`overflow-hidden rounded-2xl border border-white/10 ${index === 0 ? "aspect-[4/3]" : "aspect-square"}`}>
                  <SmartImage value={img.src} className="transition-transform duration-700 hover:scale-105" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function GalleryFilmstrip({ props }: P) {
  const bg = str(props, "bg", "#000000");
  const textColor = str(props, "textColor", "#FFFFFF");
  const images = list(props, "images");
  return (
    <section className="py-16 sm:py-24 overflow-hidden" style={{ background: bg, ...textVars(textColor) }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="mb-8 text-3xl font-bold text-[color:var(--tc)] sm:mb-10 sm:text-5xl" style={headingStyle}>
          {str(props, "title")}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-3 sm:px-6 [scrollbar-width:none]">
        {images.map((img, index) => (
          <div
            key={img._id}
            className={`shrink-0 overflow-hidden rounded-2xl border border-white/10 ${index % 3 === 1 ? "w-[52vw] max-w-[520px] aspect-[4/5]" : "w-[68vw] max-w-[720px] aspect-[16/10]"}`}
          >
            <SmartImage value={img.src} className="transition-transform duration-700 hover:scale-105" />
          </div>
        ))}
      </div>
    </section>
  );
}
