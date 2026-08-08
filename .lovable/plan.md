# TutorFlow — Plan. Teach. Track. Offline.

An offline-first lesson planner. All your data lives on your own device. No account, no internet needed for daily use.

## 1. How it works in plain language

- Everything you type (students, subjects, chapters, topics, lessons, notes) is saved into a small database built into your browser, on your phone or laptop.
- The app files themselves are cached, so opening the app with no internet still works.
- Backups are plain files you save yourself. You can move them to another device and restore them.
- Nothing is ever sent to any server. No AI, no analytics, no cloud.

## 2. Data structure (the "notebook" layout)

```text
Student
 └── Subject (per student, not shared)
      └── Chapter (01, 02, ...)
           └── Topic

Student
 └── Lesson (one teaching session, has a date)
      └── Lesson Topic (a topic + status + note for that day)

Carry-forward item -> points to a topic left unfinished in a lesson
```

Tables stored on-device (Dexie/IndexedDB):

| Table | Key fields |
| --- | --- |
| students | name, className, groupName, institution, phone, guardianName, preferredTime, startDate, status, notes |
| subjects | studentId, name, orderIndex |
| chapters | subjectId, chapterNumber, title, description, orderIndex |
| topics | chapterId, title, description, orderIndex |
| lessons | studentId, subjectId, chapterId, lessonDate, lessonGoal, generalNote |
| lessonTopics | lessonId, topicId, status (pending/partial/completed), note, understandingRating?, orderIndex |
| carryForwardItems | originalLessonId, topicId, studentId, targetDate, status |
| appSettings | theme, lastBackupAt, dbVersion |

Every table has `id`, `createdAt`, `updatedAt`. IDs are generated on-device (UUID) so backups from two devices never collide — this is also what makes future cloud sync possible.

**History is never rewritten.** A lesson's topic status is stored on the lesson row. Marking Velocity "completed" on Aug 10 does not touch the Aug 8 row. Current progress = the newest status recorded for each topic, so re-teaching a topic can't push progress above 100%.

## 3. Pages and navigation

Bottom tabs on phone, sidebar on desktop:

- **Home** — today's date, summary counts (active students, today's lessons, pending topics, carried forward), today's lesson cards.
- **Today** — all of today's lessons sorted by preferred time, with progress per card.
- **Students** — list, search, add/edit/delete, activate/deactivate. Student profile with Overview / Subjects / Lessons / Progress / Notes; then Subject page → Chapter page → Topics.
- **Lessons** — create lesson (cascading Student → Subject → Chapter → Topics, date defaults to today), lesson execution screen with big Completed / Partial / Pending buttons plus a one-line note, carry-forward action, and full history with filters.
- **Settings** — appearance, export backup, import backup (merge by default, "Replace all" behind typing DELETE), last-backup reminder, clear all data, about.

Global local search across student names, subjects, chapter numbers/titles, topics, and lesson notes.

## 4. Daily flow

Open app → Today → tap student → lesson opens with planned topics → tap status buttons while teaching → optional note → Carry Forward unfinished → done. Saves happen immediately, no explicit save step to forget.

## 5. Backup format

```json
{ "appName": "TutorFlow", "backupVersion": 1, "appVersion": "1.0.0", "exportedAt": "...", "data": { "students": [], "subjects": [] } }
```

Import validates file type, structure, version, required fields and relationships, shows a counted summary ("8 students, 21 subjects, 73 chapters…"), then asks to confirm. Merge is the default; nothing is deleted unless you explicitly choose Replace All and type DELETE.

## 6. Installable app (PWA)

Manifest with name, icons, theme colours, standalone display, plus a cached app shell so it opens offline. When a new version ships you get a small "New version available — Update now" prompt; your database is untouched by updates.

## 7. Build order

1. Design system, layout, navigation shell
2. Database + service layer (students, subjects, chapters, topics, lessons, carry-forward, backup)
3. Students → subjects → chapters → topics screens
4. Lesson creation + execution + carry-forward
5. History, search, filters, progress
6. Dashboard + Today
7. Settings, export/import, clear data
8. PWA install + offline caching
9. Realistic sample data (Rahim, Class 10, Physics/Mathematics, Motion topics) and the full offline acceptance test
10. Mobile polish and performance

I'll build these in phases, checking each one runs before moving on.

## 8. Technical notes

- Stack is fixed here: React + TypeScript + TanStack Start with Tailwind. All data pages render client-side so Dexie/IndexedDB is only touched in the browser, never during server rendering.
- Fonts and icons are bundled locally so nothing is fetched from the internet at runtime.
- Dexie schema versioning with migrations; the database is never dropped on update.
- Lists use pagination/virtualisation and indexed queries so 100 students and 1000+ lessons stay fast.

## 9. Risks and honest limits

- **Browser data can be cleared.** If you clear site data or uninstall, local data is gone. Backups are the only safety net — the app will nudge you.
- **No sync in this version.** Data does not move between your phone and laptop except via backup files. The ID design leaves the door open for sync later.
- **Offline install can't be verified inside the Lovable editor preview** (previews run in a frame where service workers are deliberately blocked). Offline behaviour is verified on the published URL after you install it.
- **iOS Safari** can evict storage from rarely used sites; regular backups cover this.

## 10. Contradictions in the brief, resolved

- The brief asks for Vite/Next and a GitHub repo with hand-written commits; this project runs on TanStack Start and version history is handled for you, so no separate Git steps are needed.
- Lessons in the brief are Student + Subject, but the dashboard shows a chapter per lesson; I'm adding an optional `chapterId` to lessons so a lesson can be labelled with its chapter.
- Calendar is listed as optional — I'll leave it out of the first version to keep it simple, and add it after the core flow is proven.
