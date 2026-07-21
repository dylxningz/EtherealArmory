import { useEffect } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useModalDialog({ open, containerRef, onClose, inertSelector = "header, main, footer, .announcement-banner" }) {
  useEffect(() => {
    if (!open || !containerRef.current) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const background = [...document.querySelectorAll(inertSelector)].filter(
      (element) => !element.contains(containerRef.current) && !containerRef.current.contains(element)
    );

    document.body.style.overflow = "hidden";
    background.forEach((element) => {
      element.inert = true;
    });

    const focusable = () => [...containerRef.current.querySelectorAll(focusableSelector)];
    window.requestAnimationFrame(() => focusable()[0]?.focus());

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        containerRef.current?.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      background.forEach((element) => {
        element.inert = false;
      });
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [containerRef, inertSelector, onClose, open]);
}
