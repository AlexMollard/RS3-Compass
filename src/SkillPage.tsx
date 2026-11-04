import { useState } from "react";
import { ArrowRight, Check, Pickaxe, Target } from "lucide-react";
import { SKILLS, trainingStage, stageLocations, type Profile } from "./data";
import GameText from "./GameText";
import { wikiImage } from "./wiki";
import LocationGallery from "./LocationGallery";
import {
  ActivityHeader,
  Button,
  NavigationCard,
  SearchField,
  ItemList,
  PageHeading,
  SectionHeading,
  Tabs,
  ResponsivePicker,
  WikiAction,
} from "./ui";
interface Props {
  profile: Profile;
  selectedSkill: string;
  onSelect: (name: string) => void;
  onLevelChange: (skill: string, level: number) => void;
  onStart: (id: string, trainingFrom?: number) => void;
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
  onStart: (id: string, trainingFrom?: number) => void;
}) {
  const current = profile.levels[skill.name];
  const [level, setLevel] = useState(current?.toString() || "");
  const [target, setTarget] = useState(skill.goal);
  const [tab, setTab] = useState("method");
  const [band, setBand] = useState(() =>
    skill.stages.indexOf(trainingStage(skill, profile)),
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
      <ResponsivePicker label="Skill" selection={skill.name}>
        <aside className="panel journal-list">
          <SearchField
            label="Search sample skills"
            placeholder="Find a skill…"
            value={search}
            onChange={setSearch}
          />
          <p className="list-kicker">SAMPLE FIELD GUIDES</p>
          {filtered.map((s) => (
            <NavigationCard
              key={s.name}
              title={s.name}
              label={"Open training for " + s.name}
              icon={<img src={wikiImage(s.icon)} alt="" />}
              detail={s.category}
              value={profile.levels[s.name] ?? "?"}
              selected={s.name === skill.name}
              wiki={s.wiki}
              onOpen={() => onSelect(s.name)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="empty-state">No sample skills match.</p>
          )}
          <p className="sample-note">
            Sample skills, not the full training catalogue.
          </p>
        </aside>
      </ResponsivePicker>
      <article className="panel skill-detail">
        <ActivityHeader
          title={skill.name}
          wiki={skill.wiki}
          image={skill.icon}
          eyebrow={skill.category.toUpperCase()}
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
                  ? "Record your level to personalise the guide"
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
                text={message || "Manual entry · no public stat lookup"}
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
              title="Choose a training range"
              aside={<span className="muted">Sample methods</span>}
            />
            <ResponsivePicker
              label="Range"
              selection={"Levels " + stage.from + "–" + stage.to}
            >
              <div className="range-selector">
                {skill.stages.map((s, i) => (
                  <NavigationCard
                    key={s.title}
                    title={"Levels " + s.from + "–" + s.to}
                    label={"Select levels " + s.from + " to " + s.to}
                    detail={<GameText text={s.title} />}
                    selected={band === i}
                    onOpen={() => setBand(i)}
                  />
                ))}
              </div>
            </ResponsivePicker>
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
                <LocationGallery
                  locations={stageLocations(stage, profile.mode)}
                  profile={profile}
                />
                <p>
                  <GameText text={stage.method} />
                </p>
                <div className="method-note">
                  Compare full sessions, including travel and banking. No
                  measured XP/hour estimates.
                </div>
              </>
            ) : tab === "equipment" ? (
              <>
                <span className="eyebrow">TOOLS</span>
                <h3>Equipment to prepare</h3>
                <p>Use the best equipment you own and can use.</p>
                <ItemList items={stage.supplies} />
              </>
            ) : (
              <>
                <span className="eyebrow">TRAINING SESSION</span>
                <h3>Gather before you go</h3>
                <ItemList items={stage.supplies} />
                <p>Check off items and save notes in Play Companion.</p>
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
              onClick={() => onStart("train-" + skill.name, stage.from)}
            >
              Start packing <ArrowRight size={16} />
            </Button>
            <WikiAction page={skill.wiki} label="Skill reference" />
          </div>
        </div>
      </article>
    </div>
  );
}
