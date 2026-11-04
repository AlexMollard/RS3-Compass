import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import {
  QUESTS,
  SKILLS,
  accessibleQuests,
  nextQuest,
  taskTitle,
  trainingStage,
  type Profile,
} from "./data";
import GameArt from "./GameArt";
import GameText from "./GameText";
import LevelEditor from "./LevelEditor";
import QuestStart from "./QuestStart";
import WorldMap from "./WorldMap";
import {
  ActivityHeader,
  Button,
  GameWindow,
  NavigationCard,
  PageHeading,
  QuestNavigationCard,
  Tabs,
  WikiAction,
} from "./ui";
import "./Journey.css";

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
  const sessionComplete = activeQuest
    ? profile.completedQuests.includes(activeQuest.id)
    : profile.completedTasks.includes(profile.activeTask);
  const activeIcon = activeQuest?.icon ?? activeSkill?.icon;
  const resumingNext = activeQuest?.id === next?.id;
  return (
    <div className="progression-page page-enter">
      <PageHeading
        title="Progression"
        trailing={
          <Button onClick={() => setEditingSkill("Mining")}>
            Update recorded levels
          </Button>
        }
      />
      <div className="home-workspace">
        {activeIcon && !resumingNext && (
          <section className="home-resume" aria-label="Current preparation">
            <span className="home-resume-label">Current preparation</span>
            <NavigationCard
              title={taskTitle(profile.activeTask)}
              label="Resume preparation"
              icon={<GameArt file={activeIcon} size={32} />}
              value={
                sessionComplete
                  ? "Completed"
                  : packed + "/" + packing.length + " packed"
              }
              onOpen={onPlay}
            />
          </section>
        )}
        <GameWindow
          className="home-next"
          title={resumingNext ? "Current quest" : "Next quest"}
        >
          {next ? (
            <div className="next-quest-workspace">
              <div className="home-preparation">
                <ActivityHeader
                  title={next.name}
                  wiki={next.wiki}
                  image={next.icon}
                  artwork={next.artwork}
                  eyebrow={next.members ? "MEMBERS" : "FREE-TO-PLAY"}
                  onOpen={() => onQuest(next.id)}
                />
                <div className="home-preparation-body">
                  <p className="home-quest-purpose">
                    <GameText text={next.why} />
                  </p>
                  <section
                    className="home-start"
                    aria-label="Quest starting point"
                  >
                    <h3>Where to start</h3>
                    <QuestStart quest={next} showMap={false} />
                  </section>
                  <div className="objective-actions">
                    <Button
                      variant="primary"
                      onClick={resumingNext ? onPlay : () => onQuest(next.id)}
                    >
                      {resumingNext ? "Resume preparation" : "Prepare quest"}{" "}
                      <ArrowRight size={18} />
                    </Button>
                    <Button
                      variant="quiet"
                      onClick={() =>
                        resumingNext ? onQuest(next.id) : onStart(next.id)
                      }
                    >
                      {resumingNext ? "Quest preparation" : "Start packing"}
                    </Button>
                    <WikiAction page={next.wiki} label="Quest Wiki" />
                  </div>
                </div>
              </div>
              <div className="home-map">
                <WorldMap point={next.start.map} npc={next.start.npc} />
              </div>
            </div>
          ) : (
            <div className="home-empty">
              <h3>Sample route complete</h3>
              <p>Browse quests or choose a skill below.</p>
            </div>
          )}
        </GameWindow>
        <details className="tool-window home-route">
          <summary className="window-title">
            <h2>Browse activities</h2>
            <span>{complete + "/" + quests.length + " quests complete"}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
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
                  icon={<GameArt file={skill.icon} size={32} />}
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
        </details>
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
                <GameArt file={name + "-icon.png"} />
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
