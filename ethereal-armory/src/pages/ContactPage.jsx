import { useState } from "react";
import Seo from "../components/Seo";

const endpoint = "https://formspree.io/f/mojkodab";

export default function ContactPage() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    setMessage("");
    try {
      const response = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("The inquiry could not be sent.");
      form.reset();
      setStatus("success");
      setMessage("Your inquiry has been sent. The studio will respond after reviewing the project details.");
    } catch {
      setStatus("error");
      setMessage("Your inquiry was not sent. Please retry or email dylangreene@etherealarmory.com directly.");
    }
  }

  return (
    <main id="main-content" className="contact-page section-shell">
      <Seo title="Custom Builds" description="Request a custom fantasy prop, replica, or collector piece from Ethereal Armory." path="/contact" />
      <header className="page-hero"><p className="overline">Commission inquiry</p><h1>Tell us what you want to bring into the world.</h1><p>A strong brief helps the studio evaluate scale, fabrication, finish, timing, and budget without guesswork.</p></header>
      <div className="contact-layout">
        <aside className="contact-guidance"><h2>A useful brief includes</h2><ul><li>Character, object, or original concept</li><li>Reference images or artwork links</li><li>Preferred scale and intended use</li><li>Finish, color, lighting, or display goals</li><li>Deadline and working budget range</li></ul><p>Prefer email? <a href="mailto:dylangreene@etherealarmory.com">dylangreene@etherealarmory.com</a></p></aside>
        <form className="contact-form" onSubmit={submit}>
          <input className="form-honeypot" type="text" name="_gotcha" tabIndex="-1" autoComplete="off" aria-hidden="true" />
          <label>Name<input name="name" autoComplete="name" required /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Project type<select name="projectType" defaultValue=""><option value="" disabled>Select a project type</option><option>Replica or game-inspired prop</option><option>Original fantasy prop</option><option>Display collectible</option><option>Other custom build</option></select></label>
          <label>Budget range<select name="budget" defaultValue=""><option value="" disabled>Select a range</option><option>Under $250</option><option>$250–$500</option><option>$500–$1,000</option><option>$1,000+</option><option>Not sure yet</option></select></label>
          <label>Project details<textarea name="message" rows="7" required placeholder="References, size, use, finish, deadline, and anything else that matters…" /></label>
          <button className="button button-primary" disabled={status === "submitting"} type="submit">{status === "submitting" ? "Sending inquiry…" : "Send commission inquiry"}</button>
          <p className={`form-status ${status}`} aria-live="polite">{message}</p>
        </form>
      </div>
    </main>
  );
}
