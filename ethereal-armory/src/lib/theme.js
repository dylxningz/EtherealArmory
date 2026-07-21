export function getStorefrontTheme(search = "") {
  return new URLSearchParams(search).get("theme") === "cyberpunk" ? "cyberpunk" : "fantasy";
}

export function addThemeToDestination(to, currentSearch) {
  const currentTheme = new URLSearchParams(currentSearch).get("theme");
  if (currentTheme !== "cyberpunk") return to;

  if (typeof to === "string") {
    if (to.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(to)) return to;
    const [pathAndSearch, hash = ""] = to.split("#", 2);
    const [pathname, search = ""] = pathAndSearch.split("?", 2);
    const params = new URLSearchParams(search);
    params.set("theme", "cyberpunk");
    return `${pathname}?${params.toString()}${hash ? `#${hash}` : ""}`;
  }

  if (!to || typeof to !== "object") return to;
  const params = new URLSearchParams(to.search || "");
  params.set("theme", "cyberpunk");
  return { ...to, search: `?${params.toString()}` };
}
