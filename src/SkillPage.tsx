import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  MapPin,
  Pickaxe,
  Search,
  Target,
} from "lucide-react";
import { SKILLS, type Profile } from "./data";
import GameText from "./GameText";
import { wikiHref, wikiImage } from "./wiki";
import {
  ActivityHeader,
  Button,
  IconButton,
  ItemList,
  PageHeading,
  SectionHeading,
  Tabs,
  WikiAction,
} from "./ui";
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
      <PageHeading
        title="Skills"
        subtitle="Methods, equipment, and supplies for the selected skill."
        trailing={
          <span className="badge badge-gold">
            <Pickaxe size={14} />{" "}
            {profile.mode === "members" ? "Members methods" : "F2P methods"}
          </span>
        }
      />
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
          <div
            className={
              "journal-row " + (s.name === skill.name ? "selected" : "")
            }
            key={s.name}
          >
            <a
              href={wikiHref(s.wiki)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name + " on RuneScape Wiki"}
            >
              <img className="skill-sprite" src={wikiImage(s.icon)} alt="" />
            </a>
            <span>
              <strong>
                <GameText text={s.name} />
              </strong>
              <small>{s.category}</small>
            </span>
            <span className="skill-level">{profile.levels[s.name] ?? "?"}</span>
            <IconButton
              label={"Open training for " + s.name}
              aria-pressed={s.name === skill.name}
              onClick={() => onSelect(s.name)}
            >
              <ChevronRight size={15} />
            </IconButton>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="empty-state">No sample skills match.</p>
        )}
        <div className="field-tip">
          <Target size={21} />
          <h3>Training targets</h3>
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
        <ActivityHeader
          title={skill.name}
          wiki={skill.wiki}
          image={skill.icon}
          eyebrow={skill.category.toUpperCase() + " FIELD GUIDE"}
          meta={
            <p>
              <GameText text={skill.description} />
            </p>
          }
        />
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
                Update recorded level
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
              <Button type="submit">
                <Check size={15} /> Save level
              </Button>
            </form>
            <p className="form-message" role="status">
              <GameText
                text={
                  message ||
                  "Manual entry · sample character · no public stat lookup"
                }
              />
            </p>
          </section>
          <div className="why-card">
            <span className="icon-tile">
              <Target size={19} />
            </span>
            <div>
              <span className="eyebrow">WHAT THIS TRAINING UNLOCKS</span>
              <p>
                <GameText text={skill.payoff} />
              </p>
            </div>
          </div>
          <section className="detail-section">
            <SectionHeading
              title="Choose your training range"
              aside={<span className="muted">Sample methods</span>}
            />
            <div className="range-selector">
              {skill.stages.map((s, i) => (
                <div
                  className={"range-row " + (band === i ? "selected" : "")}
                  key={s.title}
                >
                  <span>
                    {s.from}–{s.to}
                  </span>
                  <strong>
                    <GameText text={s.title} />
                  </strong>
                  <IconButton
                    label={"Select levels " + s.from + " to " + s.to}
                    aria-pressed={band === i}
                    onClick={() => setBand(i)}
                  >
                    <ChevronRight size={15} />
                  </IconButton>
                </div>
              ))}
            </div>
          </section>
          <Tabs
            variant="detail"
            label="Training guide sections"
            value={tab}
            onChange={setTab}
            items={[
              { value: "method", label: "Method" },
              { value: "equipment", label: "Gear & tools" },
              { value: "supplies", label: "Supplies" },
            ]}
          />
          <section className="training-method">
            {tab === "method" ? (
              <>
                <span className="eyebrow">
                  LEVEL {stage.from}–{stage.to}
                </span>
                <h3>
                  <GameText text={stage.title} />
                </h3>
                <p className="location-line">
                  <MapPin size={15} />
                  <GameText text={stage.location} />
                </p>
                <p>
                  <GameText text={stage.method} />
                </p>
                <div className="method-note">
                  Compare complete sessions, including gathering, travel, and
                  banking. This preview does not supply measured XP/hour
                  estimates.
                </div>
              </>
            ) : tab === "equipment" ? (
              <>
                <span className="eyebrow">PREPARE YOUR TOOLS</span>
                <h3>Equipment to prepare</h3>
                <p>
                  Use the best equipment you can obtain and use. A higher skill
                  level does not mean you own the upgrade.
                </p>
                <ItemList items={stage.supplies} />
              </>
            ) : (
              <>
                <span className="eyebrow">YOUR NEXT TRAINING SESSION</span>
                <h3>Gather before you go</h3>
                <ItemList items={stage.supplies} />
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
                <p>
                  <GameText text={skill.membersNote} />
                </p>
              </div>
            </div>
          )}
          <div className="detail-actions">
            <Button
              variant="primary"
              onClick={() => onStart("train-" + skill.name)}
            >
              Start training session <ArrowRight size={16} />
            </Button>
            <WikiAction page={skill.wiki} label="Skill reference" />
          </div>
        </div>
      </article>
    </div>
  );
}
