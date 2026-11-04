import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check, ChevronRight, ExternalLink } from "lucide-react";
import type { QuestRecord } from "./data";
import GameText from "./GameText";
import { wikiHref, wikiImage } from "./wiki";

export function PageHeading({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="utility-heading">
      <div>
        <h1>{title}</h1>
        {subtitle != null && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}

export function GameWindow({
  title,
  icon,
  trailing,
  className,
  children,
}: {
  title: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={"tool-window" + (className ? " " + className : "")}>
      <header className="window-title">
        {icon}
        <h2>{title}</h2>
        {trailing != null && <span>{trailing}</span>}
      </header>
      {children}
    </section>
  );
}

export function ActivityHeader({
  title,
  wiki,
  image,
  eyebrow,
  meta,
}: {
  title: string;
  wiki: string;
  image: string;
  eyebrow: string;
  meta?: ReactNode;
}) {
  return (
    <header className="activity-header">
      <a
        className="activity-header-icon"
        href={wikiHref(wiki)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={title + " on RuneScape Wiki"}
      >
        <img src={wikiImage(image)} alt="" />
      </a>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>
          <GameText text={title} />
        </h2>
        {meta}
      </div>
    </header>
  );
}

type QuestNavigationCardProps = {
  quest: QuestRecord;
  completed: boolean;
  selected?: boolean;
  recommended?: boolean;
  onOpen: (id: string) => void;
} & (
  | { variant: "queue"; position: number }
  | { variant?: "journal"; position?: never }
);

export function QuestNavigationCard({
  quest,
  completed,
  selected,
  recommended = false,
  position,
  variant = "journal",
  onOpen,
}: QuestNavigationCardProps) {
  if (variant === "queue") {
    return (
      <button
        type="button"
        className={
          "queue-row" +
          (completed ? " complete" : "") +
          (recommended ? " recommended" : "")
        }
        aria-label={"Open preparation for " + quest.name}
        aria-pressed={selected}
        onClick={() => onOpen(quest.id)}
      >
        <span className="queue-position">
          {completed ? <Check size={17} /> : String(position).padStart(2, "0")}
        </span>
        <img
          className="queue-quest-icon"
          src={wikiImage("Quest_icon.png")}
          alt=""
        />
        <span className="queue-quest-name">
          <strong>{quest.name}</strong>
          <small>
            {completed
              ? "Recorded complete"
              : recommended
                ? "Next · prepare levels and items"
                : quest.members
                  ? "Members quest"
                  : "Free-to-play quest"}
          </small>
        </span>
        <span className="queue-reward">{quest.rewards[0]}</span>
        <ChevronRight size={16} />
      </button>
    );
  }
  return (
    <button
      type="button"
      className={"journal-row quest-nav-row" + (selected ? " selected" : "")}
      aria-label={"Open preparation for " + quest.name}
      aria-pressed={selected}
      onClick={() => onOpen(quest.id)}
    >
      <span className={"quest-state" + (completed ? " is-complete" : "")}>
        {completed ? (
          <Check size={15} />
        ) : (
          <img
            src={wikiImage("Quest_icon.png")}
            alt=""
            width={18}
            height={18}
          />
        )}
      </span>
      <span>
        <strong>{quest.name}</strong>
        <small>
          {quest.members ? "Members" : "Free-to-play"} · {quest.difficulty}
        </small>
      </span>
      <span className="reference-action" aria-hidden="true">
        <ChevronRight size={15} />
      </span>
    </button>
  );
}

export function ItemList({
  items,
  checked,
  onToggle,
}: {
  items: readonly string[];
  checked?: readonly string[];
  onToggle?: (item: string) => void;
}) {
  if (onToggle) {
    return (
      <div className="item-checklist">
        {items.map((item) => {
          const isChecked = checked?.includes(item) ?? false;
          return (
            <div
              className={"pack-row" + (isChecked ? " checked" : "")}
              key={item}
            >
              <input
                type="checkbox"
                aria-label={item}
                checked={isChecked}
                onChange={() => onToggle(item)}
              />
              <span>
                <GameText text={item} />
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <ul className="plain-list">
      {items.map((item) => (
        <li key={item}>
          <span className="tiny-diamond" />
          <GameText text={item} />
        </li>
      ))}
    </ul>
  );
}

export function Button({
  variant = "secondary",
  type = "button",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "success" | "link";
}) {
  return (
    <button
      {...props}
      type={type}
      className={
        (variant === "link" ? "text-link" : "btn btn-" + variant) +
        (className ? " " + className : "")
      }
    />
  );
}

export function IconButton({
  label,
  framed = true,
  type = "button",
  className,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  label: string;
  framed?: boolean;
}) {
  return (
    <button
      {...props}
      type={type}
      className={
        (framed ? "reference-action" : "icon-button") +
        (className ? " " + className : "")
      }
      aria-label={label}
    />
  );
}

export function Tabs({
  items,
  value,
  onChange,
  label,
  variant = "window",
}: {
  items: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  variant?: "window" | "detail";
}) {
  return (
    <div
      className={variant === "detail" ? "detail-tabs" : "window-tabs"}
      role="group"
      aria-label={label}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={item.value === value ? "selected" : ""}
          aria-pressed={item.value === value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function SectionHeading({
  title,
  aside,
}: {
  title: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h3>{title}</h3>
      {aside}
    </div>
  );
}

export function WikiAction({
  page,
  label,
  primary = false,
}: {
  page: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <a
      href={wikiHref(page)}
      target="_blank"
      rel="noopener noreferrer"
      className={primary ? "btn btn-primary" : "text-link"}
    >
      {label}
      <ExternalLink size={primary ? 15 : 13} />
    </a>
  );
}
