# Ethereal Armory Storefront Platform Overhaul

Date: 2026-07-20
Branch: `storefront-platform-overhaul`
Deployment status: **Not deployed**

## 1. Executive result

The storefront remains a React 19 + Vite single-page application hosted by Vercel and backed by Shopify Storefront GraphQL. The overhaul keeps the existing commerce platform intact while replacing the presentation and client architecture with a responsive, accessible dark-fantasy system.

The application now has route-level code splitting, reusable layout/commerce components, real Shopify-driven homepage collections and featured products, addressable catalog state, exact variant selection, resilient cart mutations, accessible modal behavior, route metadata and structured data, dynamic sitemap generation, a branded 404 experience, and automated coverage across every required width.

No production deployment, Shopify configuration change, checkout customization, or environment-value edit was performed. The pre-existing `.env` modification was preserved.

## 2. Architecture summary

```text
main.jsx
└─ BrowserRouter
   └─ CartProvider
      └─ lazy route tree in App.jsx
         └─ SiteLayout
            ├─ AnnouncementBanner
            ├─ Header + mobile navigation dialog
            ├─ route Outlet
            ├─ Footer
            ├─ CartDrawer dialog
            ├─ ScrollToTop
            └─ Vercel Analytics

Pages → Shopify query helpers → Storefront GraphQL
Product/cart actions → CartContext → Shopify cart mutations → Shopify checkout URL
Route content → Seo component → canonical/meta/social/JSON-LD
/sitemap.xml → Vercel rewrite → api/sitemap.js → Shopify handles
```

Shopify remains authoritative for products, collections, availability, variants, currency, compare-at pricing, cart cost, and checkout. A Vercel serverless function and Resend handle commission-form email, Judge.me remains the review provider, and Vercel remains the build/runtime host.

## 3. Route map

| Route | Experience |
|---|---|
| `/` | Data-driven home, trust, real collections, featured products, commission process, final CTA |
| `/products` | Paginated catalog, URL-backed filters and sorting, collection rail |
| `/collections/:handle` | Addressable Shopify collection with the same catalog controls |
| `/products/:handle` | Responsive gallery, exact variants, quantity, cart/checkout, policies, reviews, related products |
| `/portfolio` | Project grid and accessible detail dialog |
| `/about` | Studio story and principles |
| `/contact` | Guided commission brief with inline submit success/failure states |
| Policy routes | Privacy, terms, shipping, and returns with route metadata |
| `*` | Branded client-side 404 with `noindex,follow` |

## 4. Relevant files

| File or group | Responsibility |
|---|---|
| `src/main.jsx` | React application entry point |
| `src/App.jsx` | Lazy route definitions and top-level providers |
| `src/components/SiteLayout.jsx` | Shared shell, skip link, header/footer/cart, scroll restoration, analytics |
| `src/components/Header.jsx` | Desktop navigation, active states, mobile navigation dialog |
| `src/components/AnnouncementBanner.jsx` | Truthful dismissible session-persisted announcement |
| `src/components/Footer.jsx` | Store, policy, contact, and Shopify-checkout trust links |
| `src/components/CartDrawer.jsx` | Accessible cart dialog, quantities, removal, subtotal, checkout transition |
| `src/components/ProductCard.jsx` | Shared responsive Shopify product card and pricing |
| `src/components/AsyncState.jsx` | Loading, error/retry, and empty states |
| `src/components/Seo.jsx` | Titles, descriptions, canonical, OG/Twitter, route JSON-LD |
| `src/components/ScrollToTop.jsx` | Client route scroll restoration |
| `src/components/JudgeMeReviews.jsx` | Viewport-deferred Judge.me loading and failure feedback |
| `src/context/CartContext.jsx` | Cart lifecycle, loading/error state, add/update/remove/buy-now/checkout |
| `src/context/cart-context.js`, `useCart.js` | Context primitive and consumer hook |
| `src/hooks/useModalDialog.js` | Focus containment, Escape, inert background, body lock, focus restoration |
| `src/lib/shopify.js` | Storefront queries/mutations, timeout/retry, pagination, cart recovery |
| `src/lib/commerce.js` | Exact variant matching, option availability, URL state, quantity and scroll helpers |
| `src/lib/pricing.js` | `Intl.NumberFormat` and Shopify compare-at pricing |
| `src/lib/images.js` | Shopify CDN width URLs and responsive `srcset` generation |
| `src/config/siteSettings.js` | Announcement and support copy |
| `src/pages/HomePage.jsx` | Homepage data and conversion flow |
| `src/pages/ProductsPage.jsx/.css` | Catalog and collection routes, URL state, pagination, breakpoints |
| `src/pages/ProductPage.jsx/.css` | Product purchase flow, variants, images, policies, reviews, related items |
| `src/pages/AboutPage.jsx` | About experience |
| `src/pages/ContactPage.jsx` | Commission inquiry and inline submission states |
| `src/pages/PortfolioPage.jsx` | Portfolio and accessible project dialog |
| `src/pages/NotFoundPage.jsx` | Wildcard 404 experience |
| Policy page files | Policy content and route SEO |
| `src/index.css` | Tokens, reset, shared components, shell, home/editorial/portfolio responsive rules |
| `public/brand-mark.svg` | 877-byte code-native crest replacing the 3.42 MB logo |
| `public/og-image.png` | 1200×630 branded social preview |
| `public/robots.txt` | Crawl policy and sitemap location |
| `api/sitemap.js` | Cached XML sitemap from static routes plus Shopify product/collection handles |
| `vercel.json` | Sitemap rewrite, SPA fallback to `index.html`, immutable asset caching |
| `index.html` | Default crawler-safe metadata, canonical, social metadata, favicon |
| `tests/unit/*.test.js` | Currency, sale, variants, URL state, cart mutation/recovery, scroll helpers |
| `tests/e2e/storefront.spec.js` | Responsive, navigation/dialog, catalog, product, 404, scroll, and axe coverage |
| `playwright.config.js` | Required viewport projects and local web server |

Removed dead assets: the 3.42 MB embedded-raster logo SVG, Vite/React starter SVGs, unused icon sprite, unused `App.css`, and obsolete favicon.

## 5. Prioritized findings and disposition

