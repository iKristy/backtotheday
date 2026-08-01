import { useCallback, useEffect, useRef, useState } from "react";

export function Toggletip({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const handleClick = useCallback(() => {
    // Clear then repopulate after 100ms so screen readers re-announce.
    setVisible(false);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, 100);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        hide();
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [hide]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <span
      ref={containerRef}
      className="toggletip-container"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={hide}
    >
      <button
        type="button"
        aria-label={`more info about ${typeof label === "string" ? label : ""}`}
        className="toggletip-trigger cursor-help underline decoration-dotted decoration-neutral-600"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Escape") hide();
        }}
      >
        {label}
      </button>
      <span role="status">
        {visible && <span className="toggletip-bubble">{children}</span>}
      </span>
    </span>
  );
}
