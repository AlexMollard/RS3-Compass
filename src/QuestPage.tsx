import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  LockKeyhole,
  MapPin,
  Search,
} from "lucide-react";
import { QUESTS, type Profile } from "./data";
import QuestLevels from "./QuestLevels";
import GameText from "./GameText";
import {
  ActivityHeader,
  Button,
  ItemList,
  PageHeading,
  QuestNavigationCard,
  SectionHeading,
  WikiAction,
} from "./ui";
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
      <PageHeading
        title="Quest preparation"
        subtitle="Levels and items to prepare before starting a quest."
        trailing={
          <span className="badge badge-gold">
            <BookOpen size={14} /> {profile.completedQuests.length} /{" "}
            {QUESTS.length} sample quests
          </span>
        }
      />
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
              <QuestNavigationCard
                key={q.id}
                quest={q}
                completed={profile.completedQuests.includes(q.id)}
                selected={quest.id === q.id}
                onOpen={onSelect}
              />
            ))
          )}
          <p className="sample-note">
            A representative selection for design review, not the full quest
            catalogue.
          </p>
        </aside>
        <article className="panel quest-detail" key={quest.id}>
          <ActivityHeader
            title={quest.name}
            wiki={quest.wiki}
            image="Quest_icon.png"
            eyebrow={(quest.members ? "MEMBERS" : "FREE-TO-PLAY") + " QUEST"}
            meta={
              <p className="location-line">
                <MapPin size={14} /> <GameText text={quest.location} />
              </p>
            }
          />
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
            <section className="prep-reason">
              <h3>Purpose</h3>
              <p>
                <GameText text={quest.why} />
              </p>
            </section>
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
              <SectionHeading
                title="Prepare these levels"
                aside={
                  <span className="muted">Check your in-game journal</span>
                }
              />
              <QuestLevels profile={profile} quest={quest} onSkill={onSkill} />
            </section>
            <div className="quest-columns">
              <section className="detail-section">
                <h3>Gather these items</h3>
                <ItemList items={quest.supplies} />
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
                      <GameText text={r} />
                    </li>
                  ))}
                </ul>
                <small className="muted">
                  Record reward levels yourself after claiming them.
                </small>
              </section>
            </div>
            <div className="detail-actions">
              <Button
                variant="primary"
                disabled={locked}
                onClick={() => onStart(quest.id)}
              >
                Open preparation checklist <ArrowRight size={16} />
              </Button>
              <Button
                variant={complete ? "success" : "secondary"}
                aria-pressed={complete}
                onClick={() => onToggleQuest(quest.id)}
              >
                <Check size={16} />
                {complete ? "Completed · undo" : "Mark quest complete"}
              </Button>
              <WikiAction page={quest.wiki} label="Wiki walkthrough" />
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