| Priority | Finding | Disposition |
|---|---|---|
| Critical | Client invented a 10% discount and hardcoded `$`, risking storefront/checkout mismatch | Resolved: only Shopify price/compare-at data is shown; all display uses Shopify currency through `Intl.NumberFormat` |
| Critical | Invalid option combinations silently fell back to the first variant | Resolved: exact matching returns `null`; impossible/sold-out values are disabled |
| Critical | Temporary cart fetch failures deleted the saved cart | Resolved: only confirmed missing/expired carts are cleared; temporary failures preserve ID and UI state |
| Critical | 3.42 MB logo dominated first-load transfer | Resolved: replaced by an 877-byte SVG crest |
| High | Mobile menu lacked dialog semantics, focus control, Escape, outside-click close, and body lock | Resolved through the shared modal behavior and tested at mobile widths |
| High | Cart lacked update/remove mutations and robust accessible dialog behavior | Resolved with direct input, +/- controls, removal, loading/error guards, focus trap, inert background, and focus restoration |
| High | Mobile product content appeared after an oversized gallery | Resolved: one primary image is followed immediately by title, price, availability, variants, quantity, and purchase actions; secondary images move below |
| High | Catalog collection state was button-only and not addressable | Resolved with `/collections/:handle`, URL query state, filters, sorting, count, empty/retry, and explicit pagination |
| High | SPA had no wildcard experience and served HTML at robots/sitemap paths | Resolved for UI, robots, and sitemap; true HTTP status limitation remains below |
| High | Production React Router dependency had two high-severity advisories | Resolved by compatible update from 7.13.1 to 7.18.1; `npm audit` now reports zero advisories |
| Medium | CSS had repeated selectors, conflicting design passes, hidden overflow, and duplicated breakpoints | Resolved through consolidated tokens/shared CSS plus focused catalog/product styles |
| Medium | Images lacked dimensions, responsive sources, and consistent lazy loading | Resolved for Shopify images; first hero/product images are eager and secondary imagery is lazy |
| Medium | Loading/error/empty feedback was uneven | Resolved with reusable states, retry actions, cart preservation messaging, form feedback, and review fallback |
| Medium | Route metadata, canonical, social tags, breadcrumbs, and product schemas were missing | Resolved client-side; server-rendering limitation remains below |
| Low | Portfolio dialog lacked keyboard containment | Resolved using the shared modal hook |
| Low | Starter assets and legacy component CSS were dead | Removed |

## 6. Dedicated mobile audit

Validated widths: 320, 375, 390, 430, 768, 1024, and 1440 px.

| Area | Result |
|---|---|
| Horizontal overflow | Automated checks pass at all seven widths; in-app 390 check reports `scrollWidth === clientWidth` |
| Header | Logo, menu, and cart remain visible; brand text collapses below 390 without losing the accessible name |
| Navigation | Full-height overlay, labeled dialog, current-route styling, focus containment, Escape/outside close, body lock |
| Hero | Fluid heading, stacked CTAs, no fixed width, image follows primary value/CTA content |
| Product page | Primary image → title/price → availability/options → quantity/actions; no thumbnail wall before purchase content |
| Catalog | Two-column cards down to 375/390/430, one column at 320, horizontally scrollable collection rail, collapsible filter controls |
| Cart | Full-width drawer at 430 and below; 44 px controls; quantities and removal usable without precision tapping |
| Touch targets | Header, banner, CTA, text links, quantities, dialogs, footer, and form controls meet or exceed 44 px |
| Type/spacing | Fluid clamps, narrower mobile gutters, reduced card padding, no desktop-only fixed values |
| Motion | Subtle transforms only; all animation/scroll effects collapse under `prefers-reduced-motion` |

## 7. Performance audit

| Build output | Before | After |
|---|---:|---:|
| Main JS | 288.70 KB raw / 87.92 KB gzip | 260.35 KB raw / 83.43 KB gzip |
| Shared CSS | 57.36 KB raw / 11.28 KB gzip | 29.13 KB raw / 7.03 KB gzip |
| Logo | 3,422.90 KB raw / 2,540.11 KB gzip | 0.877 KB SVG |
| Route splitting | None | Home, catalog, product, portfolio, policy, about/contact, 404 chunks |

Additional measures: Shopify CDN width parameters and `srcset`, explicit image dimensions, first-image priority, lazy secondary content, viewport-deferred Judge.me scripts, abortable API requests, read-query retry, long-lived hashed-asset caching, and reduced-motion support.

## 8. Accessibility audit

Implemented: skip link, semantic landmarks, one main region per route, active navigation, descriptive accessible names, labeled fields/fieldsets, selected/disabled variant state, visible focus rings, 44 px targets, dialog focus traps, Escape handling, focus restoration, inert background, body lock, polite status messaging, explicit form success/error, descriptive image fallbacks, and automated axe checks.

The automated home check reports zero serious or critical axe violations. Judge.me output should also be reviewed after it populates with production review data because third-party markup is outside direct application control.

## 9. Design system

- Typography: system sans for UI/readability; Palatino/Book Antiqua/Georgia display stack for an editorial armory voice; fluid heading clamps.
- Spacing: 4/8/12/16/24/32/48/72 px rhythm through `--space-1`…`--space-8`.
- Surfaces: near-black page, slightly lifted charcoal panels, restrained radial violet/gold atmosphere.
- Borders: translucent warm-neutral lines with stronger gold emphasis for selection/focus.
- Shadows: two elevation levels; no permanent glow or large mobile blur fields.
- Interaction: gold primary, bordered secondary, underlined-on-hover text actions, persistent keyboard focus.
- State: green availability, warm-red error/unavailable, gold selected/sale, muted disabled with line texture.
- Animation: 160–220 ms UI transitions, slower image scale only on hover, all suppressed for reduced motion.

## 10. Shopify and business assumptions to verify

1. `VITE_SHOPIFY_STORE_DOMAIN`, Storefront token, and API version exist in both Vercel Preview and Production environments.
2. Storefront API permissions include products, collections, product availability, cart create/read/update/remove, and checkout URLs.
3. Shopify Markets/currency context matches the intended selling region. The UI now displays the currency Shopify returns.
4. Sale prices are configured through Shopify prices and compare-at prices. No synthetic storefront discount remains.
5. Any separate automatic discount is correctly visible/applied in Shopify checkout; the banner intentionally makes no numeric promise.
6. Product variants represent every valid option combination and unavailable variants correctly set `availableForSale`.
7. Product `vendor`, `productType`, SEO title/description, alt text, SKU, and collection images are populated. Current live data has some blank product types and collection images.
8. Optional processing-time copy is stored in product metafield `custom.processing_time`; otherwise generic wording is shown.
9. Shipping profiles, rates, tax collection, inventory policy, return policy, and checkout branding are current in Shopify.
10. Judge.me shop domain/public token are available in both environments and the storefront domain is authorized.
11. The Resend sender is verified, the Vercel contact variables are configured, and inquiries route to the intended inbox.
12. `www.etherealarmory.com` remains canonical. The apex currently redirects to `www`.

## 11. Vercel and SEO notes

