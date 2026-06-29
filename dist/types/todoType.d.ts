export type TodoId = "introduce-app" | "use-on-desktop" | "edit-on-desktop" | "create-first-deck" | "complete-first-session" | "sign-in-to-sync" | "enable-study-reminders" | "closed-testing-feedback" | "cards-due" | "first-session" | "build-library" | "try-mobile";
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
    isDone: (snapshot: TodoSnapshot) => boolean;
    getValues?: (snapshot: TodoSnapshot) => Record<string, unknown>;
}
