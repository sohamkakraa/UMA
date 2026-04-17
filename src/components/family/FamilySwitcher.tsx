"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Users, GitBranch, User, Heart, Baby, UserCircle } from "lucide-react";
import { FamilyTreeView } from "@/components/family/FamilyTreeView";
import { cn } from "@/components/ui/cn";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/DropdownMenu";
import {
  getStore,
  getActiveFamilyMember,
  setActiveFamilyMember,
} from "@/lib/store";
import type { FamilyMemberMeta } from "@/lib/types";
import { FAMILY_RELATION_LABELS } from "@/lib/types";

/** Return a small Lucide icon for a family relation. */
function RelationIcon({ relation, className }: { relation: string; className?: string }) {
  const cls = cn("h-3.5 w-3.5 shrink-0 text-[var(--muted)]", className);
  switch (relation) {
    case "mother":
    case "father":
    case "grandfather":
    case "grandmother":
      return <Users className={cls} />;
    case "spouse":
    case "husband":
    case "wife":
      return <Heart className={cls} />;
    case "son":
    case "daughter":
    case "child":
      return <Baby className={cls} />;
    case "brother":
    case "sister":
      return <UserCircle className={cls} />;
    case "self":
      return <User className={cls} />;
    default:
      return <User className={cls} />;
  }
}

export function FamilySwitcher() {
  const [activeMember, setActiveMember] = useState<FamilyMemberMeta | null>(null);
  const [members, setMembers] = useState<FamilyMemberMeta[]>([]);
  const [selfName, setSelfName] = useState("");
  const [showFamilyTree, setShowFamilyTree] = useState(false);

  function refresh() {
    const root = getStore();
    setMembers(root.familyMembers ?? []);
    setSelfName(root.profile.firstName || root.profile.name || "Me");
    setActiveMember(getActiveFamilyMember());
  }

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("mv-store-update", onUpdate);
    window.addEventListener("mv-active-member-changed", onUpdate);
    window.addEventListener("focus", onUpdate);
    return () => {
      window.removeEventListener("mv-store-update", onUpdate);
      window.removeEventListener("mv-active-member-changed", onUpdate);
      window.removeEventListener("focus", onUpdate);
    };
  }, []);

  const displayName = activeMember ? activeMember.displayName : selfName;

  if (members.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2.5 py-1.5 text-xs transition-colors hover:bg-[var(--panel)]",
              activeMember && "border-[var(--accent)]/40 bg-[var(--accent)]/8"
            )}
            aria-label={`Viewing: ${displayName}. Tap to switch.`}
          >
            <RelationIcon relation={activeMember?.relation ?? "self"} className="text-[var(--accent)]" />
            <span className="font-medium text-[var(--fg)] max-w-[7rem] truncate">{displayName}</span>
            <ChevronDown className="h-3 w-3 text-[var(--muted)] shrink-0 transition-transform" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuLabel>Switch profile</DropdownMenuLabel>

          {/* Self */}
          <DropdownMenuItem
            onSelect={() => setActiveFamilyMember(undefined)}
            className={cn(!activeMember && "bg-[var(--panel-2)] font-medium")}
          >
            <User className="h-3.5 w-3.5 shrink-0 text-[var(--accent)] mr-1" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--fg)] truncate">{selfName}</p>
              <p className="text-[10px] text-[var(--muted)]">Primary profile</p>
            </div>
            {!activeMember && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            )}
          </DropdownMenuItem>

          {/* Family members */}
          {members.map((m) => (
            <DropdownMenuItem
              key={m.id}
              onSelect={() => setActiveFamilyMember(m.id)}
              className={cn(activeMember?.id === m.id && "bg-[var(--panel-2)] font-medium")}
            >
              <RelationIcon relation={m.relation} className="mr-1" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--fg)] truncate">{m.displayName}</p>
                <p className="text-[10px] text-[var(--muted)]">{FAMILY_RELATION_LABELS[m.relation]}</p>
              </div>
              {activeMember?.id === m.id && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => setShowFamilyTree(true)}>
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
            <span className="text-xs text-[var(--muted)]">View family tree</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => { window.location.href = "/profile#profile-family"; }}>
            <Users className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
            <span className="text-xs text-[var(--muted)]">Manage family profiles</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showFamilyTree && <FamilyTreeView onClose={() => setShowFamilyTree(false)} />}
    </>
  );
}