- Confirm project Root Directory is `ethereal-armory`, Build Command is `npm run build`, and Output Directory is `dist`.
- The repository has no `.vercel/project.json`, so the production branch cannot be proven locally. Verify it in Vercel Git settings before merging.
- Static files and Functions take precedence over rewrites on Vercel; the final catch-all targets `/index.html`, while `/sitemap.xml` maps to the sitemap Function.
- Product/collection route metadata and JSON-LD are client-generated. Search engines that execute JavaScript receive them; social crawlers that do not execute JavaScript will receive the default homepage OG card. Full per-product social cards would require prerendering or server rendering, which was intentionally not introduced.
- The wildcard renders a branded `noindex` 404 after SPA hydration, but the static SPA fallback still returns HTTP 200. A true HTTP 404 for arbitrary client routes would require edge/server routing with knowledge of valid Shopify handles.

## 12. Validation completed

```powershell
npm ci
npm run lint
npm run build
npm test
npm audit
npx playwright test --grep "homepage has no horizontal"
```

Results:

- clean install: passed
- ESLint: passed
- Vite 8.1.5 production build: passed
- unit tests: 9 passed
- full Playwright matrix: 17 passed, 18 intentionally skipped as viewport-independent duplicates
- added cart focus/restore and route-scroll tests: 2 passed
- final seven-width overflow/menu regression: 7 passed
- axe: zero serious/critical violations on the tested home route
- npm audit: zero vulnerabilities
- production preview: real Shopify content loaded, zero console warnings/errors, canonical/product schema verified

## 13. Preview deployment checklist

1. Review the complete diff and confirm the pre-existing `.env`, portfolio-data, and page edits belong in this branch.
2. Verify Vercel root/build/output/production-branch settings.
3. Verify Preview environment variables without exposing their values.
4. Push `storefront-platform-overhaul` and create a Vercel Preview only; do not promote it.
5. Test home, all-products, at least one collection, available product, sold-out/invalid variant, cart add/update/remove, checkout handoff, contact form, policy links, robots, sitemap, and unknown route.
6. Validate Shopify checkout currency, discounts, shipping, tax, inventory, and order creation using a permitted test order.
7. Confirm Judge.me rendering and Resend-backed contact delivery.
8. Run Lighthouse and rich-results/social-card validators against the preview URL.
9. Obtain approval, then merge into the production branch identified in Vercel.

## 14. Rollback plan

No Shopify schema or data migration is involved. Rollback is therefore application-only:

1. Redeploy the last known-good Vercel deployment or revert the overhaul commit(s).
2. Keep Shopify products, collections, carts, inventory, and checkout unchanged.
3. If the sitemap Function alone fails, remove the `/sitemap.xml` rewrite and redeploy; storefront routes remain independent.
4. If a third-party integration fails, isolate the affected Judge.me or contact-email integration while preserving Shopify commerce.

## 15. Remaining non-blocking work

- Verify all manual Shopify, Vercel, Judge.me, and Resend settings above.
- Add richer collection imagery and consistent product taxonomy/alt text in Shopify.
- Consider a later prerendering layer if per-product metadata for non-JavaScript social crawlers becomes a priority.
- Consider a true HTTP 404 edge strategy only if analytics show material crawler/SEO impact; it is not worth migrating frameworks for this alone.

## 16. Final pre-deployment review (2026-07-20)

This section records the production-commerce release review requested after the overhaul. It supersedes earlier readiness statements, build sizes, and test counts in this document where they differ. No deployment, merge, commit, Shopify configuration change, order, contact submission, or environment-value edit was made during this review.

### 16.1 Verdict

| Target | Verdict | Conditions |
|---|---|---|
| Vercel Preview | **Safe for Preview after release packaging** | No application-code blocker remains. At audit time the overhaul was entirely uncommitted; release packaging must commit only reviewed paths, remove `.env` from tracking without deleting it locally, and confirm the Vercel project, root, Node version, Preview variables, and branch target before pushing. |
| Production | **Not safe for Production yet** | A real Vercel Preview has not been created or approved. Brand, business/policy copy, automatic discount behavior, contact-email delivery, Judge.me rendering, Vercel routing, sitemap output, environment scopes, and an allowed checkout test still require owner verification. |

There are no known critical code defects remaining. The production verdict is deliberately conservative because several release and business facts cannot be established from the local repository.

### 16.2 Repository and branch state

| Item | Evidence |
|---|---|
| Current branch | `storefront-platform-overhaul` |
| Base branch | `Dev-ops` |
| HEAD / base / merge base | `4fbcd471fc68fbf09f3423c2136a93fdcbbab3cc` (`4fbcd47 Update 5-3`) |
| Branch commits | None; `git rev-list --left-right --count Dev-ops...HEAD` is `0 0` |
| Audit-start working tree | 28 tracked changes plus 31 untracked files, 59 paths total before release packaging |
| Exact tracked diff | 28 files changed, 1,637 insertions, 4,261 deletions; untracked files are not included in Git's diff statistic |
| Local `.env` | Modified before review and preserved. Release packaging removes it from Git tracking, ignores it, and retains the local file unchanged. Variable names: `VITE_SHOPIFY_STORE_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_TOKEN`, `VITE_SHOPIFY_API_VERSION`, `VITE_JUDGEME_SHOP_DOMAIN`, `VITE_JUDGEME_PUBLIC_TOKEN` |
| Generated output | `dist`, `test-results`, and `playwright-report` are ignored and not tracked |
| Vercel linkage | No `.vercel/project.json`; the connected project and Production branch cannot be proven locally |

The repository root is the parent `EtherealArmory` directory, while the app is in `ethereal-armory`. Therefore Vercel must use `ethereal-armory` as its Root Directory when connected to the parent repository.

Secret review covered the working diff and relevant repository history. No credible private-key block, Shopify Admin/private token, Vercel credential, Resend credential, customer record, or private service credential was found. A generic AWS-key-pattern scan produced one false positive inside the 3,422,909-character embedded raster-data line in the deleted `src/assets/MAINLOGO.svg`; it is encoded image data, not a plaintext credential. `.env` was historically tracked; release packaging removes it from Git tracking, adds `.env` patterns to `.gitignore`, and adds a placeholder-only `.env.example` while leaving local values intact. Its current values were not printed. Shopify Storefront and Judge.me public configuration use Vite's public `VITE_` namespace; Resend and contact-email values use server-only variables without a `VITE_` prefix. Dylan must verify public-token scopes and must never place an Admin API token, Resend API key, private Judge.me token, or other secret in a `VITE_` variable.

### 16.3 Architecture and complete changed-file review

