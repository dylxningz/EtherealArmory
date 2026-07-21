import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import { useModalDialog } from "../hooks/useModalDialog";
import { formatMoney } from "../lib/pricing";
import { clampQuantity } from "../lib/commerce";
import { shopifyImageUrl } from "../lib/images";

function CartLine({ line, pending, onUpdate, onRemove }) {
  const [quantityDraft, setQuantityDraft] = useState({ lineQuantity: line.quantity, value: line.quantity });
  const variant = line.merchandise;
  const quantity = quantityDraft.lineQuantity === line.quantity ? quantityDraft.value : line.quantity;
  const setQuantity = (value) => setQuantityDraft({ lineQuantity: line.quantity, value });

  function commit(next) {
    const safe = clampQuantity(next);
    setQuantity(safe);
    if (safe !== line.quantity) onUpdate(line.id, safe).catch(() => setQuantity(line.quantity));
  }

  return (
    <article className={`cart-line ${pending ? "is-pending" : ""}`} aria-busy={pending}>
      <Link to={`/products/${variant.product.handle}`} className="cart-line-image">
        {variant.image?.url ? <img src={shopifyImageUrl(variant.image.url, 240)} alt={variant.image.altText || variant.product.title} width={variant.image.width || 240} height={variant.image.height || 240} loading="lazy" /> : <span className="image-placeholder" aria-hidden="true">EA</span>}
      </Link>
      <div className="cart-line-copy">
        <Link to={`/products/${variant.product.handle}`}><h3>{variant.product.title}</h3></Link>
        {variant.title !== "Default Title" && <p>{variant.title}</p>}
        <p>{formatMoney(variant.price.amount, variant.price.currencyCode)}</p>
        <div className="cart-line-actions">
          <div className="quantity-control" aria-label={`Quantity for ${variant.product.title}`}>
            <button onClick={() => !pending && commit(quantity - 1)} disabled={quantity <= 1} aria-disabled={pending || quantity <= 1} aria-label="Decrease quantity" type="button">−</button>
            <input value={quantity} onChange={(event) => setQuantity(event.target.value)} onBlur={() => commit(quantity)} onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()} inputMode="numeric" aria-label="Quantity" disabled={pending} />
            <button onClick={() => !pending && commit(quantity + 1)} disabled={quantity >= 99} aria-disabled={pending || quantity >= 99} aria-label="Increase quantity" type="button">+</button>
          </div>
          <button className="text-button" onClick={() => onRemove(line.id).catch(() => {})} disabled={pending} type="button">Remove</button>
        </div>
      </div>
    </article>
  );
}

export default function CartDrawer() {
  const { cart, error, isOpen, closeCart, pendingLines, status, updateLine, removeLine, checkout, loadCart } = useCart();
  const drawerRef = useRef(null);
  const close = useCallback(() => closeCart(), [closeCart]);
  useModalDialog({ open: isOpen, containerRef: drawerRef, onClose: close });

  if (!isOpen) return null;
  const lines = cart?.lines?.nodes || [];
  const subtotal = cart?.cost?.subtotalAmount;

  return (
    <div className="cart-layer">
      <div className="cart-overlay" onMouseDown={(event) => event.target === event.currentTarget && close()}>
        <aside className="cart-drawer" ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex="-1">
          <div className="cart-drawer-header">
            <div><p className="overline">Secure Shopify checkout</p><h2 id="cart-title">Your cart <span>({cart?.totalQuantity || 0})</span></h2></div>
            <button className="icon-button" onClick={close} aria-label="Close cart" type="button"><span aria-hidden="true">×</span></button>
          </div>

          <div className="cart-drawer-body">
            {error && <div className="inline-error" role="alert"><p>{error}</p><button className="text-button" onClick={loadCart} type="button">Retry</button></div>}
            {status === "loading" && !cart ? <p className="cart-loading" aria-live="polite">Restoring your cart…</p> : null}
            {!lines.length && status !== "loading" ? (
              <div className="cart-empty">
                <span className="empty-emblem" aria-hidden="true">◇</span>
                <h3>Your cart awaits its first artifact.</h3>
                <p>Browse available props and collector pieces, or begin a custom commission.</p>
                <Link className="button button-primary" to="/products" onClick={close}>Browse the armory</Link>
              </div>
            ) : (
              <div className="cart-lines">
                {lines.map((line) => <CartLine key={line.id} line={line} pending={pendingLines.has(line.id)} onUpdate={updateLine} onRemove={removeLine} />)}
              </div>
            )}
          </div>

          {lines.length > 0 && (
            <div className="cart-drawer-footer">
              <div className="cart-subtotal"><span>Subtotal</span><strong>{formatMoney(subtotal?.amount, subtotal?.currencyCode)}</strong></div>
              <p>Eligible Shopify discounts are reflected in the subtotal. Shipping and taxes are calculated at checkout.</p>
              <button className="button button-primary button-full" onClick={checkout} disabled={!cart?.checkoutUrl || status !== "idle"} type="button">Continue to secure checkout</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
