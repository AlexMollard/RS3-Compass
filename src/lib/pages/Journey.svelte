<script lang="ts">
  import { progressionQuests, nextQuest, SKILLS } from "../../data";
  import type { QuestRecord } from "../../data";
  import { LOCATIONS } from "../../locations";
  import { wikiHref } from "../../wiki";
  import { getCompass } from "../compassContext";
  import { questPath, skillPath } from "../navigation";
  import { closeToUnlocking, questReadiness } from "../questReadiness";
  import SkillGrid from "../components/SkillGrid.svelte";
  import GameText from "../components/GameText.svelte";
  import GameArt from "../components/GameArt.svelte";
  import WorldMap from "../components/WorldMap.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import WikiAction from "../components/WikiAction.svelte";
  import PlayerStatistics from "../components/PlayerStatistics.svelte";
  import RecentActivity from "../components/RecentActivity.svelte";
  import ReadinessTiles from "../components/ReadinessTiles.svelte";
  import "../../Journey.css";
  const controller = getCompass();
  const saved = controller.state;
  const kindLabel = { quest: "Quest", miniquest: "Miniquest", saga: "Saga" };
  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let quests = $derived(progressionQuests(profile));
  let next = $derived(nextQuest(profile));
  let done = (quest: QuestRecord) => profile.completedQuests.includes(quest.id);
  let complete = $derived(quests.filter(done).length);
  let percent = $derived(
    quests.length ? Math.round((complete / quests.length) * 100) : 0,
  );
  let nextIndex = $derived(next ? quests.indexOf(next) : -1);
  let route = $derived.by(() => {
    if (!next) return [];
    const previous = quests.slice(0, nextIndex).findLast(done);
    const following = quests
      .slice(nextIndex + 1)
      .filter((q) => !done(q))
      .slice(0, 2);
    return [previous, next, ...following].filter(
      (q): q is QuestRecord => q !== undefined,
    );
  });
  let readiness = $derived(next ? questReadiness(next, profile) : null);
  let unlocking = $derived(closeToUnlocking(quests, profile));
  let recorded = $derived(
    SKILLS.filter((s) => profile.levels[s.name] !== undefined).length,
  );
  let totalLevel = $derived(
    SKILLS.reduce((sum, s) => sum + (profile.levels[s.name] ?? 0), 0),
  );
  const kindOf = (q: QuestRecord) => kindLabel[q.kind ?? "quest"];
  const skillIcon = (name: string) => SKILLS.find((s) => s.name === name)?.icon;
</script>

