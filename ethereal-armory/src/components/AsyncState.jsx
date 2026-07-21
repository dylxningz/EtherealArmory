export function LoadingGrid({ count = 8, label = "Loading products" }) {
  return (
    <div className="product-grid" aria-label={label} aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="product-card skeleton-card" key={index} aria-hidden="true">
          <span className="skeleton-media" />
          <span className="skeleton-line short" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <section className="status-panel" role="alert">
      <p className="overline">Connection interrupted</p>
      <h2>{title}</h2>
      <p>{message || "The armory could not be loaded. Please try again."}</p>
      {onRetry && <button className="button button-secondary" onClick={onRetry} type="button">Try again</button>}
    </section>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <section className="status-panel">
      <p className="overline">Nothing here yet</p>
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </section>
  );
}
