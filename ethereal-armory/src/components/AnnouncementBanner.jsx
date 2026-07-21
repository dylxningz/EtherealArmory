import { useState } from "react";
import { siteSettings } from "../config/siteSettings";

export default function AnnouncementBanner() {
  const announcement = siteSettings.announcement;
  const [visible, setVisible] = useState(() => {
    if (!announcement.enabled) return false;
    try {
      return sessionStorage.getItem(announcement.storageKey) !== "dismissed";
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(announcement.storageKey, "dismissed");
    } catch {
      // Dismissal still applies for this render when storage is unavailable.
    }
    setVisible(false);
  }

  return (
    <aside className="announcement-banner" aria-label="Store announcement">
      <p>{announcement.message}</p>
      <button className="icon-button" onClick={dismiss} aria-label="Dismiss announcement" type="button">
        <span aria-hidden="true">×</span>
      </button>
    </aside>
  );
}
