import { useState } from "react";
import { ArrowRight, BookOpen, Check, LockKeyhole } from "lucide-react";
import { QUESTS, type Profile } from "./data";
import QuestLevels from "./QuestLevels";
import GameText from "./GameText";
import QuestStart from "./QuestStart";
import {
  ActivityHeader,
  Button,
  ItemList,
  PageHeading,
  QuestNavigationCard,
  ResponsivePicker,
  SectionHeading,
  SearchField,
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
        subtitle="Check requirements and prepare for a quest."
        trailing={
          <span className="badge badge-gold">
            <BookOpen size={14} /> {profile.completedQuests.length} /{" "}
            {QUESTS.length} sample quests
          </span>
        }
      />
      <div className="journal-layout">
        <ResponsivePicker label="Quest" selection={quest.name}>
          <aside className="panel journal-list" aria-label="Sample quests">
            <SearchField
              label="Search sample quests"
              placeholder="Find a quest…"
              value={query}
              onChange={setQuery}
            />
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
              Sample quests, not the full catalogue.
            </p>
          </aside>
        </ResponsivePicker>
        <article className="panel quest-detail" key={quest.id}>
          <ActivityHeader
            title={quest.name}
            wiki={quest.wiki}
            image="Quest_icon.png"
            eyebrow={quest.members ? "MEMBERS" : "FREE-TO-PLAY"}
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
                    Switch to Members to plan this activity. Your progress is
                    kept.
                  </p>
                </div>
              </div>
            )}
            <section className="detail-section">
              <SectionHeading title="Level checks" />
              <QuestLevels profile={profile} quest={quest} onSkill={onSkill} />
            </section>
            <div className="detail-actions">
              <Button
                variant="primary"
                disabled={locked}
                onClick={() => onStart(quest.id)}
              >
                Start packing <ArrowRight size={16} />
              </Button>
            </div>
            <section className="detail-section">
              <SectionHeading title="Where to start" />
              <QuestStart quest={quest} />
            </section>
            <div className="quest-columns">
              <section className="detail-section">
                <h3>Gather these items</h3>
                <ItemList items={quest.supplies} />
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
                  Record reward levels after claiming them.
                </small>
              </section>
            </div>
            <div className="detail-actions">
              <Button
                variant={complete ? "success" : "secondary"}
                aria-pressed={complete}
                onClick={() => onToggleQuest(quest.id)}
              >
                <Check size={16} />
                {complete ? "Undo completion" : "Mark quest complete"}
              </Button>
              <WikiAction page={quest.wiki} label="Wiki walkthrough" />
            </div>
            <p className="sample-note">
              Sample guide. Check the current Wiki and in-game journal.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
