import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { getStorefrontTheme } from "../lib/theme";

export default function StorefrontTheme() {
  const { search } = useLocation();
  const theme = getStorefrontTheme(search);

  useLayoutEffect(() => {
    document.documentElement.dataset.storefrontTheme = theme;
    return () => document.documentElement.removeAttribute("data-storefront-theme");
  }, [theme]);

  return null;
}
