/** The actual Aedon logo mark (public/aedon-mark.png), cropped from the brand asset. */
export function AedonMark({ className = "w-4 h-4" }: { className?: string }) {
  return <img src="/aedon-mark.png" alt="Aedon" className={`${className} object-contain`} />;
}
