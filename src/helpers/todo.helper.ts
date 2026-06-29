import type { TodoDefinition, TodoId, TodoSnapshot } from "../types/todoType";

// Canonical relevance rules, keyed by id. Adding a new home item = adding one
// entry here plus its per-platform presentation; component logic never changes.
// Some concepts intentionally have a web and a mobile id (e.g. "first-session"
// vs "complete-first-session") to preserve each app's existing translation keys.
export const TODO_DEFINITIONS: Record<TodoId, TodoDefinition> = {
  "introduce-app": { id: "introduce-app", isDone: () => false },
  "use-on-desktop": { id: "use-on-desktop", isDone: () => false },
  "try-mobile": { id: "try-mobile", isDone: () => false },
  "closed-testing-feedback": { id: "closed-testing-feedback", isDone: () => false },
  "edit-on-desktop": { id: "edit-on-desktop", isDone: (s) => s.isGuest },
  "create-first-deck": { id: "create-first-deck", isDone: (s) => s.deckCount > 0 },
  "complete-first-session": { id: "complete-first-session", isDone: (s) => s.hasStudied },
  "first-session": { id: "first-session", isDone: (s) => s.hasStudied },
  "sign-in-to-sync": { id: "sign-in-to-sync", isDone: (s) => s.isLoggedIn },
  "enable-study-reminders": { id: "enable-study-reminders", isDone: (s) => s.notificationsEnabled },
  "build-library": { id: "build-library", isDone: (s) => s.deckCount >= 3 },
  "cards-due": {
    id: "cards-due",
    isDone: (s) => s.totalCardsDue === 0,
    getValues: (s) => ({ count: s.totalCardsDue }),
  },
};

// Joins a platform's ordered presentation entries with the canonical rules:
// drops items that are done or dismissed, preserves order, and attaches the
// resolved i18n interpolation values. Generic over the presentation shape so
// each app keeps its own icon/CTA fields.
export function selectActiveTodos<Entry extends { id: TodoId }>(
  entries: Entry[],
  snapshot: TodoSnapshot,
  dismissedIds: string[]
): Array<Entry & { values?: Record<string, unknown> }> {
  return entries
    .filter((entry) => {
      const def = TODO_DEFINITIONS[entry.id];
      return Boolean(def) && !def.isDone(snapshot) && !dismissedIds.includes(entry.id);
    })
    .map((entry) => ({ ...entry, values: TODO_DEFINITIONS[entry.id].getValues?.(snapshot) }));
}
