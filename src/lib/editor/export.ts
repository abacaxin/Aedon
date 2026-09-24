import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import type { ProjectState } from "./types";
import { RENDERERS } from "./sections";
import { activeFonts, googleFontsHref, typographyVars } from "./typography";
import { decodeLink, resolveHref, sectionAnchorId } from "./links";
import { LinkProvider, type LinkResolver } from "@/components/editor/blocks/_link";
import { CustomElements } from "@/components/editor/blocks/CustomElements";
import { entryAnimation, sectionBackground } from "./effects";
import { parseElementLayout } from "./layout";

/** Renders a single page of the project to a standalone HTML document. */
export function exportHTML(project: ProjectState, pageId?: string): string {
  const page = project.pages.find((p) => p.id === pageId) ?? project.pages[0];

  // In export, every link resolves to a real href (anchors for sections, .html for pages).
  const resolver: LinkResolver = (encoded) => {
    const target = decodeLink(encoded);
    if (target.kind === "none") return null;
    return { href: resolveHref(project, page.id, target) };
  };

  const children = page.sections
    .filter((s) => !s.hidden)
    .map((s) => {
      const R = RENDERERS[s.variantId];
      if (!R) return null;
      return createElement(
        "div",
        { key: s.id, id: sectionAnchorId(s.id), className: `aedon-entry aedon-entry-${entryAnimation(s.props)}` },
        createElement(R, { props: { ...s.props, bg: sectionBackground(s.props) } }),
        createElement(CustomElements, { props: s.props }),
      );
    })
    .filter(Boolean);

  const layoutStyles = page.sections
    .filter((s) => !s.hidden)
    .flatMap((s) =>
      Object.entries(parseElementLayout(s.props.elementLayout)).map(
        ([selector, layout]) =>
          `#${sectionAnchorId(s.id)} > ${selector} { position: relative; translate: ${layout.x}px ${layout.y}px; width: ${layout.width}%; scale: ${layout.scale / 100}; }`,
      ),
    )
    .join("\n  ");

  const body = renderToStaticMarkup(createElement(LinkProvider, { value: resolver }, children));

  const t = project.typography;
  const fontsHref = googleFontsHref(activeFonts(t));
  const fontsLink = fontsHref ? `<link href="${fontsHref}" rel="stylesheet" />` : "";
  const vars = Object.entries(typographyVars(t))
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  const title = `${project.name} — ${page.name}`;

  return `<!doctype html>
<html lang="pt-BR" class="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(title)} — feito com Aedon." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
${fontsLink}
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root {
    color-scheme: dark;
${vars}
  }
  html { scroll-behavior: smooth; }
  html, body {
    background: #000;
    color: #fff;
    font-family: var(--site-body-font);
    font-weight: var(--site-body-weight);
    line-height: var(--site-line-height);
    letter-spacing: var(--site-letter-spacing);
    font-size: var(--site-base-size);
  }
  .aedon-entry { will-change: transform, opacity; }
  .aedon-entry-fade { animation: aedon-fade 650ms ease-out both; }
  .aedon-entry-slide-up { animation: aedon-slide-up 650ms cubic-bezier(.2,.8,.2,1) both; }
  .aedon-entry-slide-left { animation: aedon-slide-left 650ms cubic-bezier(.2,.8,.2,1) both; }
  .aedon-entry-zoom { animation: aedon-zoom 650ms cubic-bezier(.2,.8,.2,1) both; }
  @keyframes aedon-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes aedon-slide-up { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes aedon-slide-left { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes aedon-zoom { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }
  @media (prefers-reduced-motion: reduce) { .aedon-entry { animation: none !important; } }
  ${layoutStyles}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export function downloadHTML(project: ProjectState, pageId?: string) {
  const page = project.pages.find((p) => p.id === pageId) ?? project.pages[0];
  const html = exportHTML(project, page.id);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${page.slug || "index"}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
