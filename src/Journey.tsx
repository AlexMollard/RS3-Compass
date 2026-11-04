import { useState } from "react";
import { ArrowRight, ChevronRight, Focus } from "lucide-react";
import {
  accessibleQuests,
  nextQuest,
  SKILLS,
  taskTitle,
  type Profile,
} from "./data";
import GameText from "./GameText";
import { wikiImage } from "./wiki";
import LevelEditor from "./LevelEditor";
import {
  Button,
  GameWindow,
  NavigationCard,
  PageHeading,
  QuestNavigationCard,
  Tabs,
  WikiAction,
} from "./ui";

interface Props {
  profile: Profile;
  onStart: (id: string) => void;
  onQuest: (id: string) => void;
  onSkill: (name: string) => void;
  onPlay: () => void;
  onLevelsChange: (levels: Profile["levels"]) => void;
}

export default function Journey({
  profile,
  onStart,
  onQuest,
  onSkill,
  onPlay,
  onLevelsChange,
}: Props) {
  const [view, setView] = useState("next");
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const quests = accessibleQuests(profile);
  const next = nextQuest(profile);
  const complete = quests.filter((quest) =>
    profile.completedQuests.includes(quest.id),
  ).length;
  return (
    <div className="progression-page page-enter">
      <PageHeading
        title="Progression"
        subtitle={
          <>
            {profile.kind} ·{" "}
            {profile.mode === "members" ? "Members" : "Free-to-play"}
          </>
        }
        trailing={
          <span className="preview-label">SAMPLE ROUTE · DESIGN PREVIEW</span>
        }
      />
      <div className="route-workspace">
        <GameWindow
          className="route-window"
          title="Progression queue"
          icon={<img src={wikiImage("Quest_icon.png")} alt="" />}
          trailing={
            <>
              {complete} / {quests.length} recorded complete
            </>
          }
        >
          <Tabs
            label="Progression views"
            value={view}
            onChange={setView}
            items={[
              { value: "next", label: "Next activity" },
              { value: "quests", label: "Quest route" },
              { value: "training", label: "Skill training" },
            ]}
          />
          {view === "training" ? (
            <div className="training-register">
              {SKILLS.map((skill) => (
                <NavigationCard
                  key={skill.name}
                  title={skill.name}
                  label={"Open training for " + skill.name}
                  icon={<img src={wikiImage(skill.icon)} alt="" />}
                  value={profile.levels[skill.name] ?? "?"}
                  detail={<GameText text={skill.payoff} />}
                  wiki={skill.wiki}
                  onOpen={() => onSkill(skill.name)}
                />
              ))}
            </div>
          ) : (
            <>
              {view === "next" && (
                <section className="pinned-objective">
                  <span className="objective-label">NEXT RECOMMENDED</span>
                  {next ? (
                    <>
                      <h3>
                        <button
                          type="button"
                          className="objective-title"
                          onClick={() => onQuest(next.id)}
                        >
                          {next.name}
                        </button>
                      </h3>
                      <p>
                        <GameText text={next.why} />
                      </p>
                      <div className="objective-actions">
                        <Button
                          variant="primary"
                          onClick={() => onStart(next.id)}
                        >
                          Prepare levels & items <ArrowRight size={15} />
                        </Button>
                        <Button
                          variant="quiet"
                          onClick={() => onQuest(next.id)}
                        >
                          View requirements <ChevronRight size={15} />
                        </Button>
                        <WikiAction page={next.wiki} label="Quest Wiki" />
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>Sample route complete</h3>
                      <p>
                        No further recommendations are included in this
                        prototype.
                      </p>
                    </>
                  )}
                </section>
              )}
              <div className="queue-column-labels">
                <span>ORDER / QUEST</span>
                <span>MAIN REWARD</span>
              </div>
              <ol className="progression-queue">
                {quests.map((quest, index) => (
                  <li key={quest.id}>
                    <QuestNavigationCard
                      quest={quest}
                      completed={profile.completedQuests.includes(quest.id)}
                      recommended={quest.id === next?.id}
                      position={index + 1}
                      variant="queue"
                      onOpen={onQuest}
                    />
                  </li>
                ))}
              </ol>
              <p className="window-footnote">
                Sample order only. Quest completion, item ownership, and reward
                claims are recorded separately.
              </p>
            </>
          )}
        </GameWindow>
        <aside className="account-register">
          <GameWindow
            className="levels-window"
            title="Recorded levels"
            trailing={profile.name}
          >
            <div className="level-register">
              {Object.entries(profile.levels).map(([name, level]) => (
                <button
                  type="button"
                  className="level-register-cell"
                  key={name}
                  aria-label={"Edit " + name + " level"}
                  title={"Edit " + name + " level"}
                  onClick={() => setEditingSkill(name)}
                >
                  <img src={wikiImage(name + "-icon.png")} alt="" />
                  <span>{name}</span>
                  <strong>{level}</strong>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="register-edit"
              onClick={() => setEditingSkill("Mining")}
            >
              Update recorded levels <ChevronRight size={14} />
            </button>
            <p className="window-footnote">
              Select a skill to edit · manual entries
            </p>
          </GameWindow>
          <GameWindow
            className="active-register"
            title="Active preparation"
            icon={<Focus size={15} />}
          >
            <div className="active-register-body">
              <NavigationCard
                title={taskTitle(profile.activeTask)}
                label="Resume preparation"
                detail="Continue the saved packing checklist and session notes."
                onOpen={onPlay}
              />
            </div>
          </GameWindow>
        </aside>
      </div>
      {editingSkill && (
        <LevelEditor
          key={profile.id}
          profile={profile}
          initialSkill={editingSkill}
          onSave={onLevelsChange}
          onDismiss={() => setEditingSkill(null)}
        />
      )}
    </div>
  );
}