<div class="progression-page page-enter">
  <PageHeading
    title="Your route"
    subtitle={`${complete} of ${quests.length} ${profile.mode === "f2p" ? "free-to-play " : ""}activities complete`}
  >
    {#snippet trailing()}<div
        class="route-progress"
        role="progressbar"
        aria-label="Route progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span class="route-progress-track"
          ><span style:width={percent + "%"}></span></span
        ><span class="route-progress-value">{percent}%</span>
      </div>{/snippet}
  </PageHeading>
  <div class="home-trim" aria-hidden="true"></div>

  <div class="home-workspace">
    <div class="two">
      <GameWindow
        className="home-next"
        icon="Quest.png"
        title={next?.id === profile.activeTask ? "Current quest" : "Next quest"}
        trailing={next ? "Route step " + (nextIndex + 1) : undefined}
      >
        {#if next && readiness}
          {@const start = next.start}
          {@const location = LOCATIONS[start.location]}
          <div class="next-quest">
            <div class="next-quest-visual">
              <a
                class="next-quest-art"
                href={wikiHref(next.wiki)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={next.name + " artwork on RuneScape Wiki"}
                ><GameArt
                  file={next.artwork}
                  size={300}
                  thumbnail
                  className="next-quest-image"
                /></a
              >
              <div class="next-quest-map">
                <WorldMap point={start.map} label={start.npc} />
              </div>
            </div>
            <div class="next-quest-body">
              <span class="eyebrow"
                >{next.members ? "Members" : "Free-to-play"} · {kindOf(
                  next,
                )}</span
              >
              <h3 class="next-quest-title">{next.name}</h3>
              <p class="next-quest-why"><GameText text={next.why} /></p>
              <ReadinessTiles {readiness} />
              <div class="next-quest-start">
                <GameArt file={start.image} alt="" size={48} thumbnail />
                <span
                  ><span class="cap">Speak to</span><br /><a
                    href={wikiHref(start.npcWiki)}
                    target="_blank"
                    rel="noopener noreferrer"><strong>{start.npc}</strong></a
                  >, {location?.name ?? start.location}</span
                >
              </div>
              <div class="next-quest-actions">
                <a class="btn btn-primary" href={questPath(next.id)}
                  >Prepare quest →</a
                >
                <WikiAction page={next.wiki} label="Quest Wiki" />
              </div>
            </div>
          </div>
        {:else}<div class="home-empty">
            <h3>Regular route complete</h3>
            <p>Browse quests or choose a skill below.</p>
          </div>{/if}
      </GameWindow>

      <GameWindow
        className="home-route"
        icon="Quest_map_icon.png"
        title="Route"
        trailing={profile.mode === "f2p" ? "F2P order" : "Members order"}
      >
        {#if route.length}
          <ol class="route-list">
            {#each route as quest (quest.id)}
              {@const state = done(quest)
                ? "done"
                : quest.id === next?.id
                  ? "now"
                  : "later"}
              <li class="route-step route-{state}">
                <span class="route-node" aria-hidden="true"></span>
                <a href={questPath(quest.id)}>
                  <GameArt file={quest.icon} size={28} />
                  <span class="route-name">
                    <span class="route-title">{quest.name}</span>
                    <span class="cap"
                      >{state === "done"
                        ? "Complete"
                        : kindOf(quest) +
                          " · " +
                          (state === "now" ? "next" : quest.difficulty)}</span
                    >
                  </span>
                </a>
              </li>
            {/each}
          </ol>
        {:else}<p class="route-empty">Nothing left on this route.</p>{/if}
        <a class="route-all" href="/quests">See all {quests.length} activities</a>
      </GameWindow>
    </div>

    <div class="two">
      <GameWindow
        className="home-skills"
        icon="Skills_icon.png"
        title="Skills"
        trailing={`${recorded} of ${SKILLS.length} recorded${recorded ? " · total " + totalLevel : ""}`}
      >
        {#if profile.source === "hiscores"}<div class="home-statistics">
            <PlayerStatistics {profile} />
          </div>{/if}
        <div class="home-skill-grid">
          <SkillGrid
            compact
            skills={SKILLS}
            levels={profile.levels}
            label="Skill levels"
          />
        </div>
        <p class="cap home-skill-note">
          Levels shown as ? are not recorded yet. Compass never treats them as
          zero. <a href="/levels">Update levels</a>
        </p>
      </GameWindow>

      <div class="home-side">
        <GameWindow className="home-unlocks" title="Close to unlocking">
          {#if unlocking.length}
            <ul class="unlock-list">
              {#each unlocking as row (row.quest.id + row.skill)}
                {@const icon = skillIcon(row.skill)}
                <li>
                  {#if icon}<GameArt file={icon} size={28} />{/if}
                  <span class="unlock-text">
                    <a href={questPath(row.quest.id)}>{row.quest.name}</a>
                    <a class="cap" href={skillPath(row.skill)}
                      >{row.skill} {row.have} / {row.need}</a
                    >
                  </span>
                </li>
              {/each}
            </ul>
          {:else}<p class="unlock-empty">Nothing within 5 levels yet.</p>{/if}
        </GameWindow>
        <GameWindow className="home-activity" title="Recent activity">
          <div class="home-activity-body">
            {#if profile.source !== "hiscores"}
              <p>
                {profile.name} has no linked public player, so there is no
                Adventurer's Log to show.
              </p>
              <a class="btn btn-secondary" href="/players">Add your own player</a>
            {:else}
              <RecentActivity
                playerName={profile.name}
                events={profile.eventLog?.events}
                fetchedAt={profile.eventLog?.fetchedAt}
                status={profile.eventImportStatus}
                active
              />
            {/if}
          </div>
        </GameWindow>
      </div>
    </div>
  </div>
</div>
