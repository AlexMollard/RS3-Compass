import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SKILLS, type Profile, type QuestRecord } from "./data";
import GameArt from "./GameArt";
import GameText from "./GameText";
import { Button } from "./ui";
import "./QuestLevels.css";

interface Props {
  profile: Profile;
  quest: QuestRecord;
  onSkill: (skill: string) => void;
}

export default function QuestLevels({ profile, quest, onSkill }: Props) {
  const required = quest.requirements.filter((level) => !level.recommended);
  const recommended = quest.requirements.filter((level) => level.recommended);
  return (
    <div className="quest-level-checks">
      {required.length === 0 && (
        <p className="level-check-empty">
          No required skill levels listed in this sample. Confirm the full
          requirements in-game.
        </p>
      )}
      {[
        { title: "Required levels", levels: required },
        { title: "Self-supply targets · optional", levels: recommended },
      ]
        .filter((group) => group.levels.length)
        .map((group) => (
          <section
            className="level-check-group"
            key={group.title}
            aria-label={group.title}
          >
            <h4>{group.title}</h4>
            <div className="level-check-list">
              {group.levels.map((requirement) => {
                const current = profile.levels[requirement.skill];
                const met = current != null && current >= requirement.level;
                const known = current != null;
                const status = !known
                  ? "Not recorded"
                  : met
                    ? "Met"
                    : "Below target";
                return (
                  <div
                    className={"level-check-row" + (met ? " is-met" : "")}
                    key={requirement.skill}
                  >
                    <div className="level-check-skill">
                      <GameArt file={requirement.skill + "-icon.png"} />
                      <strong>
                        <GameText text={requirement.skill} />
                      </strong>
                    </div>
                    <dl className="level-check-values">
                      <div>
                        <dt>Recorded</dt>
                        <dd>{known ? current : "—"}</dd>
                      </div>
                      <div>
                        <dt>Target</dt>
                        <dd>{requirement.level}</dd>
                      </div>
                    </dl>
                    <span
                      className={
                        "level-check-status" + (!met && known ? " below" : "")
                      }
                    >
                      {met && <CheckCircle2 size={16} />}
                      {status}
                    </span>
                    {SKILLS.some(
                      (skill) => skill.name === requirement.skill,
                    ) && (
                      <Button
                        variant="quiet"
                        className="level-check-train"
                        aria-label={"Open training for " + requirement.skill}
                        onClick={() => onSkill(requirement.skill)}
                      >
                        Train <ArrowRight size={16} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
