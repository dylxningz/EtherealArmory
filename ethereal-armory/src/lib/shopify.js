const env = import.meta.env || globalThis.process?.env || {};
const SHOP_DOMAIN = env.VITE_SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = env.VITE_SHOPIFY_API_VERSION || "2025-10";

const endpoint = SHOP_DOMAIN ? `https://${SHOP_DOMAIN}/api/${API_VERSION}/graphql.json` : "";
export const CART_STORAGE_KEY = "cartId";

export class CartUnavailableError extends Error {
  constructor(message = "Your saved cart is no longer available.") {
    super(message);
    this.name = "CartUnavailableError";
  }
}

export function getStoredCartId() {
  try {
    return localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeCartId(cartId) {
  try {
    if (cartId) localStorage.setItem(CART_STORAGE_KEY, cartId);
  } catch {
    // The in-memory cart remains usable when storage is blocked.
  }
}

export function clearStoredCartId() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Ignore blocked storage.
  }
}

function getUserErrorMessage(userErrors) {
  return userErrors?.[0]?.message || "Shopify could not complete the request.";
}

export function isCartUnavailableMessage(message = "") {
  return /cart.*(not found|does not exist|expired|invalid|completed|could not be found)|invalid.*cart|invalid global id/i.test(message);
}

export function isCartUnavailableError(error) {
  return error instanceof CartUnavailableError || isCartUnavailableMessage(error?.message);
}

function createTimeoutSignal(externalSignal, timeout = 12000) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  externalSignal?.addEventListener("abort", abort, { once: true });
  const timer = globalThis.setTimeout(abort, timeout);

  return {
    signal: controller.signal,
    cleanup() {
      globalThis.clearTimeout(timer);
      externalSignal?.removeEventListener("abort", abort);
    },
  };
}

async function shopifyFetch(query, variables = {}, { retry = true, signal } = {}) {
  if (!endpoint || !STOREFRONT_TOKEN) {
    throw new Error("The Shopify Storefront API is not configured for this environment.");
  }

  const attempts = retry ? 2 : 1;
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const timeout = createTimeoutSignal(signal);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
        signal: timeout.signal,
      });

      if (!response.ok) {
        const error = new Error(`Shopify request failed with HTTP ${response.status}.`);
        error.status = response.status;
        throw error;
      }

      const json = await response.json();
      if (json.errors?.length) throw new Error(json.errors[0]?.message || "Shopify returned an error.");
      return json.data;
    } catch (error) {
      lastError = error;
      const canRetry = retry && attempt === 0 && !signal?.aborted && (error.name === "AbortError" || !error.status || error.status >= 500);
      if (!canRetry) throw error;
    } finally {
      timeout.cleanup();
    }
  }

  throw lastError;
}

const VARIANT_PRICING_FIELDS = `
  price { amount currencyCode }
  compareAtPrice { amount currencyCode }
`;

const PRODUCT_CARD_FIELDS = `
  id
  handle
  title
  productType
  vendor
  tags
  availableForSale
  featuredImage { id url altText width height }
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
  variants(first: 100) {
    nodes {
      id
      availableForSale
      ${VARIANT_PRICING_FIELDS}
    }
    pageInfo { hasNextPage }
  }
`;

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  lines(first: 50) {
    nodes {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          title
          availableForSale
          image { url altText width height }
          product { title handle }
          ${VARIANT_PRICING_FIELDS}
        }
      }
    }
  }
  cost { subtotalAmount { amount currencyCode } }
`;

const PRODUCT_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id handle title description descriptionHtml productType vendor tags availableForSale onlineStoreUrl
      seo { title description }
      processingTime: metafield(namespace: "custom", key: "processing_time") { value }
      options { name values }
      images(first: 24) { nodes { id url altText width height } }
      variants(first: 100) {
        nodes {
          id title availableForSale sku
          selectedOptions { name value }
          ${VARIANT_PRICING_FIELDS}
          image { id url altText width height }
        }
      }
    }
  }
`;

const PRODUCTS_QUERY = `
  query ProductsList($first: Int!, $after: String, $sortKey: ProductSortKeys!, $reverse: Boolean!, $query: String) {
    products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
      nodes { ${PRODUCT_CARD_FIELDS} }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const COLLECTIONS_QUERY = `
  query CollectionsList($first: Int!, $after: String) {
    collections(first: $first, after: $after, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id handle title description
        image { id url altText width height }
        products(first: 6) {
          nodes {
            id title
            featuredImage { id url altText width height }
            images(first: 3) { nodes { id url altText width height } }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys!, $reverse: Boolean!) {
    collection(handle: $handle) {
      id handle title description seo { title description } image { url altText width height }
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        nodes { ${PRODUCT_CARD_FIELDS} }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation CartCreate {
    cartCreate { cart { ${CART_FIELDS} } userErrors { field message } }
  }
`;

const CART_ADD_MUTATION = `
  mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ${CART_FIELDS} }
      userErrors { field message }
    }
  }
`;

const CART_UPDATE_MUTATION = `
  mutation UpdateCart($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ${CART_FIELDS} }
      userErrors { field message }
    }
  }