The runtime remains React 19 + Vite 8 on Vercel. `BrowserRouter` renders a lazy route tree inside `CartProvider` and `SiteLayout`; pages call a shared Shopify Storefront GraphQL client; cart actions go through context and redirect only to Shopify's returned checkout URL. Route metadata is applied client-side by `Seo`; `/sitemap.xml` is a Vercel Function rewrite. No Liquid theme or framework migration was introduced.

| File(s) | Why changed / review disposition |
|---|---|
| `.env` | Local public storefront/review configuration. Release packaging removes it from Git tracking while preserving the local file and values. |
| `.gitignore`, `.env.example` | Ignore all local environment variants while retaining a placeholder-only example. Build/test output remains ignored. |
| `eslint.config.js` | Adds test and browser globals. Coherent and lint-clean. |
| `package.json`, `package-lock.json` | Adds React Router/Vercel Analytics and test tooling, and resolves current packages. Clean `npm ci`; no dependency advisories. |
| `index.html` | Adds default title, description, canonical, OG/Twitter metadata, theme color, and favicon. Correct homepage fallback metadata. |
| `vercel.json` | Adds immutable hashed-asset caching, brand/social-asset caching, sitemap Function rewrite, and SPA fallback. Ordering is correct for Vercel filesystem precedence; must be verified on an actual Preview. |
| `api/sitemap.js` | Generates static and Shopify product/collection URLs. Review removed the silent ten-page cap and added repeated-cursor protection. XML escaping, GET-only behavior, content type, cache policy, and safe static fallback are unit-tested. No explicit fetch timeout remains. |
| `public/brand-mark.svg` | New 877-byte crest. Efficient and visually compatible with the new system, but materially simpler than the deleted original artwork and requires Dylan's brand approval. |
| `public/og-image.png` | 52,560-byte 1200x630 social image. Correct dimensions and reasonable size. |
| `public/robots.txt` | Allows crawling and references `https://www.etherealarmory.com/sitemap.xml`. Correct if `www` remains canonical. |
| Deleted `public/favicon.svg`, `public/icons.svg`, `src/assets/react.svg`, `src/assets/vite.svg` | Starter/unused assets. No surviving import or URL reference found. |
| Deleted `src/assets/MAINLOGO.svg` | Removed 3.42 MB embedded-raster logo. No surviving reference. Replacement is performant but is a brand change, not a faithful compression of the original. |
| Deleted `src/App.css` | Legacy styling is replaced by shared and page CSS; no surviving import. |
| `src/main.jsx` | Unchanged entry: mounts React under `BrowserRouter`. Reviewed for provider/router coherence. |
| `src/App.jsx` | Replaces monolithic storefront with lazy route definitions and shared shell. All prior commerce entry points are represented; wildcard route added. |
| `src/components/SiteLayout.jsx` | Composes skip link, announcement, header, outlet, footer, cart, scroll restoration, and Vercel Analytics. Correct landmark ownership. |
| `src/components/Header.jsx` | Desktop navigation, active links, cart trigger, and mobile dialog. Shared modal behavior supplies focus trap, Escape, inert background, body lock, and restore. |
| `src/components/AnnouncementBanner.jsx` | Session-only dismissal. Copy was corrected during review to avoid claiming where Shopify applies an offer. |
| `src/components/Footer.jsx` | Navigation, policies, contact, and Shopify checkout statement. Semantics and target sizes are sound; business wording needs owner approval. |
| `src/components/CartDrawer.jsx` | Shopify cart display/update/remove/checkout. Review stabilized line identity and pending quantity focus and clarified that Shopify discounts are reflected in subtotal. |
| `src/components/ProductCard.jsx` | Shared responsive card using Shopify price, availability, dimensions, `srcset`, `sizes`, eager first row, and lazy later images. Correct. |
| `src/components/AsyncState.jsx` | Shared loading, error/retry, and empty states. Correct status semantics; loading skeleton shape is stable under deterministic data. |
| `src/components/Seo.jsx` | Route title/description/canonical/robots/OG/Twitter/JSON-LD. Correct client behavior; no-JavaScript limitation documented below. |
| `src/components/ScrollToTop.jsx` | Restores top on route changes and respects reduced motion through browser behavior. Unit/browser tested. |
| `src/components/JudgeMeReviews.jsx` | Loads fixed HTTPS Judge.me scripts only near the viewport and exposes failure feedback. Public-domain/token setup and rendered third-party markup need Preview verification. |
| `src/context/CartContext.jsx`, `src/context/cart-context.js`, `src/context/useCart.js` | Cart lifecycle and stable actions. Mutations are not retried, temporary reads preserve the saved cart, confirmed expiry recovers, and checkout uses Shopify's URL. |
| `src/hooks/useModalDialog.js` | Shared focus containment, Escape, outside close, inert background, scroll lock, and focus restoration. Used by navigation, cart, and portfolio. |
| `src/lib/shopify.js` | All Storefront GraphQL operations, cart persistence, abort timeout, safe read retry, GraphQL/user-error mapping, and pagination primitives. Reviewed query by query. |
| `src/lib/commerce.js` | Exact option matching, option availability, quantity bounds, URL catalog state, sorting, and scroll helper. Unit-tested. |
| `src/lib/pricing.js` | Currency-aware `Intl.NumberFormat` and Shopify compare-at presentation. It derives a display percentage only from Shopify price/compare-at data; it never invents a sale price. |
| `src/lib/images.js` | Adds bounded Shopify CDN width parameters and `srcset`. Correct for Shopify-hosted URLs and leaves non-Shopify URLs intact. |
| `src/config/siteSettings.js` | Central announcement/support copy. Review changed only the inaccurate discount-placement sentence after observing Shopify's automatic cart discount. |
| `src/data/portfolioData.js` | Reworked portfolio content and proof points. Technically sound; all claims/assets require owner approval. |
| `src/pages/HomePage.jsx` | Shopify-backed home collections/products, hero, trust, commission steps, fallbacks, and CTAs. Responsive screenshots reviewed. |
| `src/pages/ProductsPage.jsx`, `src/pages/ProductsPage.css` | Catalog/collection loading, collection rail, URL sort/filter state, load more, and responsive layout. Review preserved the catalog frame during API failure to prevent a severe layout collapse. Remaining scale risks are listed below. |
| `src/pages/ProductPage.jsx`, `src/pages/ProductPage.css` | Product fetch, exact variants, price/image/availability sync, quantity, add/buy, details, gallery, Judge.me, policies, and related products. Live selection/cart path verified. |
| `src/pages/PortfolioPage.jsx` | Portfolio cards and modal. Review corrected inert targeting and restored shared CTA/link styling. |
| `src/pages/AboutPage.jsx` | Studio story, brand panel, and values. Technically correct; claims require owner approval. |
| `src/pages/ContactPage.jsx` | Commission guidance and same-origin contact form. Confirmed success/reset, failure preservation, duplicate prevention, and accessible status behavior are covered. |
| `src/pages/NotFoundPage.jsx` | Branded client 404 with `noindex,follow`. Correct within the known SPA HTTP-200 limitation. |
| `src/pages/PrivacyPolicyPage.jsx`, `TermsPage.jsx`, `ShippingPolicyPage.jsx`, `ReturnsPolicyPage.jsx` | Semantic policy routes and metadata. Technically correct; legal/business substance requires Dylan's approval. |
| `src/index.css` | Consolidated tokens, shell, shared components, home/editorial/contact/policy/portfolio styles, responsive rules, focus, and reduced motion. Review restored legacy class aliases used by portfolio/policy content. |
| `playwright.config.js` | Exact required viewport projects: 320x568, 375x667, 390x844, 430x932, 768x1024, 1024x768, and 1440x900. |
| `tests/unit/cart.test.js`, `tests/unit/commerce.test.js` | Cart recovery/mutations, pricing, variants, URL state, quantities, and scroll behavior. Correct and passing. |
| `tests/unit/sitemap.test.js` | Added review coverage for more than ten pages, repeated cursors, XML escaping, content type, safe fallback, and method rejection. |
| `tests/e2e/storefront.spec.js` | Expanded route, responsive, failure, accessibility, focus, contact-email, history, CLS, screenshots, and keyboard-checkout coverage. |
| `tests/e2e/live-review.spec.js` | Opt-in live Shopify rendering/transfer probe. It now requires loaded commerce content rather than mistaking an API error state for a performance sample. Preview-network metrics remain outstanding. |
| `STOREFRONT_OVERHAUL_REPORT.md` | Architecture, implementation, and this release review. |

