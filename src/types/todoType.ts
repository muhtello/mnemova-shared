// Cross-platform "todo" model: a short checklist of setup/progress milestones
// shared by web and mobile. Both apps share the SAME ids and relevance logic;
// only the presentation (icons, CTAs, translation keys) is platform-specific
// and lives in each app. Per-app "suggestions" are a SEPARATE, local concept
// and intentionally do NOT live here.

// Canonical milestone ids — each has a clear "done" state. Kept identical to the
// ids both apps already persist as "dismissed", so centralising the logic does
// NOT reset anyone's dismissals.
export type TodoId =
  | "create-first-deck"
  | "complete-first-session"
  | "sign-in-to-sync"
  | "enable-study-reminders"
  | "build-library";

// State both home screens derive milestone completion from. A platform fills the
// fields its rendered milestones actually use and leaves the rest at defaults.
export interface TodoSnapshot {
  deckCount: number;
  hasStudied: boolean;
  isLoggedIn: boolean;
  notificationsEnabled: boolean;
}

export interface TodoDefinition {
  id: TodoId;
  // True once the milestone is satisfied. The item STAYS visible but renders a
  // "done" (green) state — it is not auto-hidden.
  isDone: (snapshot: TodoSnapshot) => boolean;
}
