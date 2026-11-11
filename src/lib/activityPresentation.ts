import { skillByName } from "../data.ts";
import { tokenizeGameText, type GameTextReference } from "./gameText.ts";
import type { ActivityWikiArticle } from "./activityWiki.ts";
import type { PlayerEvent } from "./playerTypes.ts";

const itemEvents: Readonly<Record<string, true>> = {
  rs_plog_item_drop: true,
  rs_plog_item_found: true,
  rs_plog_item_found_nowhere: true,
};

export function activitySkillReferences(
  event: PlayerEvent,
): GameTextReference[] | undefined {
  if (
    !event.type.startsWith("rs_plog_levelup") &&
    event.type !== "rs_plog_xp_milestone"
  )
    return undefined;
  const references = new Map<string, GameTextReference>();
  for (const segment of tokenizeGameText(event.text + "\n" + event.details)) {
    if (segment.reference?.kind === "skill") {
      const reference = segment.reference;
      references.set(reference.name, {
        ...reference,
        image: skillByName(reference.name)?.icon,
      });
    }
  }
  return [...references.values()];
}

export interface ActivitySubject {
  name: string;
  kind: "item" | "quest";
  reference?: GameTextReference;
}

export function activitySubject(
  event: PlayerEvent,
): ActivitySubject | undefined {
  const kind =
    event.type === "rs_plog_quest"
      ? "quest"
      : itemEvents[event.type] === true
        ? "item"
        : undefined;
  if (!kind) return undefined;
  const match =
    kind === "quest"
      ? /^Quest complete:\s*(.+?)(?:\.{3}|…)?$/i.exec(event.text)
      : /^I found (?:an? |some )?(.+?)(?:\.)?$/i.exec(event.text);
  const name = match?.[1].trim();
  if (!name) return undefined;
  const segments = tokenizeGameText(name);
  const reference =
    segments.length === 1 && segments[0].reference?.kind === kind
      ? segments[0].reference
      : undefined;
  return { name, kind, reference };
}

export function activityReference(
  subject: ActivitySubject,
  article?: ActivityWikiArticle,
): GameTextReference {
  if (subject.reference) return subject.reference;
  return article
    ? {
        name: article.wiki,
        wiki: article.wiki,
        image: article.image,
        imageUrl: article.imageUrl,
        aliases: [subject.name],
        kind: subject.kind,
      }
    : {
        name: subject.name,
        wiki: subject.name,
        kind: subject.kind,
        search: true,
      };
}

export function activityCategory(type: string): string {
  if (type === "rs_plog_quest") return "Quest completed";
  if (type === "rs_plog_qp_milestone") return "Quest points";
  if (type.startsWith("rs_plog_levelup")) return "Level gained";
  if (type === "rs_plog_xp_milestone") return "XP milestone";
  if (type === "rs_plog_item_drop") return "Item drop";
  if (itemEvents[type] === true) return "Item found";
  if (type.startsWith("rs_plog_npc_") || type === "rs_plog_dungeons_boss_kills")
    return "Combat";
  if (type === "rs_plog_finished_trail") return "Treasure Trail";
  if (type.startsWith("rs_plog_dungeons_")) return "Dungeoneering";
  if (type === "rs_plog_champions_challenge") return "Champion's challenge";
  if (type === "rs_plog_courtcase") return "Court case";
  if (type === "rs_plog_music_milestone") return "Music unlocked";
  return "Activity";
}
