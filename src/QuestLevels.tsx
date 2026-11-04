import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { SKILLS, type Profile, type QuestRecord } from "./data";
import GameText from "./GameText";
import { IconButton } from "./ui";

interface Props {
  profile: Profile;
  quest: QuestRecord;
  onSkill: (skill: string) => void;
}

export default function QuestLevels({ profile, quest, onSkill }: Props) {
  return (
    <>
      <div className="requirement-grid">
        {quest.requirements.length === 0 ? (
          <div className="requirement">
            <Info size={17} />
            <div>
              <strong>No skill levels listed in this sample</strong>
              <small>
                Confirm the full requirements in your in-game journal.
              </small>
            </div>
          </div>
        ) : (
          quest.requirements.map((requirement) => {
            const level = profile.levels[requirement.skill];
            const met = level != null && level >= requirement.level;
            return (
              <div
                key={requirement.skill}
                className={"requirement " + (met ? "met" : "missing")}
              >
                <span className="level-disc">{requirement.level}</span>
                <span>
                  <strong>
                    <GameText text={requirement.skill} />
                    {requirement.recommended ? " · self-supply" : ""}
                  </strong>
                  <small>
                    {level == null
                      ? "Your level is unknown"
                      : "Recorded level " + level}
                    {requirement.recommended ? " · recommended" : " · required"}
                  </small>
                </span>
                {met && <CheckCircle2 size={17} />}
                {SKILLS.some((skill) => skill.name === requirement.skill) && (
                  <IconButton
                    label={"Open training for " + requirement.skill}
                    onClick={() => onSkill(requirement.skill)}
                  >
                    <ArrowRight size={17} />
                  </IconButton>
                )}
              </div>
            );
          })
        )}
      </div>
      {quest.id === "dragon-slayer" && (
        <p className="notice-inline">
          33 quest points required. Check your total in-game.
        </p>
      )}
    </>
  );
}
