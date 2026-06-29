"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TODO_DEFINITIONS = void 0;
exports.resolveTodos = resolveTodos;
// Canonical milestone rules, keyed by id. Adding a new shared todo = adding one
// entry here plus its per-platform presentation; component logic never changes.
exports.TODO_DEFINITIONS = {
    "create-first-deck": { id: "create-first-deck", isDone: (s) => s.deckCount > 0 },
    "complete-first-session": { id: "complete-first-session", isDone: (s) => s.hasStudied },
    "sign-in-to-sync": { id: "sign-in-to-sync", isDone: (s) => s.isLoggedIn },
    "enable-study-reminders": { id: "enable-study-reminders", isDone: (s) => s.notificationsEnabled },
    "build-library": { id: "build-library", isDone: (s) => s.deckCount >= 3 },
};
// Joins a platform's ordered presentation entries with the canonical rules:
// drops only DISMISSED items, keeps everything else (done or not) and attaches a
// resolved `isDone` flag so the card can render a green "done" state. Generic
// over the presentation shape so each app keeps its own icon/CTA fields.
function resolveTodos(entries, snapshot, dismissedIds) {
    return entries
        .filter((entry) => Boolean(exports.TODO_DEFINITIONS[entry.id]) && !dismissedIds.includes(entry.id))
        .map((entry) => ({ ...entry, isDone: exports.TODO_DEFINITIONS[entry.id].isDone(snapshot) }));
}
