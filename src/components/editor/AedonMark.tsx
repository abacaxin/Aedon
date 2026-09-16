/**
 * Wordmark-adjacent monogram: an "A" with a bird-wing notch, matching the Aedon
 * brand mark. Plain currentColor SVG — no gradients or drop shadows.
 */
export function AedonMark({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2.5 20 20h-4.2l-1.6-3.6H9.8L8.2 20H4L11 5.2c-2.4.2-3.4 1.8-4.6 4.4L11 12 12 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
