import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  Hammer,
  MapPin,
  Pickaxe,
  Search,
  Target,
} from "lucide-react";
import { SKILLS, asset, type Profile } from "./data";
interface Props {
  profile: Profile;
  selectedSkill: string;
  onSelect: (name: string) => void;
  onLevelChange: (skill: string, level: number) => void;
  onStart: (id: string) => void;
}
export default function SkillPage({
  profile,
  selectedSkill,
  onSelect,
  onLevelChange,
  onStart,
}: Props) {
  const skill = SKILLS.find((s) => s.name === selectedSkill) || SKILLS[0];
  return (
    <div className="skill-page page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            GATHER. CREATE. BECOME SELF-SUFFICIENT.
          </span>
          <h1>
            Skill field guide<span className="heading-dot">.</span>
          </h1>
          <p className="page-subtitle">
            Train for something useful. Know your method before you leave the
            bank.
          </p>
        </div>
        <span className="badge badge-gold">
          <Pickaxe size={14} />{" "}
          {profile.mode === "members"
            ? "Members perspective"
            : "Free-world perspective"}
        </span>
      </div>
      <SkillContent
        key={skill.name}
        profile={profile}
        skill={skill}
        onSelect={onSelect}
        onLevelChange={onLevelChange}
        onStart={onStart}
      />
    </div>
  );
}
function SkillContent({
  profile,
  skill,
  onSelect,
  onLevelChange,
  onStart,
}: {
  profile: Profile;
  skill: (typeof SKILLS)[number];
  onSelect: (name: string) => void;
  onLevelChange: (name: string, level: number) => void;
  onStart: (id: string) => void;
}) {
  const current = profile.levels[skill.name];
  const [level, setLevel] = useState(current?.toString() || "");
  const [target, setTarget] = useState(skill.goal);
  const [tab, setTab] = useState("method");
  const [band, setBand] = useState(
    Math.max(
      0,
      skill.stages.findIndex(
        (s) => current != null && current >= s.from && current < s.to,
      ),
    ),
  );
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const stage = skill.stages[band];
  const filtered = SKILLS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );
  const ratio =
    current == null ? 0 : Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="journal-layout skill-layout">
      <aside className="panel journal-list">
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="Search sample skills"
            placeholder="Find a skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <p className="list-kicker">SAMPLE FIELD GUIDES</p>
        {filtered.map((s) => (
          <button
            className={
              "journal-row " + (s.name === skill.name ? "selected" : "")
            }
            key={s.name}
            onClick={() => onSelect(s.name)}
            aria-pressed={s.name === skill.name}
          >
            <img className="skill-sprite" src={asset(s.icon)} alt="" />
            <span>
              <strong>{s.name}</strong>
              <small>{s.category}</small>
            </span>
            <span className="skill-level">{profile.levels[s.name] ?? "?"}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="empty-state">No sample skills match.</p>
        )}
        <div className="field-tip">
          <Target size={21} />
          <h3>Levels with a purpose</h3>
          <p>
            Quest requirements, equipment, and useful supplies should drive the
            next training session.
          </p>
        </div>
        <p className="sample-note">
          Three representative skills for this design review. Not a complete
          training catalogue.
        </p>
      </aside>
      <article className="panel skill-detail">
        <div className="skill-titlebar">
          <div className="skill-emblem">
            <img src={asset(skill.icon)} alt="" />
          </div>
          <div>
            <span className="eyebrow">
              {skill.category.toUpperCase()} FIELD GUIDE
            </span>
            <h2>{skill.name}</h2>
            <p>{skill.description}</p>
          </div>
        </div>
        <div className="detail-body">
          <section className="skill-progress-card">
            <div className="skill-progress-top">
              <div>
                <span className="eyebrow">YOUR RECORDED LEVEL</span>
                <div className="big-level">
                  {current ?? "?"} <span>→ {target}</span>
                </div>
              </div>
              <label className="target-selector">
                Session target
                <select
                  aria-label="Training target"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                >
                  {[20, 30, 50, 99].map((n) => (
                    <option key={n} value={n}>
                      Level {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="progress-track">
              <span style={{ width: ratio + "%" }} />
            </div>
            <div className="progress-caption">
              <span>
                {current == null
                  ? "Record your level to personalise this guide"
                  : current >= target
                    ? "Recorded level target reached"
                    : target - current + " levels to your target"}
              </span>
              <span>Level progress, not XP progress</span>
            </div>
            <form
              className="level-form"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(level);
                if (!Number.isInteger(n) || n < 1 || n > 120) {
                  setMessage("Enter a whole level from 1 to 120.");
                  return;
                }
                onLevelChange(skill.name, n);
                setMessage(skill.name + " level saved on this device.");
              }}
            >
              <label>
                Update my {skill.name} level
                <input
                  aria-label={skill.name + " level"}
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  required
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </label>
              <button className="btn btn-secondary" type="submit">
                <Check size={15} /> Save level
              </button>
            </form>
            <p className="form-message" role="status">
              {message ||
                "Manual entry · sample character · no public stat lookup"}
            </p>
          </section>
          <div className="why-card">
            <span className="icon-tile">
              <Target size={19} />
            </span>
            <div>
              <span className="eyebrow">WHAT THIS TRAINING UNLOCKS</span>
              <p>{skill.payoff}</p>
            </div>
          </div>
          <section className="detail-section">
            <div className="section-heading">
              <h3>Choose your training range</h3>
              <span className="muted">Sample methods</span>
            </div>
            <div className="range-selector">
              {skill.stages.map((s, i) => (
                <button
                  key={s.title}
                  aria-pressed={band === i}
                  className={band === i ? "selected" : ""}
                  onClick={() => setBand(i)}
                >
                  <span>
                    {s.from}–{s.to}
                  </span>
                  <strong>{s.title}</strong>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </section>
          <div className="detail-tabs" aria-label="Training guide sections">
            {[
              ["method", "Method"],
              ["equipment", "Gear & tools"],
              ["supplies", "Supplies"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={tab === id}
                className={tab === id ? "selected" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <section className="training-method">
            {tab === "method" ? (
              <>
                <span className="eyebrow">
                  LEVEL {stage.from}–{stage.to}
                </span>
                <h3>{stage.title}</h3>
                <p className="location-line">
                  <MapPin size={15} />
                  {stage.location}
                </p>
                <p>{stage.method}</p>
                <div className="method-note">
                  Compare complete sessions, including gathering, travel, and
                  banking. This preview does not supply measured XP/hour
                  estimates.
                </div>
              </>
            ) : tab === "equipment" ? (
              <>
                <span className="eyebrow">PREPARE YOUR TOOLS</span>
                <h3>The right setup, self-supplied</h3>
                <p>
                  Use the best equipment you can obtain and use. A higher skill
                  level does not mean you own the upgrade.
                </p>
                <ul className="plain-list">
                  {stage.supplies.map((s) => (
                    <li key={s}>
                      <Hammer size={16} />
                      {s}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <span className="eyebrow">YOUR NEXT TRAINING SESSION</span>
                <h3>Gather before you go</h3>
                <ul className="plain-list">
                  {stage.supplies.map((s) => (
                    <li key={s}>
                      <span className="tiny-diamond" />
                      {s}
                    </li>
                  ))}
                </ul>
                <p>
                  Open Play Companion to check off the packing list and keep
                  session notes.
                </p>
              </>
            )}
          </section>
          {profile.mode === "members" && (
            <div className="notice">
              <Pickaxe size={20} />
              <div>
                <strong>Members content preview</strong>
                <p>{skill.membersNote}</p>
              </div>
            </div>
          )}
          <div className="detail-actions">
            <button
              className="btn btn-primary"
              onClick={() => onStart("train-" + skill.name)}
            >
              Start {skill.name} session <ArrowRight size={16} />
            </button>
            <a
              className="text-link"
              href={"https://runescape.wiki/w/" + skill.wiki}
              target="_blank"
              rel="noreferrer"
            >
              Skill reference <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
