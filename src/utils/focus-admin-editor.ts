/** Bring the selected record into view when the list and editor are stacked. */
export function focusAdminEditor(element: HTMLElement | null, breakpoint = 1280) {
  if (!element || window.innerWidth >= breakpoint) return;

  window.requestAnimationFrame(() => {
    if (!element.isConnected) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  });
}
