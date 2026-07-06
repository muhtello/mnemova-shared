export type TodoId = "create-first-deck" | "complete-first-session" | "sign-in-to-sync" | "complete-profile" | "enable-study-reminders" | "build-library";
export interface TodoSnapshot {
    deckCount: number;
    hasStudied: boolean;
    isLoggedIn: boolean;
    profileComplete: boolean;
    notificationsEnabled: boolean;
}
export interface TodoDefinition {
    id: TodoId;
    isDone: (snapshot: TodoSnapshot) => boolean;
}
