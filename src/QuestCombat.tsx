import { ExternalLink } from "lucide-react";
import type { QuestRecord } from "./data";
import GameArt from "./GameArt";
import GameText from "./GameText";
import { QUEST_COMBAT, type QuestEnemy } from "./combatData";
import { SectionHeading } from "./ui";
import { wikiHref } from "./wiki";
import "./QuestCombat.css";

function Enemies({ enemies }: { enemies: QuestEnemy[] }) {
  return (
    <ul className="quest-enemies">
      {enemies.map((enemy) => (
        <li key={enemy.wiki}>
          <a
            href={wikiHref(enemy.wiki)}
            target="_blank"
            rel="noreferrer"
            className="quest-enemy-reference"
          >
            <GameArt file={enemy.image} size={36} thumbnail />
            <span>
              <strong>{enemy.name}</strong>
              <small>Combat level {enemy.level}</small>
            </span>
            <ExternalLink size={14} />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function QuestCombat({ quest }: { quest: QuestRecord }) {
  const plan = QUEST_COMBAT[quest.id];
  return (
    <section
      className="detail-section quest-combat"
      aria-label="Combat and danger"
    >
      <SectionHeading title="Combat and danger" />
      {plan.required.length ? (
        <>
          <h4>Required fights</h4>
          <Enemies enemies={plan.required} />
        </>
      ) : (
        <p className="combat-no-fights">No required kills.</p>
      )}
      {plan.hazards.length > 0 && (
        <>
          <h4>Dangerous or optional encounters</h4>
          <Enemies enemies={plan.hazards} />
        </>
      )}
      {plan.notes.length > 0 && (
        <ul className="combat-notes">
          {plan.notes.map((note) => (
            <li key={note}>
              <GameText text={note} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
