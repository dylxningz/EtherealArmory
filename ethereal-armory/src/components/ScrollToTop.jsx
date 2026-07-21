import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { shouldResetScroll } from "../lib/commerce";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (shouldResetScroll(previousPath.current, pathname)) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
    previousPath.current = pathname;
  }, [pathname]);

  return null;
}
