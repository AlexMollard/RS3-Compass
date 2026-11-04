import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import type { Profile } from "./data";
import { Button, IconButton } from "./ui";
import { wikiHref, wikiImage } from "./wiki";

export default function LevelEditor({
  profile,
  initialSkill,
  onSave,
  onDismiss,
}: {
  profile: Profile;
  initialSkill: string;
  onSave: (levels: Profile["levels"]) => void;
  onDismiss: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const initialInput = useRef<HTMLInputElement>(null);
  const [levels, setLevels] = useState(() =>
    Object.fromEntries(
      Object.entries(profile.levels).map(([name, level]) => [
        name,
        String(level),
      ]),
    ),
  );
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    initialInput.current?.focus();
    initialInput.current?.select();
    return () => element.close();
  }, []);
  const dismiss = () => {
    dialog.current?.close();
    onDismiss();
  };
  return (
    <dialog
      className="app-dialog level-editor"
      ref={dialog}
      aria-labelledby="level-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <div className="dialog-heading">
        <div>
          <h2 id="level-editor-title">Edit recorded levels</h2>
          <p>{profile.name} · manual entries</p>
        </div>
        <IconButton
          framed={false}
          label="Cancel level changes"
          onClick={dismiss}
        >
          <X size={20} />
        </IconButton>
      </div>
      <p>
        Enter your current in-game levels. This does not award XP or complete
        quests.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const next = Object.fromEntries(
            Object.entries(levels).map(([name, value]) => [
              name,
              Number(value),
            ]),
          );
          if (
            Object.values(next).some(
              (value) => !Number.isInteger(value) || value < 1 || value > 120,
            )
          )
            return;
          onSave(next);
          dismiss();
        }}
      >
        <div className="level-editor-fields">
          {Object.entries(levels).map(([name, value]) => (
            <div className="level-editor-row" key={name}>
              <label htmlFor={"recorded-level-" + name}>
                <img src={wikiImage(name + "-icon.png")} alt="" />
                {name}
              </label>
              <input
                id={"recorded-level-" + name}
                aria-label={name + " recorded level"}
                ref={name === initialSkill ? initialInput : undefined}
                type="number"
                min="1"
                max="120"
                step="1"
                required
                value={value}
                onChange={(event) =>
                  setLevels((current) => ({
                    ...current,
                    [name]: event.target.value,
                  }))
                }
              />
              <a
                href={wikiHref(name)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name + " on RuneScape Wiki"}
                title={name + " on RuneScape Wiki (opens a new tab)"}
              >
                <ExternalLink size={16} />
              </a>
            </div>
          ))}
        </div>
        <div className="detail-actions">
          <Button variant="primary" type="submit">
            Save levels
          </Button>
          <Button onClick={dismiss}>Cancel</Button>
        </div>
      </form>
    </dialog>
  );
}
