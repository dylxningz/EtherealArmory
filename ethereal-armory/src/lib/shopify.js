const SHOP_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = import.meta.env.VITE_SHOPIFY_API_VERSION || "2025-10";

const endpoint = `https://${SHOP_DOMAIN}/api/${API_VERSION}/graphql.json`;
const CART_STORAGE_KEY = "cartId";

class CartUnavailableError extends Error {
  constructor(message = "Your saved cart is no longer available.") {
    super(message);
    this.name = "CartUnavailableError";
  }
}

function getStoredCartId() {
  try {
    return localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeCartId(cartId) {
  try {
    if (cartId) {
      localStorage.setItem(CART_STORAGE_KEY, cartId);
    }
  } catch {
    // Cart recovery still works for this request even when storage is blocked.
  }
}

export function clearStoredCartId() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Ignore storage failures; callers will continue with in-memory state.
  }
}

function getUserErrorMessage(userErrors) {
  return userErrors?.[0]?.message || "Shopify could not complete the request.";
}

function isCartUnavailableMessage(message = "") {
  return /cart.*(not found|does not exist|expired|invalid|completed|could not be found)|invalid.*cart|invalid global id/i.test(
    message
  );
}

function isCartUnavailableError(error) {
  return (
    error instanceof CartUnavailableError ||
    isCartUnavailableMessage(error?.message)
  );
}

async function shopifyFetch(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Shopify HTTP error:", response.status, text);
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const json = await response.json();

  if (json.errors) {
    console.error("Shopify GraphQL errors:", json.errors);
    throw new Error(json.errors[0]?.message || "Failed Shopify request.");
  }

  return json.data;
}

const PRODUCT_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      descriptionHtml
      options {
        name
        values
      }
      images(first: 12) {
        nodes {
          id
          url
          altText
        }
      }
      variants(first: 50) {
        nodes {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          image {
            url
            altText
          }
        }
      }
    }
  }
`;

const PRODUCTS_QUERY = `
  query ProductsList($first: Int!) {
    products(first: $first, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        featuredImage {
          url
          altText
        }
        productType
        tags
        availableForSale
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const COLLECTIONS_QUERY = `
  query CollectionsList($first: Int!) {
    collections(first: $first, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        id
        handle
        title
        image {
          url
          altText
        }
      }
    }
  }
`;

const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      handle
      title
      products(first: $first) {
        nodes {
          id
          handle
          title
          featuredImage {
            url
            altText
          }
          productType
          tags
          availableForSale
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation {
    cartCreate {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_ADD_MUTATION = `
  mutation addToCart($cartId: ID!, $merchandiseId: ID!) {
    cartLinesAdd(
      cartId: $cartId
      lines: [{ merchandiseId: $merchandiseId, quantity: 1 }]
    ) {
      cart {
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
                image {
                  url
                  altText
                }
                product {
                  title
                  handle
                }
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_CART_QUERY = `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
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
              image {
                url
                altText
              }
              product {
                title
                handle
              }
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
      }
    }
  }
`;

const CART_CREATE_AND_BUY_NOW_MUTATION = `
  mutation CartCreate($merchandiseId: ID!) {
    cartCreate(
      input: {
        lines: [
          {
            quantity: 1
            merchandiseId: $merchandiseId
          }
        ]
      }
    ) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function getProductByHandle(handle) {
  const data = await shopifyFetch(PRODUCT_QUERY, { handle });
  return data.product;
}

export async function getProducts(first = 24) {
  const data = await shopifyFetch(PRODUCTS_QUERY, { first });
  return data.products.nodes;
}

export async function getCollections(first = 12) {
  const data = await shopifyFetch(COLLECTIONS_QUERY, { first });
  return data.collections.nodes;
}

export async function getCollectionProducts(handle, first = 40) {
  const data = await shopifyFetch(COLLECTION_PRODUCTS_QUERY, { handle, first });
  return data.collection;
}

export async function createCart() {
  const data = await shopifyFetch(CART_CREATE_MUTATION);
  const userErrors = data.cartCreate.userErrors;

  if (userErrors?.length) {
    throw new Error(getUserErrorMessage(userErrors));
  }

  if (!data.cartCreate.cart?.id) {
    throw new Error("Could not create a new cart. Please try again.");
  }

  return data.cartCreate.cart;
}

export async function addToCart(cartId, merchandiseId) {
  if (!cartId) {
    throw new CartUnavailableError("Your cart could not be found.");
  }

  const data = await shopifyFetch(CART_ADD_MUTATION, {
    cartId,
    merchandiseId,
  });

  if (data.cartLinesAdd.userErrors?.length) {
    const message = getUserErrorMessage(data.cartLinesAdd.userErrors);

    if (isCartUnavailableMessage(message)) {
      throw new CartUnavailableError(message);
    }

    throw new Error(message);
  }

  if (!data.cartLinesAdd.cart?.id) {
    throw new CartUnavailableError();
  }

  return data.cartLinesAdd.cart;
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

    if (cart?.id) {
      return cart;
    }

    clearStoredCartId();
  }

  const newCart = await createCart();
  storeCartId(newCart.id);
  return newCart;
}

export async function addToCartWithRecovery(merchandiseId) {
  try {
    const cart = await getOrCreateCart();
    const updatedCart = await addToCart(cart.id, merchandiseId);
    storeCartId(updatedCart.id);

    return {
      cart: updatedCart,
      recovered: false,
    };
  } catch (error) {
    if (!isCartUnavailableError(error)) {
      throw error;
    }
  }

  clearStoredCartId();

  const freshCart = await createCart();
  storeCartId(freshCart.id);
  const updatedCart = await addToCart(freshCart.id, merchandiseId);
  storeCartId(updatedCart.id);

  return {
    cart: updatedCart,
    recovered: true,
  };
}

export async function createCartAndGetCheckoutUrl(merchandiseId) {
  const data = await shopifyFetch(CART_CREATE_AND_BUY_NOW_MUTATION, {
    merchandiseId,
  });

  if (data.cartCreate.userErrors?.length) {
    throw new Error(getUserErrorMessage(data.cartCreate.userErrors));
  }

  const checkoutUrl = data.cartCreate.cart?.checkoutUrl;

  if (!checkoutUrl) {
    throw new Error("Could not start checkout. Please try again.");
  }

  return checkoutUrl;
}
