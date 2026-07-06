import type { TodoDefinition, TodoId, TodoSnapshot } from "../types/todoType";

// Canonical milestone rules, keyed by id. Adding a new shared todo = adding one
// entry here plus its per-platform presentation; component logic never changes.
export const TODO_DEFINITIONS: Record<TodoId, TodoDefinition> = {
  "create-first-deck": { id: "create-first-deck", isDone: (s) => s.deckCount > 0 },
  "complete-first-session": { id: "complete-first-session", isDone: (s) => s.hasStudied },
  "sign-in-to-sync": { id: "sign-in-to-sync", isDone: (s) => s.isLoggedIn },
  "complete-profile": { id: "complete-profile", isDone: (s) => s.profileComplete },
  "enable-study-reminders": { id: "enable-study-reminders", isDone: (s) => s.notificationsEnabled },
  "build-library": { id: "build-library", isDone: (s) => s.deckCount >= 3 },
};

// Joins a platform's ordered presentation entries with the canonical rules:
// drops only DISMISSED items, keeps everything else (done or not) and attaches a
// resolved `isDone` flag so the card can render a green "done" state. Generic
// over the presentation shape so each app keeps its own icon/CTA fields.
export function resolveTodos<Entry extends { id: TodoId }>(
  entries: Entry[],
  snapshot: TodoSnapshot,
  dismissedIds: string[]
): Array<Entry & { isDone: boolean }> {
  return entries
    .filter((entry) => Boolean(TODO_DEFINITIONS[entry.id]) && !dismissedIds.includes(entry.id))
    .map((entry) => ({ ...entry, isDone: TODO_DEFINITIONS[entry.id].isDone(snapshot) }));
}
