import { useEffect, useState } from "react";

/** Where the "you are here" line sits, in px from the top of the viewport. */
const READING_LINE = 96;

/**
 * The id of the section the reader is currently in — the last one whose
 * heading has passed the reading line.
 *
 * Deliberately not an IntersectionObserver: sections here vary from a few
 * lines to a full screen, so "which one is visible" is often several at once
 * and flickers between them. Comparing heading positions against one line
 * always names exactly one section, and the answer never depends on how tall
 * that section happens to be.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;

      // The last section can be too short to ever reach the line, so once the
      // page bottoms out it wins regardless of where its heading sits.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(ids[ids.length - 1] ?? null);
        return;
      }

      let current = ids[0] ?? null;
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top === undefined || top > READING_LINE) break;
        current = id;
      }
      setActive(current);
    };

    // rAF-throttled: scroll fires far more often than the paint that shows it.
    const onScroll = () => {
      frame ||= requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return active;
}
