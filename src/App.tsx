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
  Flag,
  Focus,
  Info,
  Leaf,
  ListChecks,
  LockKeyhole,
  Map,
  MapPin,
  Menu,
  Minimize2,
  Pickaxe,
  Play,
  Search,
  Shield,
  Sparkles,
  Swords,
  Target,
  X,
} from "lucide-react";
import QuestPage from "./QuestPage";
import SkillPage from "./SkillPage";
import {
  QUESTS,
  SKILLS,
  accessibleQuests,
  asset,
  nextQuest,
  taskTitle,
  toggleItem,
  type Page,
  type Profile,
  type QuestRecord,
} from "./data";
import { useProfiles } from "./state";
const pageNames: Record<Page, string> = {
  journey: "My journey",
  play: "Play companion",
  quests: "Quest journal",
  skills: "Skill field guide",
};
const navigation = [
  { id: "journey" as const, label: "My journey", icon: Map },
  { id: "play" as const, label: "Play companion", icon: Focus },
  { id: "quests" as const, label: "Quest journal", icon: BookOpen },
  { id: "skills" as const, label: "Skill field guide", icon: Pickaxe },
];
function readRoute(): { page: Page; detail: string } {
  const [page, detail = ""] = location.hash.slice(1).split("/");
  return { page: Object.hasOwn(pageNames, page) ? (page as Page) : "journey", detail };
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
  const start = (id: string) => {
    updateProfile((p) => ({ ...p, activeTask: id }));
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
            <small>FIND YOUR OWN WAY</small>
          </span>
        </a>
        <div className="sidebar-rule" />
        <span className="nav-heading">YOUR ADVENTURE</span>
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
        <div className="sidebar-milestone">
          <span className="small-compass">
            <Compass size={22} />
          </span>
          <span className="eyebrow">YOUR PACE. YOUR PATH.</span>
          <p>
            Every great account
            <br />
            starts somewhere.
          </p>
          <span className="sidebar-flourish">◆ ───── ◆</span>
        </div>
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
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={21} />
            </button>
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
              onClick={() => searchDialog.current?.showModal()}
            >
              <Search size={17} />
              <span>Find a guide</span>
              <kbd>⌘ K</kbd>
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
          {route.page === "journey" && (
            <Journey
              profile={profile}
              onStart={start}
              onQuest={(id) => navigate("quests", id)}
              onSkill={openSkill}
              onPlay={() => navigate("play")}
              onSetMode={() =>
                updateProfile((p) => ({ ...p, mode: "members" }))
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
              <span className="status-dot" /> Local-first. No account required.
            </span>
            <span>
              Sample content · Unofficial RuneScape fan project · Artwork ©
              Jagex
            </span>
            <button onClick={() => aboutDialog.current?.showModal()}>
              Preview notes <ArrowUpRight size={12} />
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
          <h2>Find your next adventure</h2>
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={() => searchDialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <label className="search-field large">
          <Search size={19} />
          <input
            autoFocus
            aria-label="Search quests and skills"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sample quests and skills…"
          />
        </label>
        <div className="search-results">
          {QUESTS.filter((q) =>
            q.name.toLowerCase().includes(search.toLowerCase()),
          ).map((q) => (
            <button
              key={q.id}
              onClick={() => {
                searchDialog.current?.close();
                navigate("quests", q.id);
              }}
            >
              <BookOpen size={18} />
              <span>
                <strong>{q.name}</strong>
                <small>
                  {q.members ? "Members quest" : "Free-to-play quest"}
                </small>
              </span>
              {q.members && profile.mode === "f2p" ? (
                <LockKeyhole size={15} />
              ) : (
                <ArrowRight size={16} />
              )}
            </button>
          ))}
          {SKILLS.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase()),
          ).map((s) => (
            <button
              key={s.name}
              onClick={() => {
                searchDialog.current?.close();
                openSkill(s.name);
              }}
            >
              <Pickaxe size={18} />
              <span>
                <strong>{s.name}</strong>
                <small>Sample skill guide</small>
              </span>
              <ArrowRight size={16} />
            </button>
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
            <h2>A direction, not the finished atlas.</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close prototype notes"
            onClick={() => aboutDialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <p>
          This clickable prototype explores a desktop-first progression
          companion for Solo and Group Ironman. Aster and Rowan are fictional
          sample profiles, not live RuneScape accounts.
        </p>
        <h3>Working in this preview</h3>
        <p>
          Journey and session navigation, F2P/Members settings per character,
          quest completion, sample skill levels, packing checks, notes, search,
          and local persistence.
        </p>
        <h3>Not implemented in this design pass</h3>
        <p>
          The complete guide catalogue, researched members routes, full
          equipment and supply planners, local group comparison, and importing
          old Ironbound backups. Preview export is not an Ironbound-compatible
          backup.
        </p>
        <p>
          The planned first release is static-only: no automatic player lookup,
          public-stat refresh, online boards, or shared task/supply sync.
        </p>
        <button className="btn btn-secondary" onClick={exportPreview}>
          <ArrowDownToLine size={16} /> Export preview profiles
        </button>
        <h3>Artwork and sources</h3>
        <p>
          RuneScape and its artwork belong to Jagex. Existing guide imagery is
          reused for this private design review; public redistribution terms
          still need review before publication.
        </p>
        <div className="credit-links">
          <a
            href="https://runescape.wiki/w/File:Lumbridge.png"
            target="_blank"
            rel="noreferrer"
          >
            Lumbridge ↗
          </a>
          <a
            href="https://runescape.wiki/w/File:Lumbridge_Castle.png"
            target="_blank"
            rel="noreferrer"
          >
            Lumbridge Castle ↗
          </a>
          <a
            href="https://runescape.wiki/w/File:Elvarg_fight.png"
            target="_blank"
            rel="noreferrer"
          >
            Elvarg ↗
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
function Journey({
  profile,
  onStart,
  onQuest,
  onSkill,
  onPlay,
  onSetMode,
}: {
  profile: Profile;
  onStart: (id: string) => void;
  onQuest: (id: string) => void;
  onSkill: (name: string) => void;
  onPlay: () => void;
  onSetMode: () => void;
}) {
  const [focus, setFocus] = useState("recommended");
  const available = accessibleQuests(profile);
  const complete = available.filter((q) =>
    profile.completedQuests.includes(q.id),
  ).length;
  const recommendation = nextQuest(profile);
  const alternatives = available.filter(
    (q) =>
      q.id !== recommendation?.id && !profile.completedQuests.includes(q.id),
  );
  return (
    <div className="journey-page page-enter">
      <div className="welcome-line">
        <span>
          <span className="status-dot" /> {profile.kind} ·{" "}
          {profile.mode === "members" ? "Members world" : "Free world"}
        </span>
        <span className="preview-label">INTERACTIVE DESIGN PREVIEW</span>
      </div>
      <section className="journey-hero">
        <img src={asset("lumbridge.webp")} alt="Lumbridge in RuneScape" />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="eyebrow">
            <Compass size={14} /> YOUR JOURNEY THROUGH GIELINOR
          </span>
          <h1>
            A little direction.
            <br />
            <em>A bigger adventure.</em>
          </h1>
          <p>
            Your next useful step, and everything you need
            <br className="desktop-break" /> to make it happen. At your own
            pace.
          </p>
          <button className="hero-resume" onClick={onPlay}>
            <span className="play-disc">
              <Play size={12} fill="currentColor" />
            </span>
            <span>
              Pick up where you left off
              <small>{taskTitle(profile.activeTask)}</small>
            </span>
            <ArrowRight size={18} />
          </button>
        </div>
        <span className="scene-caption">LUMBRIDGE · WHERE IT ALL BEGINS</span>
      </section>
      <div className="journey-grid">
        <div className="journey-primary">
          <div className="section-heading journey-section-title">
            <div>
              <span className="eyebrow">MAKE YOUR NEXT SESSION COUNT</span>
              <h2>A path worth taking</h2>
            </div>
            <span className="badge">
              <Sparkles size={12} /> Sample recommendations
            </span>
          </div>
          <div className="focus-tabs" aria-label="Recommendation focus">
            {[
              ["recommended", "Recommended"],
              ["quests", "Questing"],
              ["training", "Training"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={focus === id}
                className={focus === id ? "selected" : ""}
                onClick={() => setFocus(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {focus === "training" ? (
            <div className="training-cards">
              {SKILLS.map((s) => (
                <button
                  className="panel training-choice"
                  key={s.name}
                  onClick={() => onSkill(s.name)}
                >
                  <span className="skill-choice-icon">
                    <img src={asset(s.icon)} alt="" />
                  </span>
                  <div>
                    <span className="eyebrow">
                      {s.category.toUpperCase()} · LEVEL{" "}
                      {profile.levels[s.name] ?? "?"}
                    </span>
                    <h3>{s.name}</h3>
                    <p>{s.payoff}</p>
                  </div>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
          ) : (
            <>
              {recommendation ? (
                <RecommendedQuest
                  quest={recommendation}
                  profile={profile}
                  onStart={onStart}
                  onQuest={onQuest}
                />
              ) : (
                <div className="panel complete-panel">
                  <CheckCircle2 size={30} />
                  <h3>You’ve completed the sample route.</h3>
                  <p>
                    This is the end of the design sample, not the end of your
                    RuneScape journey.
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onQuest(QUESTS[0].id)}
                  >
                    Review the quest journal
                  </button>
                </div>
              )}
              {alternatives.length > 0 && (
                <section className="alternative-section">
                  <div className="section-heading">
                    <h3>
                      {focus === "quests"
                        ? "More of your quest route"
                        : "Or take a different path"}
                    </h3>
                    <span className="muted">Your pace, your choice</span>
                  </div>
                  {alternatives
                    .slice(0, focus === "quests" ? 4 : 2)
                    .map((q) => (
                      <button
                        className="alternative-row"
                        key={q.id}
                        onClick={() => onQuest(q.id)}
                      >
                        <span className="alternative-icon">
                          <BookOpen size={17} />
                        </span>
                        <span>
                          <strong>{q.name}</strong>
                          <small>
                            {q.members ? "Members" : "F2P"} · {q.location}
                          </small>
                        </span>
                        <ArrowUpRight size={16} />
                      </button>
                    ))}
                </section>
              )}
            </>
          )}
          <section className="long-journey">
            <div className="section-heading">
              <h3>From first steps to lasting goals</h3>
              <span className="muted">The product direction</span>
            </div>
            <div className="milestone-track">
              {[
                { name: "Foundations", icon: Leaf },
                { name: "Quest unlocks", icon: BookOpen },
                { name: "Combat & bosses", icon: Swords },
                { name: "Long-term mastery", icon: Flag },
              ].map(({ name, icon: Icon }, i) => (
                <div className={i === 0 ? "current" : ""} key={name}>
                  <span>
                    <Icon size={17} />
                  </span>
                  <strong>{name}</strong>
                  {i === 0 && <small>Your sample chapter</small>}
                </div>
              ))}
            </div>
            <p className="sample-note">
              Later milestones show the intended journey, not completed guide
              coverage.
            </p>
          </section>
        </div>
        <aside className="journey-rail">
          <section className="panel character-card">
            <div className="section-heading">
              <span className="eyebrow">YOUR ADVENTURER</span>
              <Shield size={16} />
            </div>
            <div className="character-summary">
              <span className="portrait">
                <Shield size={31} strokeWidth={1.2} />
              </span>
              <div>
                <h3>{profile.name}</h3>
                <span>{profile.kind}</span>
                <small>Fictional sample profile</small>
              </div>
            </div>
            <div className="character-stat">
              <span>Sample quest progress</span>
              <strong>
                {complete}
                <span> / {available.length}</span>
              </strong>
            </div>
            <div className="progress-track">
              <span
                style={{ width: (complete / available.length) * 100 + "%" }}
              />
            </div>
            <div className="character-stat">
              <span>Recorded sample skills</span>
              <strong>{Object.keys(profile.levels).length}</strong>
            </div>
            <div className="mini-skills">
              {SKILLS.map((s) => (
                <button
                  key={s.name}
                  onClick={() => onSkill(s.name)}
                  title={"Open " + s.name}
                >
                  <img src={asset(s.icon)} alt={s.name} />
                  <strong>{profile.levels[s.name] ?? "?"}</strong>
                </button>
              ))}
            </div>
            <p className="manual-note">
              <Info size={13} /> Manually recorded. Not synced with Jagex.
            </p>
          </section>
          <section className="panel session-card">
            <span className="eyebrow">READY WHEN YOU ARE</span>
            <div className="session-title">
              <Backpack size={22} />
              <h3>Your field kit</h3>
            </div>
            <p>
              One task. The right supplies.
              <br />A clear next step.
            </p>
            <button className="btn btn-secondary full-width" onClick={onPlay}>
              Open play companion <ArrowRight size={15} />
            </button>
          </section>
          <section className="horizon-card">
            <Crown size={22} />
            <h3>
              {profile.mode === "members"
                ? "A whole world ahead."
                : "Beyond the free world."}
            </h3>
            <p>
              {profile.mode === "members"
                ? "Quest unlocks, combat readiness, and long-term goals belong on the same journey."
                : "You don’t need to finish every free skill before choosing a members adventure."}
            </p>
            {profile.mode === "f2p" ? (
              <button className="text-link" onClick={onSetMode}>
                Explore Members mode <ArrowRight size={14} />
              </button>
            ) : (
              <span className="badge badge-gold">
                Members direction preview
              </span>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
function RecommendedQuest({
  quest,
  profile,
  onStart,
  onQuest,
}: {
  quest: QuestRecord;
  profile: Profile;
  onStart: (id: string) => void;
  onQuest: (id: string) => void;
}) {
  const missing = quest.requirements.filter(
    (r) => profile.levels[r.skill] == null || profile.levels[r.skill] < r.level,
  );
  return (
    <article className="panel next-action">
      <div className="next-action-top">
        <span className="eyebrow">
          <span className="gold-dot" /> RECOMMENDED NEXT
        </span>
        <span className="quest-type">
          <BookOpen size={13} />
          {quest.members ? "Members quest" : "Free-to-play quest"}
        </span>
      </div>
      <div className="next-action-body">
        <span className="quest-crest">
          <BookOpen size={29} strokeWidth={1.3} />
        </span>
        <div>
          <h3>{quest.name}</h3>
          <p className="location-line">
            <MapPin size={13} />
            {quest.location}
          </p>
        </div>
      </div>
      <p className="next-why">{quest.why}</p>
      <div className="readiness-line">
        {missing.length ? (
          <>
            <span className="amber-indicator" />
            <span>
              {missing.length} preparation{" "}
              {missing.length === 1 ? "level" : "levels"} to review
            </span>
            <span className="muted">
              · Required vs recommended shown in guide
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 size={15} />
            <span>No missing sample skill requirements</span>
            <span className="muted">· Confirm items and combat readiness</span>
          </>
        )}
      </div>
      <div className="next-actions">
        <button className="btn btn-primary" onClick={() => onStart(quest.id)}>
          Prepare for this quest <ArrowRight size={16} />
        </button>
        <button className="btn btn-quiet" onClick={() => onQuest(quest.id)}>
          View quest details <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
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
  const stage =
    skill?.stages.find(
      (s) =>
        (profile.levels[skill.name] || 1) >= s.from &&
        (profile.levels[skill.name] || 1) < s.to,
    ) || skill?.stages[skill.stages.length - 1];
  const packing = quest?.supplies || stage?.supplies || [];
  const packed = packing.filter((item) =>
    profile.packed.includes(task + "::" + item),
  ).length;
  const next = nextQuest(profile);
  const instructions = quest?.steps || [
    stage?.method || "Choose a sample quest or skill session to get started.",
    "Include gathering, travel, and banking in your session.",
    "Record your new level in the skill guide when you finish.",
  ];
  return (
    <div className="play-page page-enter">
      <div className="play-page-top">
        <button className="text-link" onClick={onBack}>
          <ArrowLeft size={15} /> Back to my journey
        </button>
        <button
          className="btn btn-secondary compact-switch"
          aria-pressed={compact}
          onClick={onCompact}
        >
          {compact ? <Expand size={15} /> : <Minimize2 size={15} />}{" "}
          {compact ? "Expand workspace" : "Compact companion"}
        </button>
      </div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LESS PLANNING. MORE ADVENTURING.</span>
          <h1>
            Your next adventure<span className="heading-dot">.</span>
          </h1>
          <p className="page-subtitle">
            One useful task, and a little direction along the way.
          </p>
        </div>
        <span className="badge badge-green">
          <span className="status-dot" /> {profile.name} · saved locally
        </span>
      </div>
      <div className="play-layout">
        <article className="panel active-session">
          <div className="session-banner">
            <img
              src={asset(quest?.image || skill?.image || "lumbridge.webp")}
              alt=""
            />
            <div className="session-banner-shade" />
            <div className="session-banner-content">
              <span className="badge">
                {skill ? "TRAINING SESSION" : "QUEST SESSION"}
              </span>
              <h2>{taskTitle(task)}</h2>
              <p>
                <MapPin size={14} />
                {quest?.location || stage?.location}
              </p>
            </div>
          </div>
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
                    <button
                      className="text-link"
                      onClick={() => onStart(next.id)}
                    >
                      Prepare for {next.name} instead <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="session-context">
                  <span className="icon-tile">
                    <Target size={19} />
                  </span>
                  <p>{quest?.why || skill?.payoff}</p>
                </div>
                <section className="detail-section">
                  <div className="section-heading">
                    <h3>Your field notes</h3>
                    <a
                      className="text-link"
                      href={
                        "https://runescape.wiki/w/" +
                        (quest?.wiki ||
                          skill?.wiki ||
                          "Ironman_Mode/Strategies")
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Full Wiki guide <ArrowUpRight size={13} />
                    </a>
                  </div>
                  <ol className="session-steps">
                    {instructions.map((s, i) => (
                      <li key={s}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <p>{s}</p>
                      </li>
                    ))}
                  </ol>
                </section>
                <div className="session-warning">
                  <Shield size={17} />
                  <p>
                    Prototype guidance, not a verified walkthrough. Check the
                    current game journal and Wiki, especially before combat.
                  </p>
                </div>
                <div className="detail-actions">
                  <button
                    className={"btn " + (done ? "btn-success" : "btn-primary")}
                    aria-pressed={done}
                    onClick={onComplete}
                  >
                    <Check size={17} />
                    {done
                      ? "Recorded complete · undo"
                      : "Record session complete"}
                  </button>
                  <button
                    className="btn btn-quiet"
                    onClick={() =>
                      quest ? onQuest(quest.id) : skill && onSkill(skill.name)
                    }
                  >
                    {skill ? "Update my level" : "Review quest preparation"}{" "}
                    <ArrowRight size={15} />
                  </button>
                </div>
                {done && (
                  <div className="completion-message" role="status">
                    <CheckCircle2 size={21} />
                    <div>
                      <strong>A little further along the path.</strong>
                      <p>
                        Completion does not automatically add XP, rewards, or
                        supplies.
                      </p>
                      {next && next.id !== task && (
                        <button
                          className="text-link"
                          onClick={() => onStart(next.id)}
                        >
                          Next sample quest: {next.name}{" "}
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </article>
        <aside className="play-rail">
          <section className="panel packing-card">
            <div className="section-heading">
              <h3>
                <Backpack size={18} /> Before you go
              </h3>
              <span className="badge">
                {packed}/{packing.length}
              </span>
            </div>
            <p className="muted">Check what you’ve actually packed.</p>
            <div className="packing-progress">
              <span
                style={{
                  width:
                    (packing.length ? (packed / packing.length) * 100 : 0) +
                    "%",
                }}
              />
            </div>
            {packing.map((item) => (
              <label
                key={task + item}
                className={
                  "pack-row " +
                  (profile.packed.includes(task + "::" + item) ? "checked" : "")
                }
              >
                <input
                  type="checkbox"
                  checked={profile.packed.includes(task + "::" + item)}
                  onChange={() => onTogglePack(task + "::" + item)}
                />
                <span>{item}</span>
              </label>
            ))}
            <p className="sample-note">
              Checks describe this sample session only. They do not read your
              bank or inventory.
            </p>
          </section>
          <section className="panel notes-card">
            <div className="section-heading">
              <h3>
                <ListChecks size={18} /> A note for later
              </h3>
              <span className="muted">Autosaved</span>
            </div>
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
          <div className="play-smallprint">
            <Compass size={18} />
            <p>
              Keep this view beside the game.
              <br />
              Your next step stays in sight.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
