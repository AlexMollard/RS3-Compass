import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Compass,
  Crown,
  Expand,
  Focus,
  Info,
  ListChecks,
  LockKeyhole,
  Map,
  Menu,
  Minimize2,
  Pickaxe,
  Search,
  Shield,
  Target,
  X,
} from "lucide-react";
import QuestPage from "./QuestPage";
import SkillPage from "./SkillPage";
import QuestLevels from "./QuestLevels";
import GameText from "./GameText";
import Journey from "./Journey";
import LocationGallery from "./LocationGallery";
import {
  ActivityHeader,
  Button,
  IconButton,
  ItemList,
  PageHeading,
  NavigationCard,
  SearchField,
  SectionHeading,
  WikiAction,
} from "./ui";
import {
  QUESTS,
  SKILLS,
  trainingStage,
  stageLocations,
  nextQuest,
  taskTitle,
  toggleItem,
  type Page,
  type Profile,
} from "./data";
import { useProfiles } from "./state";
const pageNames: Record<Page, string> = {
  journey: "Progression",
  play: "Play companion",
  quests: "Quest preparation",
  skills: "Skills",
};
const navigation = [
  { id: "journey" as const, label: "Progression", icon: Map },
  { id: "play" as const, label: "Play companion", icon: Focus },
  { id: "quests" as const, label: "Quest preparation", icon: BookOpen },
  { id: "skills" as const, label: "Skills", icon: Pickaxe },
];
function readRoute(): { page: Page; detail: string } {
  const [page, detail = ""] = location.hash.slice(1).split("/");
  return {
    page: Object.hasOwn(pageNames, page) ? (page as Page) : "journey",
    detail,
  };
}
export default function App() {
  const { profile, profiles, updateProfile, selectProfile, storageError } =
    useProfiles();
  const [route, setRoute] = useState(readRoute);
  const [mobileNav, setMobileNav] = useState(false);
  const [compact, setCompact] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const searchDialog = useRef<HTMLDialogElement>(null);
  const aboutDialog = useRef<HTMLDialogElement>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const listener = () => {
      setRoute(readRoute());
      setMobileNav(false);
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [route.page, route.detail]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNav(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchDialog.current?.showModal();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [message]);
  const navigate = (page: Page, detail = "") => {
    if (page !== "play") setCompact(false);
    const hash = page + (detail ? "/" + detail : "");
    if (location.hash.slice(1) !== hash) location.hash = hash;
    else setMobileNav(false);
  };
  const toggleQuest = (id: string) => {
    updateProfile((p) => ({
      ...p,
      completedQuests: toggleItem(p.completedQuests, id),
    }));
  };
  const start = (id: string, trainingFrom?: number) => {
    updateProfile((p) => ({
      ...p,
      activeTask: id,
      trainingRanges:
        trainingFrom == null
          ? p.trainingRanges
          : { ...p.trainingRanges, [id.slice(6)]: trainingFrom },
    }));
    navigate("play");
  };
  const openSkill = (name: string) => {
    if (SKILLS.some((s) => s.name === name)) navigate("skills", name);
    else
      setMessage(
        name +
          " is not one of the three skill details included in this design preview.",
      );
  };
  const exportPreview = () => {
    const a = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { format: "rs3-compass-design-preview", version: 1, profiles },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    a.href = url;
    a.download = "rs3-compass-design-preview.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const showingCompact = compact && route.page === "play";
  return (
    <div
      className={
        "app-shell " +
        (showingCompact ? "is-compact " : "") +
        (mobileNav ? "nav-open" : "")
      }
    >
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className="sidebar">
        <a className="brand" href="#journey" aria-label="RS3 Compass home">
          <span className="brand-mark">
            <Compass size={29} strokeWidth={1.4} />
          </span>
          <span>
            <strong>RS3 COMPASS</strong>
            <small>IRONMAN PLANNER</small>
          </span>
        </a>
        <div className="sidebar-rule" />
        <span className="nav-heading">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={"nav-item " + (route.page === id ? "active" : "")}
              aria-current={route.page === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {route.page === id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="save-status">
            <span className={"status-dot " + (storageError ? "warning" : "")} />
            {storageError
              ? "Not saved · export your preview"
              : "Preview saved on this device"}
          </div>
          <button
            className="nav-item subtle"
            onClick={() => aboutDialog.current?.showModal()}
          >
            <CircleHelp size={18} />
            About this prototype
          </button>
          <span className="version-label">DESIGN PREVIEW · 01</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <IconButton
              framed={false}
              className="mobile-menu"
              label="Open navigation"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={21} />
            </IconButton>
            <Compass size={15} />
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{pageNames[route.page]}</strong>
          </div>
          <div className="topbar-tools">
            <div
              className="access-toggle"
              role="group"
              aria-label="Character membership"
            >
              {(["f2p", "members"] as const).map((mode) => (
                <button
                  key={mode}
                  aria-pressed={profile.mode === mode}
                  className={profile.mode === mode ? "selected" : ""}
                  onClick={() => updateProfile((p) => ({ ...p, mode }))}
                >
                  {mode === "members" && <Crown size={13} />}{" "}
                  {mode === "f2p" ? "F2P" : "Members"}
                </button>
              ))}
            </div>
            <span className="topbar-divider" />
            <button
              className="search-trigger"
              aria-label="Search prototype guides"
              title="Search quests and skills (Ctrl/⌘ K)"
              onClick={() => searchDialog.current?.showModal()}
            >
              <Search size={17} />
              <span>Find a guide</span>
              <kbd>Ctrl/⌘ K</kbd>
            </button>
            <label className="character-select">
              <span className="avatar">{profile.name[0]}</span>
              <span>
                <small>SAMPLE CHARACTER</small>
                <select
                  aria-label="Sample character"
                  value={profile.id}
                  onChange={(e) => {
                    selectProfile(e.target.value);
                    setMessage(
                      "Switched sample character. Each profile keeps its own progress.",
                    );
                  }}
                >
                  {profiles.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </div>
        </header>
        <main
          id="main-content"
          className="main-content"
          ref={main}
          tabIndex={-1}
        >
          {storageError && (
            <div className="notice storage-alert" role="alert">
              <div>
                <strong>Your latest changes are not saved.</strong>
                <p>Export your progress before closing this tab.</p>
              </div>
              <Button onClick={exportPreview}>
                <ArrowDownToLine size={16} /> Export progress
              </Button>
            </div>
          )}
          {route.page === "journey" && (
            <Journey
              profile={profile}
              onStart={start}
              onQuest={(id) => navigate("quests", id)}
              onSkill={openSkill}
              onPlay={() => navigate("play")}
              onLevelsChange={(levels) =>
                updateProfile((p) => ({
                  ...p,
                  levels: { ...p.levels, ...levels },
                }))
              }
            />
          )}
          {route.page === "play" && (
            <PlayCompanion
              key={profile.id}
              profile={profile}
              compact={showingCompact}
              onCompact={() => setCompact(!compact)}
              onBack={() => navigate("journey")}
              onStart={start}
              onQuest={(id) => navigate("quests", id)}
              onSkill={openSkill}
              onTogglePack={(id) =>
                updateProfile((p) => ({
                  ...p,
                  packed: toggleItem(p.packed, id),
                }))
              }
              onNote={(id, note) =>
                updateProfile((p) => ({
                  ...p,
                  notes: { ...p.notes, [id]: note },
                }))
              }
              onComplete={() =>
                updateProfile((p) =>
                  p.activeTask.startsWith("train-")
                    ? {
                        ...p,
                        completedTasks: toggleItem(
                          p.completedTasks,
                          p.activeTask,
                        ),
                      }
                    : {
                        ...p,
                        completedQuests: toggleItem(
                          p.completedQuests,
                          p.activeTask,
                        ),
                      },
                )
              }
            />
          )}
          {route.page === "quests" && (
            <QuestPage
              profile={profile}
              selectedId={route.detail || "knights-sword"}
              onSelect={(id) => navigate("quests", id)}
              onToggleQuest={toggleQuest}
              onStart={start}
              onSkill={openSkill}
            />
          )}
          {route.page === "skills" && (
            <SkillPage
              key={profile.id}
              profile={profile}
              selectedSkill={route.detail || "Mining"}
              onSelect={openSkill}
              onLevelChange={(skill, level) =>
                updateProfile((p) => ({
                  ...p,
                  levels: { ...p.levels, [skill]: level },
                }))
              }
              onStart={start}
            />
          )}
          <footer className="workspace-footer">
            <span>
              <span className="status-dot" /> Local progress
            </span>
            <span>Unofficial RuneScape fan project · Artwork © Jagex</span>
            <button onClick={() => aboutDialog.current?.showModal()}>
              About <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {message && (
        <div className="toast" role="status">
          <Info size={17} />
          {message}
        </div>
      )}
      <dialog className="app-dialog" ref={searchDialog}>
        <div className="dialog-heading">
          <h2>Search quests and skills</h2>
          <IconButton
            framed={false}
            label="Close search"
            onClick={() => searchDialog.current?.close()}
          >
            <X size={20} />
          </IconButton>
        </div>
        <SearchField
          className="large"
          autoFocus
          label="Search quests and skills"
          placeholder="Search sample quests and skills…"
          value={search}
          onChange={setSearch}
        />
        <div className="search-results">
          {QUESTS.filter((q) =>
            q.name.toLowerCase().includes(search.toLowerCase()),
          ).map((q) => (
            <NavigationCard
              key={q.id}
              title={q.name}
              label={"Open preparation for " + q.name}
              icon={<BookOpen size={20} />}
              detail={q.members ? "Members quest" : "Free-to-play quest"}
              wiki={q.wiki}
              onOpen={() => {
                searchDialog.current?.close();
                navigate("quests", q.id);
              }}
            />
          ))}
          {SKILLS.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase()),
          ).map((s) => (
            <NavigationCard
              key={s.name}
              title={s.name}
              label={"Open training for " + s.name}
              icon={<Pickaxe size={20} />}
              detail="Sample training methods"
              wiki={s.wiki}
              onOpen={() => {
                searchDialog.current?.close();
                openSkill(s.name);
              }}
            />
          ))}
          {![...QUESTS.map((q) => q.name), ...SKILLS.map((s) => s.name)].some(
            (n) => n.toLowerCase().includes(search.toLowerCase()),
          ) && (
            <p className="empty-state">No sample guides match that search.</p>
          )}
        </div>
      </dialog>
      <dialog className="app-dialog about-dialog" ref={aboutDialog}>
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">RS3 COMPASS · DESIGN PREVIEW</span>
            <h2>Prototype scope</h2>
          </div>
          <IconButton
            framed={false}
            label="Close prototype notes"
            onClick={() => aboutDialog.current?.close()}
          >
            <X size={20} />
          </IconButton>
        </div>
        <p>
          This clickable prototype uses fictional profiles and a limited set of
          guides. Progress is entered manually and saved on this device, not
          connected to a RuneScape account. Use the Wiki or in-game quest helper
          for the quest itself.
        </p>
        <h3>Preview features and limits</h3>
        <p>
          Track levels, quests, packing checks and notes per character. The
          complete guide catalogue, researched members routes, equipment and
          supply planners, group comparison and Ironbound backup import are not
          implemented. Preview export is not compatible with Ironbound.
        </p>
        <p>
          No automatic player lookup, public-stat refresh, online boards, or
          shared task/supply sync is planned for the first release.
        </p>
        <Button onClick={exportPreview}>
          <ArrowDownToLine size={16} /> Export preview profiles
        </Button>
        <h3>Artwork and sources</h3>
        <p>
          RuneScape and its artwork belong to Jagex. Icons and item images load
          from RuneScape Wiki; no game artwork is bundled with Compass.
        </p>
        <div className="credit-links">
          <a
            href="https://runescape.wiki/w/Quests"
            target="_blank"
            rel="noreferrer"
          >
            Quest icon source ↗
          </a>
          <a
            href="https://ironbound-rs3-alex.alexmollard93.chatgpt.site/guide/"
            target="_blank"
            rel="noreferrer"
          >
            Original guide ↗
          </a>
        </div>
      </dialog>
    </div>
  );
}
function PlayCompanion({
  profile,
  compact,
  onCompact,
  onBack,
  onStart,
  onQuest,
  onSkill,
  onTogglePack,
  onNote,
  onComplete,
}: {
  profile: Profile;
  compact: boolean;
  onCompact: () => void;
  onBack: () => void;
  onStart: (id: string) => void;
  onQuest: (id: string) => void;
  onSkill: (name: string) => void;
  onTogglePack: (id: string) => void;
  onNote: (id: string, note: string) => void;
  onComplete: () => void;
}) {
  const task = profile.activeTask;
  const skill = task.startsWith("train-")
    ? SKILLS.find((s) => s.name === task.slice(6))
    : undefined;
  const quest = QUESTS.find((q) => q.id === task);
  const locked = !!quest?.members && profile.mode === "f2p";
  const done = skill
    ? profile.completedTasks.includes(task)
    : profile.completedQuests.includes(task);
  const stage = skill ? trainingStage(skill, profile) : undefined;
  const places =
    quest?.locations ?? (stage ? stageLocations(stage, profile.mode) : []);
  const packing = quest?.supplies || stage?.supplies || [];
  const packedItems = packing.filter((item) =>
    profile.packed.includes(task + "::" + item),
  );
  const packed = packedItems.length;
  const next = nextQuest(profile);
  const instructions = [
    stage?.method || "Choose a quest or skill session to get started.",
    "Allow for gathering, travel and banking; update your level when finished.",
  ];
  return (
    <div className="play-page page-enter">
      <div className="play-page-top">
        <Button variant="link" onClick={onBack}>
          <ArrowLeft size={15} /> Back to my journey
        </Button>
        <Button
          className="compact-switch"
          aria-pressed={compact}
          onClick={onCompact}
        >
          {compact ? <Expand size={15} /> : <Minimize2 size={15} />}{" "}
          {compact ? "Expand workspace" : "Compact companion"}
        </Button>
      </div>
      <PageHeading
        title="Play companion"
        subtitle={
          quest
            ? "Check requirements and pack items, use the Wiki or in-game helper, then mark completion here."
            : "Follow your selected method, then update your recorded level."
        }
        trailing={
          <span className="badge badge-green">
            <span className="status-dot" /> {profile.name} · manual progress
          </span>
        }
      />
      <div className="play-layout">
        <article className="panel active-session">
          <ActivityHeader
            title={taskTitle(task)}
            wiki={quest?.wiki || skill?.wiki || "Ironman_Mode/Strategies"}
            image={skill?.icon || "Quest_icon.png"}
            eyebrow={stage ? `LEVELS ${stage.from}–${stage.to}` : "QUEST"}
          />
          <div className="detail-body">
            {locked ? (
              <div className="notice">
                <LockKeyhole size={21} />
                <div>
                  <strong>This session needs membership</strong>
                  <p>
                    Your notes and progress are safe. Switch to Members in the
                    header, or choose an accessible quest.
                  </p>
                  {next && (
                    <>
                      <p>
                        Available quest: <GameText text={next.name} />
                      </p>
                      <Button variant="link" onClick={() => onStart(next.id)}>
                        Open preparation <ArrowRight size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="session-context">
                  <span className="icon-tile">
                    <Target size={19} />
                  </span>
                  <p>
                    <GameText text={quest?.why || skill?.payoff || ""} />
                  </p>
                </div>
                {quest && (
                  <section className="detail-section">
                    <SectionHeading
                      title="Check requirements"
                      aside={
                        <span className="muted">Required vs self-supply</span>
                      }
                    />
                    <QuestLevels
                      profile={profile}
                      quest={quest}
                      onSkill={onSkill}
                    />
                  </section>
                )}
              </>
            )}
            <section className="panel packing-card">
              <SectionHeading
                title={
                  <>
                    <Backpack size={18} />{" "}
                    {quest ? "Gather these items" : "Before you go"}
                  </>
                }
                aside={
                  <span className="badge">
                    {packed}/{packing.length}
                  </span>
                }
              />
              <p className="muted">Check items as you pack them.</p>
              <div className="packing-progress">
                <span
                  style={{
                    width:
                      (packing.length ? (packed / packing.length) * 100 : 0) +
                      "%",
                  }}
                />
              </div>
              <ItemList
                items={packing}
                checked={packedItems}
                onToggle={(item) => onTogglePack(task + "::" + item)}
              />
              <p className="sample-note">
                Checks are manual; they do not read your bank or inventory.
              </p>
            </section>
            {places.length > 0 && (
              <section className="detail-section">
                <SectionHeading
                  title={skill ? "Where to train" : "Where to go"}
                />
                <LocationGallery locations={places} profile={profile} />
              </section>
            )}
            {!locked && (
              <>
                {quest ? (
                  <section className="detail-section">
                    <h3>Start the quest</h3>
                    <p className="intro-copy">
                      Pack the items listed here, then use the Wiki guide or
                      in-game quest helper. Mark the quest complete here once
                      you finish it in-game.
                    </p>
                    <WikiAction
                      page={quest.wiki}
                      label="Open Wiki quest guide"
                      primary
                    />
                  </section>
                ) : (
                  <section className="detail-section">
                    <SectionHeading
                      title="Your training method"
                      aside={
                        <WikiAction
                          page={skill?.wiki || "Ironman_Mode/Strategies"}
                          label="Skill reference"
                        />
                      }
                    />
                    <ol className="session-steps">
                      {instructions.map((instruction, index) => (
                        <li key={instruction}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <p>
                            <GameText text={instruction} />
                          </p>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                <div className="session-warning">
                  <Shield size={17} />
                  <p>
                    Confirm current requirements and combat risks in your game
                    journal or the Wiki.
                  </p>
                </div>
                <div className="detail-actions">
                  <Button
                    variant={done ? "success" : quest ? "secondary" : "primary"}
                    aria-pressed={done}
                    onClick={onComplete}
                  >
                    <Check size={17} />
                    {done
                      ? "Recorded complete · undo"
                      : quest
                        ? "Mark quest complete"
                        : "Mark session complete"}
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() =>
                      quest ? onQuest(quest.id) : skill && onSkill(skill.name)
                    }
                  >
                    {skill ? "Update my level" : "Review quest preparation"}{" "}
                    <ArrowRight size={15} />
                  </Button>
                </div>
                {done && (
                  <div className="completion-message" role="status">
                    <CheckCircle2 size={21} />
                    <div>
                      <strong>Completion recorded</strong>
                      <p>
                        Completion does not automatically add XP, rewards, or
                        supplies.
                      </p>
                      {next && next.id !== task && (
                        <>
                          <p>
                            Next sample quest: <GameText text={next.name} />
                          </p>
                          <Button
                            variant="link"
                            onClick={() => onStart(next.id)}
                          >
                            Prepare next quest <ArrowRight size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </article>
        <aside className="play-rail">
          <section className="panel notes-card">
            <SectionHeading
              title={
                <>
                  <ListChecks size={18} /> Session notes
                </>
              }
            />
            <label className="sr-only" htmlFor="session-notes">
              Session notes
            </label>
            <textarea
              id="session-notes"
              placeholder="Where you stopped, what to gather next…"
              value={profile.notes[task] || ""}
              maxLength={4000}
              onChange={(e) => onNote(task, e.target.value)}
            />
            <span className="note-count">
              {(profile.notes[task] || "").length}/4,000
            </span>
          </section>
        </aside>
      </div>
    </div>
  );
}
