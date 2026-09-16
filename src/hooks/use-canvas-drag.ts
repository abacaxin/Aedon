import { useCallback, useState } from "react";

interface Options {
  /** Returns the preview iframe element (there is exactly one). */
  getIframe: () => HTMLIFrameElement | null;
  /** Insert a component at a specific index (dropped onto the canvas). */
  onDrop: (variantId: string, index: number) => void;
  /** Add a component with no positioning (a plain click/tap, or keyboard). */
  onTap: (variantId: string) => void;
}

const MOVE_THRESHOLD = 6; // px before a mouse/pen press becomes a drag
const TOUCH_HOLD_MS = 240; // long-press before a touch press becomes a drag

/**
 * Computes where a component would be inserted, given a pointer position over the
 * preview iframe. dnd-kit can't cross the iframe boundary, so we hit-test the iframe's
 * own document. Returns null when the pointer isn't over the canvas.
 */
function computeDropIndex(
  iframe: HTMLIFrameElement,
  clientX: number,
  clientY: number,
): number | null {
  const rect = iframe.getBoundingClientRect();
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    return null;
  }
  const doc = iframe.contentDocument;
  if (!doc) return null;
  const sections = Array.from(doc.querySelectorAll<HTMLElement>('[id^="sec-"]'));
  if (sections.length === 0) return 0;
  const y = clientY - rect.top; // iframe is not internally scrolled → same space as getBoundingClientRect
  for (let i = 0; i < sections.length; i++) {
    const r = sections[i].getBoundingClientRect();
    if (y < r.top + r.height / 2) return i;
  }
  return sections.length;
}

export interface DragState {
  variantId: string | null;
  dropIndex: number | null;
  point: { x: number; y: number } | null;
  /** Begin tracking a press on a library card. */
  start: (variantId: string, e: React.PointerEvent) => void;
}

export function useCanvasDrag({ getIframe, onDrop, onTap }: Options): DragState {
  const [variantId, setVariantId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (id: string, e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return; // primary button only for mouse
      const startX = e.clientX;
      const startY = e.clientY;
      const isTouch = e.pointerType === "touch";
      // Stop the press itself from anchoring a native text selection before the
      // move threshold turns it into a drag.
      if (!isTouch) e.preventDefault();
      let active = false;
      let holdTimer: number | null = null;

      const begin = () => {
        active = true;
        setVariantId(id);
        setPoint({ x: startX, y: startY });
        // Prevent the browser from turning the drag into a text selection as the
        // pointer sweeps over the library and canvas.
        document.body.style.userSelect = "none";
      };

      const update = (x: number, y: number) => {
        setPoint({ x, y });
        const iframe = getIframe();
        setDropIndex(iframe ? computeDropIndex(iframe, x, y) : null);
      };

      const onMove = (ev: PointerEvent) => {
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (!active) {
          if (isTouch) {
            // Moving before the long-press fires means the user is scrolling → abort.
            if (dist > MOVE_THRESHOLD) finish();
            return;
          }
          if (dist > MOVE_THRESHOLD) begin();
          else return;
        }
        ev.preventDefault(); // stop text selection / touch scroll during an active drag
        update(ev.clientX, ev.clientY);
      };

      const onUp = (ev: PointerEvent) => {
        const wasActive = active;
        const iframe = getIframe();
        const idx = wasActive && iframe ? computeDropIndex(iframe, ev.clientX, ev.clientY) : null;
        finish();
        if (wasActive) {
          if (idx != null) onDrop(id, idx);
        } else {
          onTap(id);
        }
      };

      const finish = () => {
        if (holdTimer) {
          window.clearTimeout(holdTimer);
          holdTimer = null;
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", finish);
        active = false;
        setVariantId(null);
        setDropIndex(null);
        setPoint(null);
        document.body.style.userSelect = "";
      };

      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", finish);

      if (isTouch) {
        holdTimer = window.setTimeout(begin, TOUCH_HOLD_MS);
      }
    },
    [getIframe, onDrop, onTap],
  );

  return { variantId, dropIndex, point, start };
}
