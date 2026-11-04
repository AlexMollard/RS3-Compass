import { ExternalLink } from "lucide-react";
import type { QuestRecord } from "./data";
import { LOCATIONS } from "./locations";
import { wikiHref, wikiImage } from "./wiki";

export default function QuestStart({
  quest,
  compact = false,
}: {
  quest: QuestRecord;
  compact?: boolean;
}) {
  const { start } = quest;
  const location = LOCATIONS[start.location];
  const npcHref = wikiHref(start.npcWiki);
  return (
    <article
      className={"quest-start" + (compact ? " quest-start-compact" : "")}
      aria-label={"Start " + quest.name}
    >
      <a
        className="quest-start-portrait"
        href={npcHref}
        target="_blank"
        rel="noreferrer"
      >
        <img
          src={wikiImage(start.image)}
          alt={start.npc}
          width={88}
          height={88}
          loading="lazy"
        />
      </a>
      <div className="quest-start-content">
        <span className="quest-start-label">
          {quest.members ? "Speak to · Members quest" : "Speak to"}
        </span>
        <a
          className="quest-start-npc"
          href={npcHref}
          target="_blank"
          rel="noreferrer"
        >
          {start.npc} <ExternalLink size={14} />
        </a>
        <p>
          <a href={wikiHref(location.wiki)} target="_blank" rel="noreferrer">
            {location.name}
          </a>
          {" · "}
          {start.meetingPoint}
        </p>
        {start.access && <p className="quest-start-access">{start.access}</p>}
      </div>
    </article>
  );
}
