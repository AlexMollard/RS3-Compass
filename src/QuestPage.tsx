import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import { QUESTS, asset, type Profile } from "./data";
interface Props {
  profile: Profile;
  selectedId: string;
  onSelect: (id: string) => void;
  onToggleQuest: (id: string) => void;
  onStart: (id: string) => void;
  onSkill: (name: string) => void;
}
export default function QuestPage({
  profile,
  selectedId,
  onSelect,
  onToggleQuest,
  onStart,
  onSkill,
}: Props) {
  const [query, setQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const quest = QUESTS.find((q) => q.id === selectedId) || QUESTS[1];
  const locked = quest.members && profile.mode === "f2p";
  const complete = profile.completedQuests.includes(quest.id);
  const visible = QUESTS.filter(
    (q) =>
      (profile.mode === "members" || !q.members || q.id === quest.id) &&
      q.name.toLowerCase().includes(query.toLowerCase()) &&
      (!hideCompleted || !profile.completedQuests.includes(q.id)),
  );
  return (
    <div className="quest-page page-enter">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR ADVENTURE, ONE CHAPTER AT A TIME</span>
          <h1>
            Quest journal<span className="heading-dot">.</span>
          </h1>
          <p className="page-subtitle">
            More than a checkbox. Know what to bring, and why it matters.
          </p>
        </div>
        <span className="badge badge-gold">
          <BookOpen size={14} /> {profile.completedQuests.length} /{" "}
          {QUESTS.length} sample quests
        </span>
      </div>
      <div className="journal-layout">
        <aside className="panel journal-list" aria-label="Sample quests">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Search sample quests"
              placeholder="Find a quest…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="small-checkbox">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
            />{" "}
            Hide completed
          </label>
          <p className="list-kicker">
            {profile.mode === "members"
              ? "FREE & MEMBERS QUESTS"
              : "FREE WORLD QUESTS"}
          </p>
          {visible.length === 0 ? (
            <div className="empty-state">
              No matching quests. Change your search or show completed quests.
            </div>
          ) : (
            visible.map((q) => (
              <button
                key={q.id}
                className={
                  "journal-row " + (quest.id === q.id ? "selected" : "")
                }
                aria-pressed={quest.id === q.id}
                onClick={() => onSelect(q.id)}
              >
                <span
                  className={
                    "quest-state " +
                    (profile.completedQuests.includes(q.id)
                      ? "is-complete"
                      : "")
                  }
                >
                  {profile.completedQuests.includes(q.id) ? (
                    <Check size={15} />
                  ) : (
                    <BookOpen size={15} />
                  )}
                </span>
                <span>
                  <strong>{q.name}</strong>
                  <small>
                    {q.members ? "Members" : "Free-to-play"} · {q.difficulty}
                  </small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))
          )}
          <p className="sample-note">
            A representative selection for design review, not the full quest
            catalogue.
          </p>
        </aside>
        <article className="panel quest-detail" key={quest.id}>
          <div className="detail-art">
            <img src={asset(quest.image)} alt="" />
            <div className="detail-art-shade" />
            <div>
              <span className="badge">
                {quest.members ? "MEMBERS" : "FREE-TO-PLAY"} QUEST
              </span>
              <h2>{quest.name}</h2>
              <p>
                <MapPin size={14} /> {quest.location}
              </p>
            </div>
          </div>
          <div className="detail-body">
            <div className="quest-facts">
              <span>
                <BookOpen size={15} />
                {quest.difficulty}
              </span>
              <span>{quest.length}</span>
              <span className={complete ? "text-green" : ""}>
                {complete ? "Completed" : "Not recorded complete"}
              </span>
            </div>
            <p className="intro-copy">{quest.description}</p>
            <div className="why-card">
              <span className="icon-tile">
                <ShieldCheck size={20} />
              </span>
              <div>
                <span className="eyebrow">WHY THIS BELONGS ON YOUR ROUTE</span>
                <p>{quest.why}</p>
              </div>
            </div>
            {locked && (
              <div className="notice">
                <LockKeyhole size={18} />
                <div>
                  <strong>Membership required</strong>
                  <p>
                    Your progress is kept. Switch the character to Members to
                    plan this activity.
                  </p>
                </div>
              </div>
            )}
            <section className="detail-section">
              <div className="section-heading">
                <h3>Before you set out</h3>
                <span className="muted">Check your in-game journal</span>
              </div>
              <div className="requirement-grid">
                {quest.requirements.length === 0 ? (
                  <div className="requirement">
                    <CheckCircle2 size={17} />
                    <div>
                      <strong>No skill levels listed in this sample</strong>
                      <small>
                        This does not confirm quest, combat, or item readiness.
                      </small>
                    </div>
                  </div>
                ) : (
                  quest.requirements.map((r) => {
                    const level = profile.levels[r.skill];
                    const met = level != null && level >= r.level;
                    return (
                      <button
                        key={r.skill}
                        className={"requirement " + (met ? "met" : "missing")}
                        onClick={() => onSkill(r.skill)}
                      >
                        <span className="level-disc">{r.level}</span>
                        <span>
                          <strong>
                            {r.skill}
                            {r.recommended ? " · self-supply" : ""}
                          </strong>
                          <small>
                            {level == null
                              ? "Your level is unknown"
                              : "Recorded level " + level}
                            {r.recommended ? " · recommended" : " · required"}
                          </small>
                        </span>
                        {met ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          <ArrowRight size={17} />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              {quest.id === "dragon-slayer" && (
                <p className="notice-inline">
                  33 quest points are required. This prototype does not
                  calculate or verify your quest-point total.
                </p>
              )}
            </section>
            <div className="quest-columns">
              <section className="detail-section">
                <h3>Pack for the journey</h3>
                <ul className="plain-list">
                  {quest.supplies.map((s) => (
                    <li key={s}>
                      <span className="tiny-diamond" />
                      {s}
                    </li>
                  ))}
                </ul>
                <small className="muted">
                  Packing checks are saved in Play Companion.
                </small>
              </section>
              <section className="detail-section">
                <h3>What you gain</h3>
                <ul className="plain-list reward-list">
                  {quest.rewards.map((r) => (
                    <li key={r}>
                      <Check size={14} />
                      {r}
                    </li>
                  ))}
                </ul>
                <small className="muted">
                  Record reward levels yourself after claiming them.
                </small>
              </section>
            </div>
            <div className="detail-actions">
              <button
                className="btn btn-primary"
                disabled={locked}
                onClick={() => onStart(quest.id)}
              >
                Plan this quest <ArrowRight size={16} />
              </button>
              <button
                className={
                  "btn " + (complete ? "btn-success" : "btn-secondary")
                }
                aria-pressed={complete}
                onClick={() => onToggleQuest(quest.id)}
              >
                <Check size={16} />
                {complete ? "Completed · undo" : "Mark quest complete"}
              </button>
              <a
                className="text-link"
                href={"https://runescape.wiki/w/" + quest.wiki}
                target="_blank"
                rel="noreferrer"
              >
                Wiki walkthrough <ExternalLink size={13} />
              </a>
            </div>
            <p className="sample-note">
              Illustrative planning content adapted from the existing guide.
              Consult the current Wiki and in-game journal before playing.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
