"use client";

import { useId, useRef, useState } from "react";
import { GOLD_RIVER_CONTACT } from "@/lib/enquiry";

interface ShareActionsProps {
  /** The share link for the configuration on the page. */
  shareLink: string;
  /** The "Email Gold River" mailto: link, from enquiryMailto(). */
  enquiryHref: string;
}

const SECONDARY =
  "focus-ring inline-flex shrink-0 items-center justify-center border border-border px-4 py-2.5 text-body-sm font-medium text-text-primary transition-colors hover:border-white/30";

// The ending: copy a link that restores this exact configuration, print the
// one-page spec sheet, or send the configuration to Gold River.
export default function ShareActions({ shareLink, enquiryHref }: ShareActionsProps) {
  const linkId = useId();
  const linkInputRef = useRef<HTMLInputElement>(null);
  // The outcome belongs to the link that was copied: once the configuration
  // changes, so does its link, and "Link copied" would no longer be true.
  const [copy, setCopy] = useState<{ link: string; ok: boolean } | null>(null);
  const copyMessage =
    copy?.link !== shareLink
      ? ""
      : copy.ok
      ? "Link copied. Anyone who opens it sees this exact configuration."
      : "Couldn't copy automatically. The link is selected, so copy it with Ctrl+C or Cmd+C.";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopy({ link: shareLink, ok: true });
    } catch {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
      setCopy({ link: shareLink, ok: false });
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-body font-medium text-text-primary">Share or print it</h3>
        <p className="mt-1 text-body-sm text-text-muted">
          The link holds every choice, so it opens this configuration on any device.
        </p>
        <label htmlFor={linkId} className="mb-1.5 mt-3 block text-caption text-text-muted">
          Share link
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            ref={linkInputRef}
            id={linkId}
            type="text"
            readOnly
            value={shareLink}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 basis-48 border border-border bg-input-bg px-3 py-2 font-mono text-caption text-text-secondary focus:border-gold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright"
          />
          <button type="button" onClick={copyLink} className={SECONDARY}>
            Copy link
          </button>
        </div>
        <p role="status" aria-live="polite" className="mt-2 min-h-[1.45em] text-caption text-text-secondary">
          {copyMessage}
        </p>
        <button type="button" onClick={() => window.print()} className={`${SECONDARY} mt-2`}>
          Print spec sheet
        </button>
      </div>

      <div>
        <h3 className="text-body font-medium text-text-primary">Talk to Gold River</h3>
        <p className="mt-1 text-body-sm text-text-muted">The email lists every choice and includes your share link.</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <a
            href={enquiryHref}
            className="focus-ring inline-flex items-center justify-center bg-gold px-6 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-gold-bright"
          >
            Email Gold River
          </a>
          <a
            href={GOLD_RIVER_CONTACT.phoneHref}
            className="focus-ring inline-flex items-center justify-center border border-gold px-6 py-3 text-body-sm font-semibold text-gold transition-colors hover:bg-gold/10"
          >
            Call {GOLD_RIVER_CONTACT.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
