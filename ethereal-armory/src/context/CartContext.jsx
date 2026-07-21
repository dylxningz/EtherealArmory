import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addToCartWithRecovery,
  clearStoredCartId,
  getCart,
  getStoredCartId,
  isCartUnavailableError,
  removeCartLines,
  storeCartId,
  updateCartLines,
} from "../lib/shopify";
import { clampQuantity } from "../lib/commerce";

import { CartContext } from "./cart-context";

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [pendingLines, setPendingLines] = useState(() => new Set());
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const clearError = useCallback(() => setError(""), []);

  const loadCart = useCallback(async () => {
    const cartId = getStoredCartId();
    if (!cartId) return null;

    setStatus("loading");
    setError("");
    try {
      const savedCart = await getCart(cartId);
      setCart(savedCart);
      if (!savedCart) clearStoredCartId();
      return savedCart;
    } catch {
      setError("We could not refresh your cart. Your saved cart has been preserved; try again shortly.");
      return null;
    } finally {
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(async (merchandiseId, quantity = 1, { openCart = true } = {}) => {
    setStatus("adding");
    setError("");
    try {
      const result = await addToCartWithRecovery(merchandiseId, clampQuantity(quantity));
      setCart(result.cart);
      storeCartId(result.cart.id);
      if (openCart) setIsOpen(true);
      return result.cart;
    } catch (requestError) {
      setError(requestError.message || "This item could not be added. Please try again.");
      throw requestError;
    } finally {
      setStatus("idle");
    }
  }, []);

  const runLineMutation = useCallback(async (lineId, operation) => {
    if (!cart?.id || pendingLines.has(lineId)) return null;
    setPendingLines((current) => new Set(current).add(lineId));
    setError("");
    try {
      const updated = await operation(cart.id);
      setCart(updated);
      return updated;
    } catch (requestError) {
      if (isCartUnavailableError(requestError)) {
        clearStoredCartId();
        setCart(null);
        setError("This cart expired. Add the item again to begin a fresh cart.");
      } else {
        setError("The cart could not be updated. Your existing cart has been preserved.");
      }
      throw requestError;
    } finally {
      setPendingLines((current) => {
        const next = new Set(current);
        next.delete(lineId);
        return next;
      });
    }
  }, [cart?.id, pendingLines]);

  const updateLine = useCallback((lineId, quantity) => {
    const nextQuantity = clampQuantity(quantity);
    return runLineMutation(lineId, (cartId) => updateCartLines(cartId, [{ id: lineId, quantity: nextQuantity }]));
  }, [runLineMutation]);

  const removeLine = useCallback((lineId) => (
    runLineMutation(lineId, (cartId) => removeCartLines(cartId, [lineId]))
  ), [runLineMutation]);

  const buyNow = useCallback(async (merchandiseId, quantity = 1) => {
    const checkoutCart = await addItem(merchandiseId, quantity, { openCart: false });
    if (!checkoutCart?.checkoutUrl) throw new Error("Checkout is temporarily unavailable.");
    window.location.assign(checkoutCart.checkoutUrl);
  }, [addItem]);

  const checkout = useCallback(() => {
    if (cart?.checkoutUrl) window.location.assign(cart.checkoutUrl);
  }, [cart?.checkoutUrl]);

  const value = useMemo(() => ({
    cart,
    error,
    status,
    pendingLines,
    isOpen,
    openCart,
    closeCart,
    clearError,
    loadCart,
    addItem,
    updateLine,
    removeLine,
    buyNow,
    checkout,
  }), [addItem, buyNow, cart, checkout, clearError, closeCart, error, isOpen, loadCart, openCart, pendingLines, removeLine, status, updateLine]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
