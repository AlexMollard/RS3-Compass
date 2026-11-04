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
import { wikiHref, wikiImage } from "./wiki";
import {
  Button,
  GameWindow,
  IconButton,
  PageHeading,
  QuestNavigationCard,
  Tabs,
} from "./ui";

interface Props {
  profile: Profile;
  onStart: (id: string) => void;
  onQuest: (id: string) => void;
  onSkill: (name: string) => void;
  onPlay: () => void;
}

export default function Journey({
  profile,
  onStart,
  onQuest,
  onSkill,
  onPlay,
}: Props) {
  const [view, setView] = useState("next");
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
                <article className="training-register-row" key={skill.name}>
                  <a
                    href={wikiHref(skill.wiki)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={skill.name + " on RuneScape Wiki"}
                  >
                    <img src={wikiImage(skill.icon)} alt="" />
                  </a>
                  <div>
                    <h3>
                      <GameText text={skill.name} />
                    </h3>
                    <p>
                      <GameText text={skill.payoff} />
                    </p>
                  </div>
                  <span className="register-level">
                    {profile.levels[skill.name] ?? "?"}
                  </span>
                  <IconButton
                    label={"Open training for " + skill.name}
                    onClick={() => onSkill(skill.name)}
                  >
                    <ChevronRight size={16} />
                  </IconButton>
                </article>
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
                        <GameText text={next.name} />
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
                <div className="level-register-cell" key={name}>
                  <a
                    href={wikiHref(name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name + " on RuneScape Wiki"}
                  >
                    <img src={wikiImage(name + "-icon.png")} alt="" />
                  </a>
                  <span>
                    <GameText text={name} />
                  </span>
                  <strong>{level}</strong>
                </div>
              ))}
            </div>
            <button className="register-edit" onClick={() => onSkill("Mining")}>
              Update recorded levels <ChevronRight size={14} />
            </button>
            <p className="window-footnote">
              Manual entries · fictional sample profile
            </p>
          </GameWindow>
          <GameWindow
            className="active-register"
            title="Active preparation"
            icon={<Focus size={15} />}
          >
            <div className="active-register-body">
              <p>
                <GameText text={taskTitle(profile.activeTask)} />
              </p>
              <Button className="full-width" onClick={onPlay}>
                Resume preparation <ArrowRight size={15} />
              </Button>
            </div>
          </GameWindow>
        </aside>
      </div>
    </div>
  );
}
