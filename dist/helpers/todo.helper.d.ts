import type { TodoDefinition, TodoId, TodoSnapshot } from "../types/todoType";
export declare const TODO_DEFINITIONS: Record<TodoId, TodoDefinition>;
export declare function resolveTodos<Entry extends {
    id: TodoId;
}>(entries: Entry[], snapshot: TodoSnapshot, dismissedIds: string[]): Array<Entry & {
    isDone: boolean;
}>;
