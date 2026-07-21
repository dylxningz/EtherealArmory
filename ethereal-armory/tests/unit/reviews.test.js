import test from "node:test";
import assert from "node:assert/strict";
import { getJudgeMeRenderState } from "../../src/lib/reviews.js";

function widget({ text = "", selectors = [] } = {}) {
  return {
    textContent: text,
    querySelector(selector) {
      if (selector === ".jdgm-rev-widg__reviews") {
        return selectors.includes("review-list") ? { querySelector: () => null } : null;
      }
      return selectors.some((item) => selector.includes(item)) ? {} : null;
    },
  };
}

test("Judge.me render state recognizes real review markup", () => {
  assert.equal(getJudgeMeRenderState(widget({ selectors: [".jdgm-rev"] })), "loaded");
});

test("Judge.me render state reports an honest empty state", () => {
  assert.equal(getJudgeMeRenderState(widget({ text: "No reviews yet" })), "empty");
  assert.equal(getJudgeMeRenderState(widget({ selectors: ["review-list"] })), "empty");
});

test("Judge.me render state waits for incomplete third-party markup", () => {
  assert.equal(getJudgeMeRenderState(widget()), "loading");
});
