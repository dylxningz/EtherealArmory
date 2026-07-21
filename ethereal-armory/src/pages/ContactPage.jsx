import { useEffect, useRef, useState } from "react";
import Seo from "../components/Seo";

const endpoint = "/api/contact";
const deliveryError = "The inquiry could not be sent. Please retry or email dylangreene@etherealarmory.com directly.";

function createSubmissionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `inquiry-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function ContactPage() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const submittingRef = useRef(false);
  const statusRef = useRef(null);

  useEffect(() => {
    if (status === "success" || status === "error") statusRef.current?.focus();
  }, [status]);

  async function submit(event) {
    event.preventDefault();
    if (submittingRef.current) return;

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.originatingPage = window.location.pathname;
    payload.selectedOptions = JSON.stringify({
      projectType: payload.projectType || "",
      budget: payload.budget || "",
    });
    payload.submissionId = createSubmissionId();

    submittingRef.current = true;
    setStatus("submitting");
    setMessage("Sending your inquiry securely…");
    let failureMessage = deliveryError;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        failureMessage = result?.error || deliveryError;
        throw new Error("Submission failed.");
      }

      form.reset();
      setStatus("success");
      setMessage("Your inquiry has been sent. The studio will respond after reviewing the project details.");
    } catch {
      setStatus("error");
      setMessage(failureMessage);
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <main id="main-content" className="contact-page section-shell">
      <Seo title="Custom Builds" description="Request a custom fantasy prop, replica, or collector piece from Ethereal Armory." path="/contact" />
      <header className="page-hero"><p className="overline">Commission inquiry</p><h1>Tell us what you want to bring into the world.</h1><p>A strong brief helps the studio evaluate scale, fabrication, finish, timing, and budget without guesswork.</p></header>
      <div className="contact-layout">
        <aside className="contact-guidance"><h2>A useful brief includes</h2><ul><li>Character, object, or original concept</li><li>Reference images or artwork links</li><li>Preferred scale and intended use</li><li>Finish, color, lighting, or display goals</li><li>Deadline and working budget range</li></ul><p>Prefer email? <a href="mailto:dylangreene@etherealarmory.com">dylangreene@etherealarmory.com</a></p></aside>
        <form className="contact-form" onSubmit={submit} aria-busy={status === "submitting"}>
          <label>Name<input name="name" autoComplete="name" maxLength="120" required /></label>
          <label>Email<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
          <label>Phone number (optional)<input name="phone" type="tel" autoComplete="tel" maxLength="40" /></label>
          <label>Project type<select name="projectType" defaultValue=""><option value="" disabled>Select a project type</option><option>Replica or game-inspired prop</option><option>Original fantasy prop</option><option>Display collectible</option><option>Other custom build</option></select></label>
          <label>Item or character inspiration<input name="inspiration" maxLength="500" placeholder="Character, weapon, artifact, or original concept" /></label>
          <label>Size or dimensions<input name="dimensions" maxLength="300" placeholder="Approximate scale or intended display size" /></label>
          <label>Material or finish preferences<input name="materialFinish" maxLength="500" placeholder="Color, finish, lighting, display, or durability goals" /></label>
          <label>Budget range<select name="budget" defaultValue=""><option value="" disabled>Select a range</option><option>Under $250</option><option>$250–$500</option><option>$500–$1,000</option><option>$1,000+</option><option>Not sure yet</option></select></label>
          <label>Desired deadline<input name="deadline" maxLength="120" placeholder="Date or timing goal, if any" /></label>
          <label>Project details<textarea name="message" rows="7" maxLength="5000" required placeholder="References, intended use, and anything else that matters…" /></label>
          <button className="button button-primary" disabled={status === "submitting"} type="submit">{status === "submitting" ? "Sending inquiry…" : "Send commission inquiry"}</button>
          <p
            ref={statusRef}
            className={`form-status ${status}`}
            role={status === "error" ? "alert" : "status"}
            aria-live={status === "error" ? "assertive" : "polite"}
            tabIndex={status === "success" || status === "error" ? -1 : undefined}
          >{message}</p>
        </form>
      </div>
    </main>
  );
}