Large deletions were replacement-driven: the monolithic `App.jsx` behavior moved into routes/components/context; consolidated CSS replaces `App.css` and competing page rules; starter/unused assets have no remaining references. No removed Liquid, server-rendered route, customer-account flow, or Shopify checkout customization existed in the base implementation.

### 16.4 Confirmed defects fixed during this review

| Defect | Smallest safe fix | Regression evidence |
|---|---|---|
| Sitemap silently stopped after ten 250-item pages | Continue until `hasNextPage` is false; reject missing/repeated cursors | 11-page and repeated-cursor unit tests |
| Contact success could throw because React's event target was read after `await` | Capture the form before awaiting and reset that reference | Mocked API success/reset browser test |
| Portfolio modal left content in the same `main` interactive | Supply page-specific inert siblings | Inert-property browser test |
| Portfolio/policy CTA classes lost shared styles, producing weak touch targets | Alias the existing classes into the shared design primitives | 44 px CTA assertion and corrected screenshot |
| Live Shopify showed an automatic cart discount while copy implied a different application point | State only that eligible Shopify offers appear in cart or checkout; explain subtotal | Live $12.99 to $11.70 observation plus cart copy test |
| Cart quantity update remounted the line and moved focus to Close | Key by line ID, keep pending controls focusable with `aria-disabled`, stabilize context actions | Live and mocked focus-preservation checks |
| Catalog API failure collapsed a tall loading page and produced an observed 0.8566 layout shift | Keep the catalog hero/rail frame and render retry inside results | Failure-state browser test; deterministic catalog CLS <= 0.1 |

### 16.5 Prioritized remaining findings

| Priority | Finding | Release disposition |
|---|---|---|
| Critical | None known | No critical code blocker remains. |
| High | At audit time the overhaul had no commits and local `.env` was modified and tracked | Release packaging must commit only reviewed files, untrack `.env` without deleting it, and add a placeholder-only `.env.example`. |
| High | Vercel project identity, Production branch, domain assignment, and Preview/Production variables are unavailable locally | Must verify before Preview; never push this branch to a Production-tracked branch. |
| High | Brand mark is a simplified reinterpretation of the original, not a faithful optimized copy | Dylan must approve before production. |
| High | Business, policy, craftsmanship, IP/licensing, shipping, returns, commission, and automatic-discount claims are not technically provable | Dylan must approve before production. |
| High | Live contact-email delivery and visible Judge.me widget population were not exercised | Must verify in Preview to avoid sending test messages or relying on local domain authorization. |
| Medium | Catalog filters apply only to products loaded so far; load-more lacks duplicate-node/repeated-cursor/stale-response guards | Current store has 18 products and no second page, so this does not block Preview. Fix before the catalog exceeds 24 products or before relying on complete client-side filtering. |
| Medium | Product variants are limited to first 100 and cart lines to first 50 | Current observed product has few variants and normal carts are far below the cap. Verify catalog limits; paginate before those limits can be reached. |
| Medium | Sitemap has complete cursor pagination but no explicit upstream timeout and can make many requests for a very large catalog | Current 18-product/4-collection store is safe. Add a bounded fetch timeout/function-duration strategy before material catalog scale. |
| Medium | Shopify `descriptionHtml` is rendered without sanitization | It is merchant-admin-managed content, not user input. Restrict Shopify admin access/content; consider allowlist sanitization and CSP as defense in depth. |
| Medium | SPA fallback returns HTTP 200 for unknown paths and route metadata is client-generated | Known architecture limitation; verify crawler/social behavior and consider optional prerendering later. No framework migration is justified now. |
| Low | `README.md` remains the Vite starter document | Documentation debt only. |
| Low | Very small uppercase availability/card labels (down to 0.55 rem) are visually dense on narrow phones | They passed automated checks and do not block use, but should be included in owner visual approval. |

### 16.6 Commerce review

- Shopify is the sole source for product price, compare-at price, currency, availability, variant merchandise ID, cart subtotal, inventory mutation result, and checkout URL.
- `resolveVariant` requires every selected option to match exactly and returns `null` rather than an unrelated first variant. Option availability is recomputed from exact combinations.
- Selected variant price, compare-at price, availability, primary variant image (when present), and cart merchandise ID are derived from the same variant object. A manually selected gallery image can remain if a new variant has no image; this is presentational, not a merchandise mismatch.
- Read queries retry once only for timeout/network/5xx-style failures. Cart mutations explicitly set `retry: false`, so add/update/remove cannot be duplicated by automatic retry.
- A confirmed missing/expired cart is replaced. A temporary `getCart` failure preserves the saved ID and existing UI rather than deleting it.
- GraphQL top-level errors and Shopify cart `userErrors` become customer-safe failures. Mutations are guarded while pending. Inventory changes are accepted only if Shopify accepts the mutation; the UI then adopts Shopify's returned cart.
- Buy Now adds the selected quantity to the current Shopify cart once, then uses Shopify's returned checkout URL. Standard checkout uses the current returned URL. No user-supplied redirect target is accepted.
- Live data verification loaded 18 products and 4 collections, selected an exact Gold option on the Luna Snow keychain, added to cart, survived refresh, changed quantity while preserving focus, removed the line, and opened an HTTPS Shopify checkout. No purchase or customer/payment entry occurred. The temporary audit cart was cleared afterward.
- The observed Shopify automatic discount changed a $12.99 line to an $11.70 cart subtotal. The storefront does not reproduce that calculation; it displays Shopify's subtotal and neutral eligibility copy.
- Current catalog has no second page, so load-more weaknesses are dormant. URL sort and availability state passed Back/Forward tests.

