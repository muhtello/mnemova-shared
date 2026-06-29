"use strict";
// Cross-platform "todo" model: a short checklist of setup/progress milestones
// shared by web and mobile. Both apps share the SAME ids and relevance logic;
// only the presentation (icons, CTAs, translation keys) is platform-specific
// and lives in each app. Per-app "suggestions" are a SEPARATE, local concept
// and intentionally do NOT live here.
Object.defineProperty(exports, "__esModule", { value: true });
