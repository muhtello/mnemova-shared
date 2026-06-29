// Cross-platform "todo"/"suggestion" model. Web (home suggestions) and mobile
// (home todos) share the SAME relevance logic and ids; only the presentation
// (icons, CTAs, translation keys) is platform-specific and lives in each app.

// Canonical ids — kept identical to the ids both apps already persist as
// "dismissed", so centralising the logic does NOT reset anyone's dismissals.
export type TodoId =
  | "introduce-app"
  | "use-on-desktop"
  | "edit-on-desktop"
  | "create-first-deck"
  | "complete-first-session"
  | "sign-in-to-sync"
  | "enable-study-reminders"
  | "closed-testing-feedback"
  | "cards-due"
  | "first-session"
  | "build-library"
  | "try-mobile";

// Superset of the state both home screens derive relevance from. A platform
// fills the fields its item set actually uses and leaves the rest at defaults.
export interface TodoSnapshot {
  deckCount: number;
  totalCardsDue: number;
  hasStudied: boolean;
  isLoggedIn: boolean;
  notificationsEnabled: boolean;
  isGuest: boolean;
}

export interface TodoDefinition {
  id: TodoId;
  // Returns true once the item is satisfied and should auto-hide.
  isDone: (snapshot: TodoSnapshot) => boolean;
  // Interpolation values for i18n (e.g. the live cards-due `count`, which also
  // drives plural selection). Resolved per render so counts stay reactive.
  getValues?: (snapshot: TodoSnapshot) => Record<string, unknown>;
}
