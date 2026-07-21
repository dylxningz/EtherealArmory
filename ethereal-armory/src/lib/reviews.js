const emptyReviewPatterns = [
  /no reviews/i,
  /be the first to review/i,
  /0 reviews/i,
];

export function getJudgeMeRenderState(widget) {
  if (!widget) return "loading";
  if (widget.querySelector(".jdgm-rev, [data-review-id]")) return "loaded";

  const text = widget.textContent || "";
  if (emptyReviewPatterns.some((pattern) => pattern.test(text))) return "empty";

  const reviewList = widget.querySelector(".jdgm-rev-widg__reviews");
  if (reviewList && !reviewList.querySelector(".jdgm-rev, [data-review-id]")) return "empty";
  if (widget.querySelector(".jdgm-rev-widg, .jdgm-widget-actions-wrapper")) return "loaded";
  return "loading";
}
