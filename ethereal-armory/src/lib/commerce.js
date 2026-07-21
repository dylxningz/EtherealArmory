export function optionsToKey(selectedOptions = []) {
  return [...selectedOptions]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, value }) => `${name}:${value}`)
    .join("|");
}

export function resolveVariant(variants = [], selectedOptions = {}) {
  const expected = Object.entries(selectedOptions).map(([name, value]) => ({ name, value }));
  if (!expected.length) return variants.find((variant) => variant.availableForSale) || variants[0] || null;
  return variants.find((variant) => optionsToKey(variant.selectedOptions) === optionsToKey(expected)) || null;
}

export function isOptionValueAvailable(variants = [], selections = {}, optionName, value) {
  return variants.some((variant) => {
    if (!variant.availableForSale) return false;

    return variant.selectedOptions.every((option) => {
      const expected = option.name === optionName ? value : selections[option.name];
      return !expected || option.value === expected;
    });
  });
}

export function sortProducts(products = [], sort = "featured") {
  const copy = [...products];
  const price = (product) => Number(product.priceRange?.minVariantPrice?.amount || 0);

  if (sort === "title-asc") return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "title-desc") return copy.sort((a, b) => b.title.localeCompare(a.title));
  if (sort === "price-low-high") return copy.sort((a, b) => price(a) - price(b));
  if (sort === "price-high-low") return copy.sort((a, b) => price(b) - price(a));
  return copy;
}

export function getCatalogState(searchParams) {
  return {
    sort: searchParams.get("sort") || "featured",
    type: searchParams.get("type") || "all",
    availability: searchParams.get("availability") || "all",
  };
}

export function updateCatalogState(searchParams, changes) {
  const next = new URLSearchParams(searchParams);

  Object.entries(changes).forEach(([key, value]) => {
    if (!value || value === "all" || (key === "sort" && value === "featured")) next.delete(key);
    else next.set(key, value);
  });

  return next;
}

export function clampQuantity(value, max = 99) {
  const numeric = Math.floor(Number(value));
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(Math.max(numeric, 1), max);
}

export function shouldResetScroll(previousPath, nextPath) {
  return previousPath !== nextPath;
}
