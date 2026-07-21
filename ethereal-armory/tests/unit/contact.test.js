import test from "node:test";
import assert from "node:assert/strict";
import { createContactHandler } from "../../api/contact.js";

const configuredEnvironment = {
  RESEND_API_KEY: "re_test_placeholder",
  CONTACT_FROM_EMAIL: "Ethereal Armory Website <forms@updates.etherealarmory.com>",
};

const validSubmission = {
  name: "Preview Reviewer",
  email: "Reviewer@Example.com",
  phone: "555-0100",
  projectType: "Replica or game-inspired prop",
  inspiration: "A moonlit <dagger>",
  dimensions: "18 inches",
  materialFinish: "Antique silver",
  budget: "$250–$500",
  deadline: "October 2026",
  message: "Please build a display-ready prop.",
  originatingPage: "/contact",
  selectedOptions: JSON.stringify({ projectType: "Replica or game-inspired prop", budget: "$250–$500" }),
  submissionId: "123e4567-e89b-12d3-a456-426614174000",
};

function createRequest(body, overrides = {}) {
  return {
    method: "POST",
    ...overrides,
    headers: { "content-type": "application/json", ...overrides.headers },
    body,
  };
}

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createHarness({ sendResult = { data: { id: "email_accepted_123" }, error: null }, environment = configuredEnvironment } = {}) {
  const calls = [];
  const handler = createContactHandler({
    createResendClient(apiKey) {
      assert.equal(apiKey, environment.RESEND_API_KEY);
      return {
        emails: {
          async send(payload, options) {
            calls.push({ payload, options });
            return sendResult;
          },
        },
      };
    },
    getEnvironment: () => environment,
    logger: { error() {} },
    now: () => new Date("2026-07-21T18:30:00.000Z"),
  });
  return { handler, calls };
}

async function invoke(handler, request) {
  const response = createResponse();
  await handler(request, response);
  return response;
}

test("valid contact submissions send to the studio with the customer as reply-to", async () => {
  const { handler, calls } = createHarness();
  const response = await invoke(handler, createRequest(validSubmission));

  assert.equal(response.statusCode, 202);
  assert.deepEqual(response.body, { ok: true, accepted: true, id: "email_accepted_123" });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].payload.to, ["dylangreene@etherealarmory.com"]);
  assert.equal(calls[0].payload.from, configuredEnvironment.CONTACT_FROM_EMAIL);
  assert.equal(calls[0].payload.replyTo, "reviewer@example.com");
  assert.equal(calls[0].payload.subject, "New Ethereal Armory inquiry — Preview Reviewer");
  assert.match(calls[0].payload.text, /Submission timestamp:\n2026-07-21T18:30:00.000Z/);
  assert.match(calls[0].payload.text, /Phone number:\n555-0100/);
  assert.match(calls[0].payload.html, /A moonlit &lt;dagger&gt;/);
  assert.doesNotMatch(calls[0].payload.html, /A moonlit <dagger>/);
  assert.equal(calls[0].options.idempotencyKey, `contact/${validSubmission.submissionId}`);
});

test("missing required contact fields are rejected without sending", async () => {
  for (const missingField of ["email", "message"]) {
    const { handler, calls } = createHarness();
    const response = await invoke(handler, createRequest({ ...validSubmission, [missingField]: "" }));
    assert.equal(response.statusCode, 422);
    assert.equal(response.body.ok, false);
    assert.equal(calls.length, 0);
  }
});

test("malformed customer email addresses are rejected", async () => {
  const { handler, calls } = createHarness();
  const response = await invoke(handler, createRequest({ ...validSubmission, email: "not-an-email" }));
  assert.equal(response.statusCode, 422);
  assert.match(response.body.message, /valid email/i);
  assert.equal(calls.length, 0);
});

test("oversized contact payloads are rejected", async () => {
  const { handler, calls } = createHarness();
  const response = await invoke(handler, createRequest(validSubmission, { headers: { "content-length": String(40 * 1024) } }));
  assert.equal(response.statusCode, 413);
  assert.equal(calls.length, 0);
});

test("Resend rejection returns an error instead of a false success", async () => {
  const { handler, calls } = createHarness({ sendResult: { data: null, error: { message: "Provider rejected request" } } });
  const response = await invoke(handler, createRequest(validSubmission));
  assert.equal(response.statusCode, 502);
  assert.equal(response.body.ok, false);
  assert.doesNotMatch(response.body.message, /Provider rejected request/);
  assert.equal(calls.length, 1);
});

test("missing server-side email configuration fails clearly without sending", async () => {
  const { handler, calls } = createHarness({ environment: { RESEND_API_KEY: "re_test_placeholder" } });
  const response = await invoke(handler, createRequest(validSubmission));
  assert.equal(response.statusCode, 503);
  assert.match(response.body.message, /not configured/i);
  assert.equal(calls.length, 0);
});

test("unsupported methods are rejected with an Allow header", async () => {
  const { handler, calls } = createHarness();
  const response = await invoke(handler, { method: "GET", headers: {} });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
  assert.equal(calls.length, 0);
});
