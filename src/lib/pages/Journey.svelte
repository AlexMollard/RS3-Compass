<script lang="ts">
  import { goto } from "$app/navigation";
  import { accessibleQuests, nextQuest, SKILLS } from "../../data";
  import { getCompass } from "../compassContext";
  import { questPath, skillPath } from "../navigation";
  import GameArt from "../components/GameArt.svelte";
  import GameText from "../components/GameText.svelte";
  import LevelEditor from "../components/LevelEditor.svelte";
  import QuestStart from "../components/QuestStart.svelte";
  import WorldMap from "../components/WorldMap.svelte";
  import ActivityHeader from "../components/ActivityHeader.svelte";
  import Button from "../components/Button.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import QuestNavigationCard from "../components/QuestNavigationCard.svelte";
  import WikiAction from "../components/WikiAction.svelte";
  import "../../Journey.css";
  const controller = getCompass();
  const saved = controller.state;
  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let quests = $derived(accessibleQuests(profile));
  let next = $derived(nextQuest(profile));
  let complete = $derived(
    quests.filter((q) => profile.completedQuests.includes(q.id)).length,
  );
  let editingSkill = $state<string | null>(null);
</script>

<div class="progression-page page-enter">
  <PageHeading title="Progression">
    {#snippet trailing()}<Button onclick={() => (editingSkill = "Mining")}
        >Update recorded levels</Button
      >{/snippet}
  </PageHeading>
  <div class="home-workspace">
    <GameWindow
      className="home-next"
      title={next?.id === profile.activeTask ? "Current quest" : "Next quest"}
    >
      {#if next}
        <div class="next-quest-workspace">
          <div class="home-preparation">
            <ActivityHeader
              title={next.name}
              wiki={next.wiki}
              image={next.icon}
              artwork={next.artwork}
              eyebrow={next.members ? "MEMBERS" : "FREE-TO-PLAY"}
              onOpen={() => void goto(questPath(next!.id))}
            />
            <div class="home-preparation-body">
              <p class="home-quest-purpose"><GameText text={next.why} /></p>
              <section class="home-start" aria-label="Quest starting point">
                <h3>Where to start</h3>
                <QuestStart quest={next} showMap={false} />
              </section>
              <div class="objective-actions">
                <Button
                  variant="primary"
                  onclick={() => void goto(questPath(next!.id))}
                  >{next.id === profile.activeTask
                    ? "Continue quest"
                    : "Open quest"} →</Button
                >
                <WikiAction page={next.wiki} label="Quest Wiki" />
              </div>
            </div>
          </div>
          <div class="home-map">
            <WorldMap point={next.start.map} npc={next.start.npc} />
          </div>
        </div>
      {:else}<div class="home-empty">
          <h3>Sample route complete</h3>
          <p>Browse quests or choose a skill below.</p>
        </div>{/if}
    </GameWindow>
    <div class="home-lower">
      <GameWindow
        className="home-route"
        title="Browse activities"
        trailing={`${complete}/${quests.length} quests complete`}
      >
        <div class="queue-column-labels">
          <span>QUEST</span><span>MAIN REWARD</span>
        </div>
        <ol class="progression-queue">
          {#each quests as quest, index (quest.id)}<li>
              <QuestNavigationCard
                {quest}
                completed={profile.completedQuests.includes(quest.id)}
                recommended={quest.id === next?.id}
                position={index + 1}
                variant="queue"
                onOpen={(id) => void goto(questPath(id))}
              />
            </li>{/each}
        </ol>
        <p class="window-footnote">
          Quest preparation · choose a skill in the level grid for training.
        </p>
      </GameWindow>
      <GameWindow className="home-levels" title="Recorded levels">
        <div class="level-register">
          {#each SKILLS as skill (skill.name)}<button
              type="button"
              class="level-register-cell"
              aria-label={"Open training for " + skill.name}
              title={"Open training for " + skill.name}
              onclick={() => void goto(skillPath(skill.name))}
              ><GameArt file={skill.icon} /><span>{skill.name}</span><strong
                >{profile.levels[skill.name] ?? "—"}</strong
              ></button
            >{/each}
        </div>
      </GameWindow>
    </div>
  </div>
  {#if editingSkill}{#key profile.id}<LevelEditor
        {profile}
        initialSkill={editingSkill}
        onSave={(levels) => {
          controller.updateProfile((p) => ({
            ...p,
            levels: { ...p.levels, ...levels },
          }));
          editingSkill = null;
        }}
        onDismiss={() => (editingSkill = null)}
      />{/key}{/if}
</div>
