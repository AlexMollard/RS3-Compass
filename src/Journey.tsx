import { useState } from "react";
import { ArrowRight, ChevronDown, Focus } from "lucide-react";
import {
  QUESTS,
  SKILLS,
  accessibleQuests,
  nextQuest,
  stageLocations,
  taskTitle,
  trainingStage,
  type Profile,
} from "./data";
import GameText from "./GameText";
import { wikiImage } from "./wiki";
import LevelEditor from "./LevelEditor";
import LocationGallery from "./LocationGallery";
import QuestLevels from "./QuestLevels";
import QuestStart from "./QuestStart";
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
  const [view, setView] = useState("quests");
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const quests = accessibleQuests(profile);
  const next = nextQuest(profile);
  const complete = quests.filter((quest) =>
    profile.completedQuests.includes(quest.id),
  ).length;
  const activeQuest = QUESTS.find((quest) => quest.id === profile.activeTask);
  const activeSkill = SKILLS.find(
    (skill) => "train-" + skill.name === profile.activeTask,
  );
  const activeStage = activeSkill
    ? trainingStage(activeSkill, profile)
    : undefined;
  const packing = activeQuest?.supplies ?? activeStage?.supplies ?? [];
  const packed = packing.filter((item) =>
    profile.packed.includes(profile.activeTask + "::" + item),
  ).length;
  const activePlaces = activeStage
    ? stageLocations(activeStage, profile.mode)
    : [];
  const sessionComplete = activeQuest
    ? profile.completedQuests.includes(activeQuest.id)
    : profile.completedTasks.includes(profile.activeTask);
  return (
    <div className="progression-page page-enter">
      <PageHeading
        title="Progression"
        subtitle={profile.name + " · " + profile.kind}
        trailing={
          <Button onClick={() => setEditingSkill("Mining")}>
            Update recorded levels
          </Button>
        }
      />
      <div className="home-workspace">
        {(activeQuest || activeSkill) && (
          <GameWindow
            className="home-session"
            title="Current preparation"
            icon={<Focus size={18} />}
            trailing={
              sessionComplete
                ? "Completed"
                : packed + "/" + packing.length + " packed"
            }
          >
            <div className="home-session-body">
              <NavigationCard
                title={taskTitle(profile.activeTask)}
                label="Resume preparation"
                detail="Continue your checklist and notes."
                onOpen={onPlay}
              />
              {activeQuest ? (
                <QuestStart quest={activeQuest} compact />
              ) : (
                <LocationGallery
                  locations={activePlaces}
                  profile={profile}
                  compact
                />
              )}
            </div>
          </GameWindow>
        )}
        <GameWindow
          className="home-next"
          title="Next quest"
          icon={<img src={wikiImage("Quest_icon.png")} alt="" />}
        >
          {next ? (
            <div className="next-preparation">
              <div className="next-preparation-content">
                <h2>
                  <button
                    type="button"
                    className="objective-title"
                    onClick={() => onQuest(next.id)}
                  >
                    {next.name}
                  </button>
                </h2>
                <p>
                  <GameText text={next.why} />
                </p>
                <h3>Preparation</h3>
                <QuestLevels profile={profile} quest={next} onSkill={onSkill} />
                <div className="objective-actions">
                  <Button variant="primary" onClick={() => onQuest(next.id)}>
                    Prepare quest <ArrowRight size={18} />
                  </Button>
                  <Button variant="quiet" onClick={() => onStart(next.id)}>
                    Start packing
                  </Button>
                  <WikiAction page={next.wiki} label="Quest Wiki" />
                </div>
              </div>
              <div className="next-preparation-start">
                <QuestStart quest={next} compact />
              </div>
            </div>
          ) : (
            <div className="home-empty">
              <h3>Sample route complete</h3>
              <p>Browse quests or choose a skill below.</p>
            </div>
          )}
        </GameWindow>
        <GameWindow
          className="home-route"
          title="Browse activities"
          trailing={complete + "/" + quests.length + " quests complete"}
        >
          <Tabs
            label="Progression views"
            value={view}
            onChange={setView}
            items={[
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
              <div className="queue-column-labels">
                <span>QUEST</span>
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
            </>
          )}
          <p className="window-footnote">
            Sample activities · progress entered manually.
          </p>
        </GameWindow>
        <details className="tool-window home-levels">
          <summary className="window-title">
            <h2>Recorded levels</h2>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
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
        </details>
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
