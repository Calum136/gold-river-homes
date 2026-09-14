"use client";

import { useEffect, useId, useRef, useState } from "react";
import { homeModels } from "@/lib/defaults";
import type { ConfiguratorState } from "@/lib/pricing";
import {
  SAVED_NAME_MAX_LENGTH,
  deleteSavedConfiguration,
  renameSavedConfiguration,
  saveConfiguration,
} from "@/lib/saved-configs";
import type { SavedConfiguration, SaveResult } from "@/lib/saved-configs";
import { sameConfiguration } from "@/lib/share";
import { Tag } from "@/components/configurator/ui/ChoiceRow";

interface SavedConfigurationsProps {
  state: ConfiguratorState;
  /** Newest first, from lib/saved-configs.ts. */
  saves: SavedConfiguration[];
  /** The save the buyer last saved or loaded this visit, if any. */
  activeSaveId: string | null;
  /** The configuration's name, if it has one: prefills the name field. */
  activeName: string | null;
  onSaved: (save: SavedConfiguration) => void;
  onLoad: (save: SavedConfiguration) => void;
  onDeleted: (id: string) => void;
}

const BUTTON =
  "focus-ring shrink-0 border border-border px-3 py-2 text-body-sm font-medium text-text-primary transition-colors hover:border-white/30";
const INPUT =
  "min-w-0 flex-1 border border-border bg-input-bg px-3 py-2 text-body text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-bright";

function failureMessage(result: Extract<SaveResult, { ok: false }>): string {
  switch (result.reason) {
    case "empty":
      return "Give it a name first.";
    case "duplicate":
      return "Another saved configuration already has that name.";
    case "unavailable":
      return "This browser isn't letting the site save. Copy the share link instead.";
  }
}

function formatSavedAt(savedAt: string): string {
  const date = new Date(savedAt);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

// Named saves kept in this browser: save under a name, then load, rename or
// delete. Every outcome is written to one status line that screen readers
// announce.
export default function SavedConfigurations({
  state,
  saves,
  activeSaveId,
  activeName,
  onSaved,
  onLoad,
  onDeleted,
}: SavedConfigurationsProps) {
  const nameId = useId();
  const [name, setName] = useState(activeName ?? "");
  const [status, setStatus] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  // Where focus goes once the next render has put that element on the page.
  const pendingFocusId = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingFocusId.current) return;
    const target = document.getElementById(pendingFocusId.current);
    pendingFocusId.current = null;
    if (target instanceof HTMLInputElement) target.select();
    target?.focus();
  });

  const renameInputId = (id: string) => `saved-${id}-rename-input`;
  const renameButtonId = (id: string) => `saved-${id}-rename`;

  function save() {
    const result = saveConfiguration(name, state);
    if (!result.ok) {
      setStatus(failureMessage(result));
      nameInputRef.current?.focus();
      return;
    }
    setName(result.saved.name);
    onSaved(result.saved);
    setStatus(result.replaced ? `Updated “${result.saved.name}”.` : `Saved “${result.saved.name}” in this browser.`);
  }

  function load(saved: SavedConfiguration) {
    onLoad(saved);
    setName(saved.name);
    setStatus(`Loaded “${saved.name}”.`);
  }

  function startRename(saved: SavedConfiguration) {
    setRenamingId(saved.id);
    setRenameDraft(saved.name);
    pendingFocusId.current = renameInputId(saved.id);
  }

  function finishRename(id: string) {
    setRenamingId(null);
    pendingFocusId.current = renameButtonId(id);
  }

  function submitRename(saved: SavedConfiguration) {
    const result = renameSavedConfiguration(saved.id, renameDraft);
    if (!result.ok) {
      setStatus(failureMessage(result));
      document.getElementById(renameInputId(saved.id))?.focus();
      return;
    }
    if (saved.id === activeSaveId || name === saved.name) setName(result.saved.name);
    setStatus(`Renamed to “${result.saved.name}”.`);
    finishRename(saved.id);
  }

  function remove(saved: SavedConfiguration) {
    if (!deleteSavedConfiguration(saved.id)) {
      setStatus("This browser isn't letting the site change its saves.");
      return;
    }
    onDeleted(saved.id);
    setStatus(`Deleted “${saved.name}”.`);
    pendingFocusId.current = nameId;
  }

  return (
    <div>
      <h3 className="text-body font-medium text-text-primary">Save this configuration</h3>
      <p className="mt-1 text-body-sm text-text-muted">Saves stay in this browser on this device.</p>

      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label htmlFor={nameId} className="mb-1.5 block text-caption text-text-muted">
          Name
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            ref={nameInputRef}
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={SAVED_NAME_MAX_LENGTH}
            autoComplete="off"
            placeholder="For example: Our first home"
            className={INPUT}
          />
          <button type="submit" className="focus-ring shrink-0 bg-gold px-5 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-gold-bright">
            Save
          </button>
        </div>
      </form>

      <p role="status" aria-live="polite" className="mt-2 min-h-[1.45em] text-caption text-text-secondary">
        {status}
      </p>

      {saves.length > 0 && (
        <>
          <h4 className="mt-4 text-eyebrow font-medium uppercase tracking-eyebrow text-text-muted">Saved in this browser</h4>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {saves.map((saved) => {
              const isOpen = sameConfiguration(saved.state, state);
              const changedSinceSaving = !isOpen && saved.id === activeSaveId;
              const modelName = homeModels.find((m) => m.id === saved.state.modelId)?.name;
              const when = formatSavedAt(saved.savedAt);
              return (
                <li key={saved.id} className="py-3">
                  {renamingId === saved.id ? (
                    <form
                      className="flex flex-wrap gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitRename(saved);
                      }}
                    >
                      <label htmlFor={renameInputId(saved.id)} className="sr-only">
                        New name for {saved.name}
                      </label>
                      <input
                        id={renameInputId(saved.id)}
                        type="text"
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            finishRename(saved.id);
                          }
                        }}
                        maxLength={SAVED_NAME_MAX_LENGTH}
                        autoComplete="off"
                        className={INPUT}
                      />
                      <button type="submit" className={BUTTON}>
                        Save name
                      </button>
                      <button type="button" onClick={() => finishRename(saved.id)} className={BUTTON}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 break-words text-body text-text-primary">
                          {saved.name}
                          {isOpen && <Tag>Open now</Tag>}
                        </p>
                        <p className="text-caption text-text-muted">
                          {[modelName, when && `saved ${when}`].filter(Boolean).join(" · ")}
                        </p>
                        {changedSinceSaving && (
                          <p className="text-caption text-text-muted">Changed since saving. Save again to update it.</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => load(saved)} className={BUTTON}>
                          Load<span className="sr-only"> {saved.name}</span>
                        </button>
                        <button id={renameButtonId(saved.id)} type="button" onClick={() => startRename(saved)} className={BUTTON}>
                          Rename<span className="sr-only"> {saved.name}</span>
                        </button>
                        <button type="button" onClick={() => remove(saved)} className={BUTTON}>
                          Delete<span className="sr-only"> {saved.name}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
