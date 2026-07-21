import { Resend } from "resend";

const DEFAULT_TO_EMAIL = "dylangreene@etherealarmory.com";
const MAX_PAYLOAD_BYTES = 32 * 1024;
const DELIVERY_ERROR = "The inquiry could not be sent. Please retry or email dylangreene@etherealarmory.com directly.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SUBMISSION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9/_-]{7,127}$/;

const FIELD_LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  projectType: 120,
  inspiration: 500,
  dimensions: 300,
  materialFinish: 500,
  budget: 120,
  deadline: 120,
  message: 5000,
  originatingPage: 500,
  selectedOptions: 1000,
  submissionId: 128,
};

class ContactRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function normalizeText(value, field) {
  if (value === null || value === undefined) return "";
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  const normalized = Array.from(stringValue.replace(/\r\n?/g, "\n"))
    .filter((character) => character === "\n" || character === "\t" || (character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127))
    .join("")
    .trim();
  if (normalized.length > FIELD_LIMITS[field]) {
    throw new ContactRequestError(413, "One or more fields exceed the allowed length.");
  }
  return normalized;
}

function parseBody(request) {
  const declaredLength = Number(request.headers?.["content-length"] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PAYLOAD_BYTES) {
    throw new ContactRequestError(413, "The inquiry is too large to submit.");
  }

  let body = request.body;
  if (typeof body === "string") {
    if (Buffer.byteLength(body, "utf8") > MAX_PAYLOAD_BYTES) {
      throw new ContactRequestError(413, "The inquiry is too large to submit.");
    }
    try {
      body = JSON.parse(body);
    } catch {
      throw new ContactRequestError(400, "The inquiry payload is not valid JSON.");
    }
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ContactRequestError(400, "The inquiry payload is invalid.");
  }
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_PAYLOAD_BYTES) {
    throw new ContactRequestError(413, "The inquiry is too large to submit.");
  }
  return body;
}

export function validateContactSubmission(body) {
  const submission = Object.fromEntries(
    Object.keys(FIELD_LIMITS).map((field) => [field, normalizeText(body[field], field)]),
  );

  if (!submission.email || !EMAIL_PATTERN.test(submission.email)) {
    throw new ContactRequestError(422, "Enter a valid email address.");
  }
  if (!submission.message) {
    throw new ContactRequestError(422, "Tell us about the project you would like to create.");
  }
  if (!SUBMISSION_ID_PATTERN.test(submission.submissionId)) {
    throw new ContactRequestError(422, "The submission identifier is invalid. Refresh and try again.");
  }

  return { ...submission, email: submission.email.toLowerCase() };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function subjectValue(submission) {
  return (submission.name || submission.projectType || "Website inquiry")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

export function buildContactEmail(submission, timestamp) {
  const fields = [
    ["Customer name", submission.name],
    ["Customer email", submission.email],
    ["Phone number", submission.phone],
    ["Project type", submission.projectType],
    ["Item or character inspiration", submission.inspiration],
    ["Size or dimensions", submission.dimensions],
    ["Material or finish preferences", submission.materialFinish],
    ["Budget", submission.budget],
    ["Desired deadline", submission.deadline],
    ["Description or message", submission.message],
    ["Selected options", submission.selectedOptions],
    ["Originating page", submission.originatingPage],
    ["Submission timestamp", timestamp],
  ].filter(([, value]) => value);

  const htmlRows = fields.map(([label, value]) => `
    <tr>
      <th style="padding:10px 14px;text-align:left;vertical-align:top;border-bottom:1px solid #ded8cd;font-family:Arial,sans-serif;font-size:14px;color:#42382b;">${escapeHtml(label)}</th>
      <td style="padding:10px 14px;vertical-align:top;border-bottom:1px solid #ded8cd;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#17151a;white-space:pre-wrap;">${escapeHtml(value)}</td>
    </tr>`).join("");

  const text = fields.map(([label, value]) => `${label}:\n${value}`).join("\n\n");
  return {
    subject: `New Ethereal Armory inquiry — ${subjectValue(submission)}`,
    html: `<!doctype html><html><body style="margin:0;padding:24px;background:#f3f0ea;"><main style="max-width:760px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #ded8cd;"><h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:26px;color:#17151a;">New custom-build inquiry</h1><table role="presentation" style="width:100%;border-collapse:collapse;">${htmlRows}</table></main></body></html>`,
    text: `New Ethereal Armory custom-build inquiry\n\n${text}`,
  };
}

function json(response, status, body) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(body);
}

export function createContactHandler({
  createResendClient = (apiKey) => new Resend(apiKey),
  getEnvironment = () => process.env,
  logger = console,
  now = () => new Date(),
} = {}) {
  return async function contactHandler(request, response) {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return json(response, 405, { success: false, error: "Method not allowed." });
    }

    const contentType = request.headers?.["content-type"] || "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return json(response, 415, { success: false, error: "Submit the inquiry as JSON." });
    }

    try {
      const submission = validateContactSubmission(parseBody(request));
      const environment = getEnvironment();
      const apiKey = environment.RESEND_API_KEY;
      const from = environment.CONTACT_FROM_EMAIL;
      const to = environment.CONTACT_TO_EMAIL || DEFAULT_TO_EMAIL;
      if (!apiKey || !from || !EMAIL_PATTERN.test(to)) {
        logger.error("Contact email delivery is not configured.");
        return json(response, 503, { success: false, error: DELIVERY_ERROR });
      }

      const timestamp = now().toISOString();
      const email = buildContactEmail(submission, timestamp);
      const resend = createResendClient(apiKey);
      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        replyTo: submission.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }, {
        idempotencyKey: `contact/${submission.submissionId}`,
      });

      if (error || !data?.id) {
        logger.error("Contact email provider rejected the submission.");
        return json(response, 502, { success: false, error: DELIVERY_ERROR });
      }

      return json(response, 200, { success: true });
    } catch (error) {
      if (error instanceof ContactRequestError) {
        return json(response, error.status, { success: false, error: error.message });
      }
      logger.error("Contact email delivery failed unexpectedly.");
      return json(response, 500, { success: false, error: DELIVERY_ERROR });
    }
  };
}

export default createContactHandler();
