import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

/**
 * Renders `children` inside a real <iframe> at an exact pixel width, so the site's
 * responsive breakpoints (Tailwind sm:/md:/lg:) react to the *device* width instead
 * of the editor window. A nested React root is mounted inside the iframe (portals
 * don't carry React's event delegation across documents), and the parent document's
 * stylesheets/fonts are mirrored into the iframe head so everything looks identical.
 */
export function DeviceFrame({
  width,
  interactive = true,
  onHeightChange,
  children,
}: {
  width: number;
  interactive?: boolean;
  /** Reports the real (unscaled) content height, so a wrapper can reserve the right space. */
  onHeightChange?: (height: number) => void;
  children: ReactNode;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rootRef = useRef<Root | null>(null);
  const scheduleRef = useRef<() => void>(() => {});
  const childrenRef = useRef<ReactNode>(children);
  childrenRef.current = children;
  const [height, setHeight] = useState(600);
  const onHeightChangeRef = useRef(onHeightChange);
  onHeightChangeRef.current = onHeightChange;

  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow;
    if (!iframe || !doc || !win) return;

    doc.documentElement.classList.add("dark");
    doc.body.style.margin = "0";
    doc.body.style.background = "#000";

    const mount = doc.createElement("div");
    doc.body.appendChild(mount);
    const root = createRoot(mount);
    rootRef.current = root;

    // Mirror parent stylesheets + font links into the iframe head, kept in sync so
    // Tailwind (dev-injected) and live font changes propagate.
    const syncHead = () => {
      doc.head.querySelectorAll("[data-mirror]").forEach((n) => n.remove());
      document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute("data-mirror", "");
        doc.head.appendChild(clone);
      });
    };
    syncHead();
    const headObs = new MutationObserver(syncHead);
    headObs.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });

    // The nested root commits asynchronously and fonts/images settle later, so measure
    // across several ticks. A ResizeObserver inside the iframe catches later reflows.
    // body.scrollHeight is at least the iframe viewport height. Feeding it back
    // into the iframe height prevents shrinking and can grow the frame forever.
    const measure = () => setHeight(Math.max(mount.scrollHeight, mount.offsetHeight, 200));
    const schedule = () => {
      measure();
      win.requestAnimationFrame(measure);
      win.setTimeout(measure, 150);
      win.setTimeout(measure, 500);
    };
    scheduleRef.current = schedule;

    const RO =
      (win as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ??
      ResizeObserver;
    const ro = new RO(measure);
    ro.observe(mount);

    root.render(childrenRef.current);
    schedule();

    return () => {
      headObs.disconnect();
      ro.disconnect();
      queueMicrotask(() => root.unmount());
      mount.remove();
    };
  }, []);

  // Push new children into the nested root whenever they change, then re-measure.
  useEffect(() => {
    rootRef.current?.render(children);
    scheduleRef.current();
  }, [children]);

  useEffect(() => {
    onHeightChangeRef.current?.(height);
  }, [height]);

  return (
    <iframe
      ref={iframeRef}
      title="Preview do site"
      width={width}
      height={height}
      scrolling="no"
      style={{
        border: 0,
        display: "block",
        background: "#000",
        colorScheme: "dark",
        pointerEvents: interactive ? undefined : "none",
      }}
    />
  );
}
