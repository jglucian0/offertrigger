import { useRef, useEffect } from "react";

export const useDragScroll = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const mouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;

      document.body.style.userSelect = "none";
      el.style.cursor = "grabbing";
    };

    const mouseMove = (e: MouseEvent) => {
      if (!isDown) return;

      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };

    const mouseUp = () => {
      isDown = false;
      document.body.style.userSelect = "";
      el.style.cursor = "grab";
    };

    el.addEventListener("mousedown", mouseDown);
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp);

    return () => {
      el.removeEventListener("mousedown", mouseDown);
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseUp);
    };
  }, [ref.current]); // 🔥 ESSA LINHA É A CHAVE

  return ref;
};