### 16.7 Business claims Dylan must verify

- “Hand-finished,” “handcrafted,” “handmade,” “premium,” “independent craft studio,” and packing/craft-process statements.
- Product origin, 3D-print/resin/material statements, fan-made status, and all third-party franchise/IP and licensing language.
- Automatic discount eligibility, exclusions, dates, stacking, cart subtotal, and checkout result.
- Shipping regions, processing estimates, tracking promises, rates, tax/duty language, and Shopify shipping profiles.
- 14-day return window, custom-item exclusions, cancellation rules, damage handling, and refund timing.
- Commission workflow, response availability, design/fabrication steps, timelines, deposits, revision limits, and portfolio proof points.
- “Secure Shopify checkout” wording and actual checkout branding/domain/payment configuration.
- Product availability, SKUs, prices, compare-at prices, inventory policy, currencies/Markets, product types, alt text, SEO fields, and optional `custom.processing_time` metafield.
- Review totals, “verified” language, moderation policy, and Judge.me storefront publication.
- Every privacy, terms, shipping, and returns page as business/legal policy; this review is not legal advice.

### 16.8 SEO and routing findings

- Route titles/descriptions, `www` canonicals, OG/Twitter defaults, route robots, Organization/WebSite/Product/Breadcrumb JSON-LD, collection/product paths, scroll restoration, and branded 404 behavior are implemented.
- `public/robots.txt` references the intended `www` sitemap. Confirm that the apex redirects to `www` and that Vercel assigns the canonical domain to the correct project.
- Sitemap pagination is no longer capped, dynamic values are XML-escaped, response type is `application/xml; charset=utf-8`, non-GET is 405, and a Shopify failure returns static routes without token output.
- Vite Preview cannot execute Vercel Functions or prove rewrite precedence. `/sitemap.xml`, `/api/sitemap`, `/robots.txt`, deep-link refreshes, cache headers, and static asset precedence must be checked on the Vercel Preview URL.
- Unknown SPA routes still return the static shell with HTTP 200 before rendering a client `noindex,follow` 404. Product and route metadata are client-generated, so some non-JavaScript crawlers and social bots receive only `index.html` defaults.

### 16.9 Security and dependency findings

- Vite statically exposes every `VITE_` value to the browser. Only public Storefront/Judge.me credentials may use these names. The Storefront token must have public Storefront scopes only.
- No Admin API calls, customer-account data, payment data, API response logging, or customer-data logging exists. Sitemap logs only a sanitized error message string; the client does not log Shopify payloads.
- GraphQL operations use variables rather than interpolating handles/options. Catalog query parameters are constrained to known choices. Checkout redirects only to Shopify's returned URL.
- Contact inquiries submit to a same-origin Vercel function that validates requests server-side and uses server-only Resend configuration. The client shows success only after the provider accepts the message and otherwise preserves entered values with an accessible error state.
- Judge.me scripts use fixed HTTPS origins and public configuration. A CSP is feasible, but should begin in Report-Only because Shopify images/API, Judge.me, the contact API, and Vercel Analytics require an audited allowlist.
- `dangerouslySetInnerHTML` occurs only for Shopify-managed product description HTML. It is trusted merchant content but unsanitized; a compromised Shopify admin/content pipeline could introduce XSS.
- Cart local storage contains only a Shopify cart ID. Announcement session storage contains only a dismissed flag.
- No `target="_blank"` link or reverse-tabnabbing issue was found.
- `npm audit --json`: 0 info, low, moderate, high, or critical vulnerabilities (192 resolved dependency entries reported by npm metadata).
- Installed direct versions include React 19.2.4, React Router 7.18.1, Vite 8.1.5, Playwright 1.61.1, and axe-core 4.12.1. No deprecated/unmaintained runtime dependency was introduced.
- License inventory: MIT 121, Apache-2.0 16, ISC 10, BSD-2-Clause 6, BSD-3-Clause 2, MPL-2.0 3, CC-BY-4.0 1, Python-2.0 1. MPL/CC/Python entries are development tooling/transitives (`axe-core`, `lightningcss`, `caniuse-lite`, `argparse`), not shipped application libraries; no release blocker was found.

### 16.10 Accessibility findings

- Axe ran on home, catalog, collection, product, contact, 404, open cart, and open mobile menu at 390 px. It reported zero critical, serious, or moderate violations after route headings were ready.
- Skip link, landmarks, heading structure, visible focus, field labels, fieldsets, button names, selected/disabled variant state, status regions, and 44 px primary controls were inspected.
- Mobile navigation, cart, and portfolio use focus trapping, Escape, background inertness, body lock, outside close where appropriate, and focus restoration. The portfolio inert-selector and cart quantity focus defects were fixed and tested.
- A keyboard-only test focuses Add to Cart, activates it with Enter, traverses the modal, and reaches the secure checkout button without pointer input.
- `prefers-reduced-motion` suppresses animations/transitions and forces smooth scrolling to automatic; content is never revealed only by animation.
- Exact 200% browser zoom and a real on-screen mobile keyboard were not available through the automated viewport control. Required Preview checks: desktop 200% zoom/reflow, browser text zoom, mobile keyboard over contact fields/cart, VoiceOver/TalkBack labels, and populated Judge.me markup.

### 16.11 Responsive review

Exact screenshots and automated geometry passed at 320x568, 375x667, 390x844, 430x932, 768x1024, 1024x768, and 1440x900. Eight representative routes plus the cart drawer stayed inside each viewport. Header, announcement, hero, cards, filters, product hierarchy/gallery, cart, footer, contact, policy, portfolio, and 404 states were reviewed.