`;

const CART_REMOVE_MUTATION = `
  mutation RemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ${CART_FIELDS} }
      userErrors { field message }
    }
  }
`;

const GET_CART_QUERY = `query GetCart($cartId: ID!) { cart(id: $cartId) { ${CART_FIELDS} } }`;

function readCartMutation(payload, operation) {
  const userErrors = payload?.userErrors;
  if (userErrors?.length) {
    const message = getUserErrorMessage(userErrors);
    if (isCartUnavailableMessage(message)) throw new CartUnavailableError(message);
    throw new Error(message);
  }
  if (!payload?.cart?.id) throw new CartUnavailableError(`${operation} could not find the cart.`);
  return payload.cart;
}

export async function getProductByHandle(handle, options) {
  const data = await shopifyFetch(PRODUCT_QUERY, { handle }, options);
  return data.product;
}

export async function getProductsPage({ first = 24, after = null, sortKey = "BEST_SELLING", reverse = false, query = null, signal } = {}) {
  const data = await shopifyFetch(PRODUCTS_QUERY, { first, after, sortKey, reverse, query }, { signal });
  return data.products;
}

export async function getProducts(first = 24) {
  return (await getProductsPage({ first })).nodes;
}

export async function getCollectionsPage({ first = 12, after = null, signal } = {}) {
  const data = await shopifyFetch(COLLECTIONS_QUERY, { first, after }, { signal });
  return data.collections;
}

export async function getCollections(first = 12) {
  return (await getCollectionsPage({ first })).nodes;
}

export async function getCollectionProductsPage(handle, { first = 24, after = null, sortKey = "COLLECTION_DEFAULT", reverse = false, signal } = {}) {
  const data = await shopifyFetch(COLLECTION_PRODUCTS_QUERY, { handle, first, after, sortKey, reverse }, { signal });
  return data.collection;
}

export async function getCollectionProducts(handle, first = 40) {
  return getCollectionProductsPage(handle, { first });
}

export async function createCart() {
  const data = await shopifyFetch(CART_CREATE_MUTATION, {}, { retry: false });
  const cart = readCartMutation(data.cartCreate, "Cart creation");
  storeCartId(cart.id);
  return cart;
}

export async function addToCart(cartId, merchandiseId, quantity = 1) {
  if (!cartId) throw new CartUnavailableError("Your cart could not be found.");
  const data = await shopifyFetch(CART_ADD_MUTATION, { cartId, lines: [{ merchandiseId, quantity }] }, { retry: false });
  return readCartMutation(data.cartLinesAdd, "Adding this item");
}

export async function updateCartLines(cartId, lines) {
  if (!cartId) throw new CartUnavailableError("Your cart could not be found.");
  const data = await shopifyFetch(CART_UPDATE_MUTATION, { cartId, lines }, { retry: false });
  return readCartMutation(data.cartLinesUpdate, "Updating this item");
}

export async function removeCartLines(cartId, lineIds) {
  if (!cartId) throw new CartUnavailableError("Your cart could not be found.");
  const data = await shopifyFetch(CART_REMOVE_MUTATION, { cartId, lineIds }, { retry: false });
  return readCartMutation(data.cartLinesRemove, "Removing this item");
}

export async function getCart(cartId) {
  if (!cartId) return null;
  try {
    const data = await shopifyFetch(GET_CART_QUERY, { cartId });
    return data.cart || null;
  } catch (error) {
    if (isCartUnavailableError(error)) {
      clearStoredCartId();
      return null;
    }
    throw error;
  }
}

export async function getOrCreateCart() {
  const storedCartId = getStoredCartId();
  if (storedCartId) {
    const cart = await getCart(storedCartId);
    if (cart?.id) return cart;
    clearStoredCartId();
  }
  return createCart();
}

export async function addToCartWithRecovery(merchandiseId, quantity = 1) {
  try {
    const cart = await getOrCreateCart();
    const updatedCart = await addToCart(cart.id, merchandiseId, quantity);
    storeCartId(updatedCart.id);
    return { cart: updatedCart, recovered: false };
  } catch (error) {
    if (!isCartUnavailableError(error)) throw error;
  }

  clearStoredCartId();
  const freshCart = await createCart();
  const updatedCart = await addToCart(freshCart.id, merchandiseId, quantity);
  storeCartId(updatedCart.id);
  return { cart: updatedCart, recovered: true };
}