- No document-level horizontal overflow, clipped cart, text overlap, broken image box, or hidden focus ring was found at the required sizes.
- Mobile uses the menu dialog at 768 and below; desktop navigation returns above it. Cart width is bounded to the viewport and becomes effectively full width on narrow phones.
- Product purchase information appears immediately after one primary image on mobile. Secondary gallery content follows details. No sticky mobile add-to-cart exists; this is an intentional non-sticky design, not a regression.
- Collection rail scrolling is intentionally horizontal and contained; it does not create page overflow.
- Primary CTA, navigation, quantity, modal, and form controls meet 44 px. Small availability/card label text is the main visual-density watch item.
- CSS breakpoints are: shared 1200, 1024, 900, 768, 640, 430, 390, 375, 320; product 1100, 900, 640, 430, 375, 320; catalog 900, 650, 430, 320; plus reduced-motion handling.

### 16.12 Performance findings

Final Vite 8.1.5 build (59 modules, 174 ms on the final source build):

| Output | Raw | Gzip |
|---|---:|---:|
| Main JS | 260.65 KB | 83.52 KB |
| Shared CSS | 29.44 KB | 7.08 KB |
| Home JS | 6.83 KB | 2.40 KB |
| Catalog JS / CSS | 8.23 KB / 3.76 KB | 2.80 KB / 1.27 KB |
| Product JS / CSS | 11.90 KB / 6.39 KB | 4.27 KB / 1.87 KB |
| Portfolio JS | 8.53 KB | 2.67 KB |
| Largest authored image | `public/og-image.png`, 52,560 bytes (not loaded as page content) | n/a |
| Initial hero image | 44,919 bytes | PNG |
| Brand mark | 877 bytes | SVG |

The previous main/shared before figures remain 288.70 KB / 87.92 KB gzip JS and 57.36 KB / 11.28 KB gzip CSS; the 3.42 MB logo deletion is genuine. Route chunks load through React Suspense without a broken state in the route matrix.

Shopify images use width-bounded CDN URLs, responsive `srcset`/`sizes`, intrinsic dimensions, eager/high priority for primary content, and lazy loading for offscreen content. Card/media aspect ratios reserve space. A deterministic production-preview catalog test passes the good CLS threshold (`<= 0.1`). The one observed 0.8566 shift belonged to an API-failure page collapse and was fixed.

Reliable live initial request weight, Shopify image byte count, Lighthouse score, final LCP, and INP could not be produced locally: the Playwright network context intermittently failed Shopify while the controlled browser loaded all 18 products. Failed API samples are not reported as performance results. Collect these on the Vercel Preview using Lighthouse mobile and the Network/Performance panels, including cold-cache home, catalog, and product runs. The controlled live browser showed responsive interaction and preserved quantity-button focus, but that is not a lab INP measurement.

The 877-byte crest preserves the diamond/gold/violet motif but not the original artwork's complex layered linework. It is a purposeful simplified mark only if Dylan approves it; otherwise optimize a faithful brand asset before production.

### 16.13 Exact Vercel configuration

| Setting | Required value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `ethereal-armory` (when the connected repository root is `EtherealArmory`) |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | `24.x` (Vercel current default; installed Vite accepts `^20.19.0 || >=22.12.0`) |
| Production Branch | **Manual confirmation required** in Settings -> Environments -> Production -> Branch Tracking. Do not set `storefront-platform-overhaul` as Production. |
| Function | `api/sitemap.js`, reached through `/sitemap.xml` -> `/api/sitemap` |
| SPA routing | Final `/(.*)` rewrite to `/index.html`; filesystem and Function routes must take precedence |

Official references used for this release check: [Vercel builds and environment settings](https://vercel.com/docs/builds), [Vercel Git and Production branch behavior](https://vercel.com/docs/git), [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json), [Vercel Vite guidance](https://vercel.com/docs/frameworks/frontend/vite), [Vite environment exposure](https://vite.dev/guide/env-and-mode), and [Vite requirements](https://vite.dev/guide/).

Required in both Vercel Preview and Production environments (names only):

```text
VITE_SHOPIFY_STORE_DOMAIN
VITE_SHOPIFY_STOREFRONT_TOKEN
VITE_SHOPIFY_API_VERSION
VITE_JUDGEME_SHOP_DOMAIN
VITE_JUDGEME_PUBLIC_TOKEN
```

The first three are also read by the sitemap Function at runtime. Vite embeds all five into client assets at build time, so the token values must be explicitly public and a redeploy is required after changing them.

### 16.14 Preview readiness checklist

**Must fix before Preview**

1. Review the 59-path working tree and create an overhaul commit; do not stage the local `.env` modification.
2. Confirm the correct Vercel team/project and Root Directory before any push. No local project link proves this.
3. Confirm `storefront-platform-overhaul` is a Preview branch and is not the Production branch.
4. Add the five variable names above to Vercel Preview with verified public values/scopes.

**Must verify in Preview**

1. Deployment log shows Node 24.x, `npm ci`, `npm run build`, and `dist` output.
2. Home, all-products, every collection, one multi-option product, unavailable option, URL filters, Back/Forward, cart add/update/remove/refresh, and Shopify checkout handoff.
3. `/sitemap.xml` returns XML and dynamic product/collection URLs; `/api/sitemap`, `/robots.txt`, static assets, deep-link refresh, cache headers, and client 404 behave as intended.
4. Route title/description/canonical/OG/Twitter/JSON-LD changes; validate product Rich Results and social cards.
5. The contact API reaches the intended inbox through Resend; Judge.me loads reviews on the authorized Preview domain.
6. Shopify automatic discount, currency, tax/shipping transition, inventory rejection, and an allowed test order/refund workflow.
7. Lighthouse mobile cold-cache home/catalog/product runs; LCP, CLS, INP, request counts, and Shopify image bytes.
8. Keyboard-only flow, 200% zoom, mobile keyboard, screen reader smoke test, contrast, reduced motion, and third-party widget accessibility.
9. Dylan signs off on crest, screenshots, policy/business copy, product/IP claims, and portfolio claims.

**Must fix before Production**

1. Resolve every failed Preview check and record approval.
2. Confirm the release commit removes `.env` from tracking, includes only a value-free `.env.example`, verifies scopes, and rotates any credential that is not intentionally public.
3. Confirm Production environment variables, Production branch, canonical domains, rollback access, and the exact approved commit SHA.
4. Approve the simplified crest or replace it with an optimized faithful asset.
5. Obtain business/legal approval for the checklist in 16.7 and confirm live integrations/checkout.

**Nice to improve later**

- Guard catalog pagination against duplicates/repeated cursors/stale responses and implement server-complete filtering before catalog size exceeds 24.
- Paginate product variants/cart lines if store constraints can exceed 100/50.
- Trial a Report-Only CSP and Shopify-description sanitization.
- Add optional prerendered route metadata/true HTTP 404 without changing the storefront framework.
- Replace the starter README and add CI for lint, unit, Playwright, audit, and sitemap tests.

### 16.15 Files changed specifically by this review

- `api/sitemap.js`
- `src/components/CartDrawer.jsx`
- `src/config/siteSettings.js`
- `src/context/CartContext.jsx`
- `src/index.css`
- `src/pages/ContactPage.jsx`
- `src/pages/PortfolioPage.jsx`
- `src/pages/ProductsPage.jsx`
- `playwright.config.js`
- `tests/e2e/storefront.spec.js`
- `tests/e2e/live-review.spec.js`
- `tests/unit/sitemap.test.js`
- `STOREFRONT_OVERHAUL_REPORT.md`

No business price, percentage, policy, shipping promise, product description, environment value, or Shopify record was changed. The only business-facing copy changes were made after identifying the observed automatic-discount placement mismatch, and they make no numeric promise.

### 16.16 Tests and exact final results

Tests added/expanded: sitemap pagination/cursor/escaping/method behavior; contact success/reset; portfolio inertness/touch target; cart focus/discount disclosure; catalog failure frame; deterministic CLS; URL Back/Forward; responsive route/cart geometry; eight axe states; keyboard checkout reachability; opt-in live rendering metrics; and exact screenshots.

| Command/check | Result |
|---|---|
| `npm ci` | Passed; 160 packages installed; install-time audit reported 0 vulnerabilities |
| `npm run lint` | Passed with no warnings/errors |
| `npm run test:unit` | 12/12 passed |
| `npm run build` | Passed; Vite 8.1.5, 59 modules, final build 174 ms |
| Initial aggregate `npm test` wrapper | Unit tests passed and the browser runner listed its final case, but the outer command hit its 240 s timeout before a clean runner exit. It is not counted as a pass; direct Playwright binary reruns below are the release evidence. |
| Full deterministic seven-project Playwright sweep | 38 passed, 102 intentionally skipped as viewport-independent duplicates, 0 failed (1.9 min) |
| Final representative 390 px suite after fixes | 21/21 passed; supplemental keyboard checkout test 1/1 passed |
| Axe states | 8/8 states, zero critical/serious/moderate violations |
| Exact screenshot run | 8 executed screenshots/checks passed; 6 viewport-duplicate portfolio cases skipped |
| `npm audit --json` | 0 total vulnerabilities |
| `npm ls --depth=0` | Clean direct dependency tree |
| `git diff --check` | Passed; only expected Windows LF/CRLF working-copy warnings |
| Live Shopify controlled-browser flow | Product/collection browse, exact variant, add, refresh persistence, update, remove, and HTTPS Shopify checkout handoff passed; audit cart cleared |
| Opt-in Playwright live-metrics probe | Shopify failed intermittently in that browser context; catalog failure caused the now-fixed collapse and the product sample failed to load. Those transfer/LCP values were rejected rather than presented as valid performance data. |
| Contact live delivery | Not sent; mocked 200/reset passed; Preview delivery required |
| Judge.me live rendering | Region/integration code present; populated widget not confirmed; Preview required |
| Vercel sitemap rewrite | Unit logic passed; Vercel Preview required because Vite Preview does not run Vercel Functions |

### 16.17 Screenshot paths

All homepage files are exact viewport captures from the final production build. They remain external audit artifacts and are not included in the feature-branch commits:

```text
predeployment-home-320x568.png
predeployment-home-375x667.png
predeployment-home-390x844.png
predeployment-home-430x932.png
predeployment-home-768x1024.png
predeployment-home-1024x768.png
predeployment-home-1440x900.png
predeployment-portfolio-390x844.png
```

The portfolio capture is a 390 px-wide full-page image after the CTA/inert fixes. It confirms the restored button treatment and the long-page hierarchy.

### 16.18 Exact Vercel Preview procedure

1. From `storefront-platform-overhaul`, inspect `git status --short`, `git diff --check`, every untracked file, and this report.
2. Stage the intended application/report files explicitly. Do **not** stage `.env`, `dist`, `test-results`, `playwright-report`, or screenshots outside the repository.
3. Commit the reviewed overhaul. Record the commit SHA and rerun `npm ci`, `npm run lint`, `npm run test:unit`, `npm run build`, the deterministic Playwright suite, and `npm audit` from the clean commit.
4. In Vercel, open the already approved project and verify the settings in 16.13 plus the five Preview variables. Confirm Production Branch tracking does not match this branch.
5. Push only `storefront-platform-overhaul` to its remote. Let the Git integration create a Preview; do not use `vercel --prod`, promote, or assign the production domain.
6. Inspect the deployment's source SHA, environment = Preview, build logs, Functions list, domain, and deployment protection before opening it.
7. Execute every item under “Must verify in Preview,” capture Lighthouse/network results, and record failures against the exact Preview SHA.
8. Request Dylan's explicit technical, visual, business, and brand approval. A successful build alone is not approval.

### 16.19 Exact merge procedure after approval

1. Fix Preview defects on the overhaul branch; repeat validation and obtain approval on the final commit SHA.
2. Confirm the destination branch from Vercel Production Branch Tracking and repository policy; do not assume it is `main` or `Dev-ops`.
3. Ensure the working tree is clean and `.env` values are not part of the branch diff.
4. Open a pull request from `storefront-platform-overhaul` to the confirmed destination. Include this report, test results, Preview URL, approved SHA, manual Shopify/business checklist, and rollback target.
5. Require final review and branch checks. Merge only the approved SHA using the repository's chosen merge strategy.
6. Watch the resulting Vercel deployment. Verify domain, build SHA, sitemap, robots, top routes, cart, and checkout before declaring release complete.
7. Do not make follow-up Shopify pricing/policy changes during the deployment window unless separately approved and tested.

### 16.20 Exact rollback procedure

1. Before merge, record the current known-good Vercel Production deployment ID/URL and source commit.
2. If the release fails, immediately use Vercel Deployments to promote/redeploy that recorded known-good deployment, restoring the custom domain without changing Shopify data.
3. Revert the overhaul merge commit in Git with a new reviewed revert commit; do not rewrite shared history or use `git reset --hard`.
4. Confirm the rollback build SHA and smoke-test home, product, collection, cart, checkout handoff, robots, and sitemap.
5. Shopify products, inventory, carts, orders, and checkout remain untouched; no data migration needs reversal.
6. If only the sitemap fails, revert/disable the sitemap rewrite/function in a small hotfix while leaving SPA commerce routes intact.
7. If only Judge.me or contact-email delivery fails, isolate or correct that integration in a separately reviewed hotfix; do not roll back Shopify commerce data.
8. Document the incident, affected SHA, rollback deployment, customer impact, and required regression test before attempting another release.
