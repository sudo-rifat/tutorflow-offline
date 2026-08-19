# Tutor Notebook

MASTER PROMPT — TutorFlow

Offline-First PWA Tutor Lesson Planner

You are an expert Product Manager, UX/UI Designer, Offline-First Application Architect, Database Architect, Full-Stack Developer, PWA Developer, QA Engineer, and DevOps Engineer.

I am a private tutor and I do NOT know how to code.

Your job is to design and build a complete, reliable, production-ready Offline-First Progressive Web App (PWA) for managing my students, subjects, chapters, topics, daily lesson plans, teaching progress, and lesson history.

The application is primarily for my personal use.

The most important requirement is:

THE APP MUST WORK FULLY OFFLINE.

The user must be able to use the core application without an internet connection.

Student data, subjects, chapters, topics, lessons, progress, notes, and settings must be stored locally on the device.

Internet must NOT be required for normal daily usage.

1. PRODUCT NAME

Application name:

TutorFlow

Tagline:

Plan. Teach. Track. Offline.

2. CORE PROBLEM

As a private tutor, I teach multiple students.

For each student I need to remember:

Which subjects I teach

Which chapter I am currently teaching

Which topics I have already completed

Which topics remain

What I will teach today

What I actually taught

What was partially completed

What needs to be carried forward to the next lesson

What I taught in previous lessons

The application should replace my paper notebook and scattered notes.

The application must make daily lesson preparation extremely fast.

3. MOST IMPORTANT PRODUCT PRINCIPLE

This is an:

OFFLINE-FIRST PWA

Not an internet-dependent web application.

The application must follow this principle:

Local data first. Internet optional.

The app should work normally when:

Wi-Fi is OFF

Mobile data is OFF

There is no internet

The user is traveling

The browser is offline

4. TECHNOLOGY REQUIREMENTS

Use a modern web stack.

Recommended:

Frontend:

React

TypeScript

Vite or Next.js if it genuinely improves the PWA architecture

PWA:

Service Worker

Web App Manifest

Installable on Android/Desktop

Offline caching

Local Database:
IndexedDB

Use a proper IndexedDB abstraction library such as:

Dexie.js

Do NOT use localStorage as the primary database.

localStorage may only be used for tiny preferences such as:

theme

UI preferences

selected view

All actual application data must be stored in IndexedDB.

UI:

Tailwind CSS

Clean reusable components

Lucide icons

5. NO CLOUD DATABASE FOR MVP

Do NOT require:

Supabase

Firebase

PostgreSQL

Any cloud database

for the core MVP.

The MVP must be completely local.

The application must work even if the user never creates an account.

6. LOCAL DATABASE

Use IndexedDB through Dexie.js.

Create a proper database structure.

Suggested tables:

users/settings if necessary
students
subjects
chapters
topics
lessons
lessonTopics
carryForwardItems
appSettings

You may improve this schema if necessary.

7. DATA RELATIONSHIPS

The core relationship should be:

Student
↓
Subject
↓
Chapter
↓
Topic

And:

Student
↓
Lesson
↓
Lesson Topics
↓
Topic

Example:

Student:
Rahim

Subjects:

Physics
Mathematics
Chemistry

Physics:

Chapter 01 — Measurement
Chapter 02 — Motion

Chapter 02:

Distance
Displacement
Speed
Velocity
Acceleration

8. STUDENTS

Student fields:

id

name

className

groupName

institution

phone

guardianName

preferredTime

startDate

status

notes

createdAt

updatedAt

Status:

active
inactive

Required:

name
className

All other fields optional.

9. SUBJECTS

Each student has their own custom subject list.

Example:

Student A:

Physics
Chemistry
Mathematics

Student B:

Mathematics
English

Do NOT create a single global subject list that forces every student to have the same subjects.

Subject fields:

id

studentId

name

orderIndex

createdAt

updatedAt

Allow:

Add

Edit

Delete

Reorder

10. CHAPTERS

Each subject can contain chapters.

Fields:

id

subjectId

chapterNumber

title

description

orderIndex

createdAt

updatedAt

Example:

Physics

01 — Measurement
02 — Motion
03 — Force

Chapter number must be searchable and sortable.

11. TOPICS

Each chapter can contain topics.

Fields:

id

chapterId

title

description

orderIndex

createdAt

updatedAt

Allow:

Add

Edit

Delete

Reorder

Example:

Chapter 02 — Motion:

Distance

Displacement

Speed

Velocity

Acceleration

12. LESSONS

A lesson represents one planned or completed teaching session.

Fields:

id

studentId

subjectId

lessonDate

lessonGoal

generalNote

createdAt

updatedAt

The lesson date must automatically default to:

today

The user must be able to change the date.

The application must handle dates correctly in the user's local timezone.

13. LESSON TOPICS

Create a separate relationship between lessons and topics.

Fields:

id

lessonId

topicId

status

note

orderIndex

createdAt

updatedAt

Status:

pending

partial

completed

Optional:

understandingRating from 1–5

Do not make rating mandatory.

14. IMPORTANT: HISTORICAL DATA

Never destroy lesson history.

Example:

August 8:

Velocity = Partial

August 10:

Velocity = Completed

The August 8 lesson must continue to show:

Velocity = Partial

The current progress can show:

Velocity = Completed

Historical lessons must remain unchanged.

15. CARRY-FORWARD SYSTEM

This is one of the most important features.

Suppose today's lesson contains:

Completed:
Distance
Displacement

Partial:
Velocity

Pending:
Acceleration

The user can select:

Carry Forward

The unfinished topics should become available for a future lesson.

IMPORTANT:

Do NOT duplicate the actual Topic record.

Maintain references to the original topic.

Preserve historical lesson data.

A carry-forward item should contain information such as:

id

originalLessonId

topicId

studentId

targetDate

status

createdAt

updatedAt

The tutor should be able to:

Carry forward

Reschedule

Remove from carry-forward

Complete later

16. DAILY WORKFLOW

The normal workflow should be extremely fast:

Open App
↓
Today's Dashboard
↓
See today's students
↓
Open student
↓
Open today's lesson
↓
See planned topics
↓
Teach
↓
Mark:
Completed / Partial / Pending
↓
Add short note if needed
↓
Carry Forward unfinished topics
↓
Save

The entire process should require minimal typing.

17. DASHBOARD

The Dashboard is the most important page.

Show:

TODAY

Today's date.

Then:

Today's lessons

Example:

Rahim
7:00 PM

Physics
Chapter 02 — Motion

Topics:
✓ Distance
✓ Displacement
~ Velocity
○ Acceleration

[Open Lesson]

Also show summary:

Active Students
Today's Lessons
Pending Topics
Carried Forward Topics

Example:

8 Students
4 Lessons Today
7 Pending
3 Carried Forward

18. TODAY PAGE

Create a dedicated Today page.

Show all lessons planned for today.

Sort by:

preferredTime when available.

Each card should show:

Student

Subject

Chapter

Topic count

Progress

Time

Open Lesson

19. STUDENTS PAGE

Create:

/students

Show all students.

Each student should show:

Name

Class

Subjects

Active/inactive

Pending topics

Next lesson

Actions:

View
Edit
Delete
Activate/Deactivate

Add:

+ Add Student

20. STUDENT PROFILE

Student profile should show:

Name
Class
Status

Sections:

Overview

Subjects

Lessons

Progress

Notes

Overview:

Total Subjects
Total Chapters
Total Topics
Completed
Pending
Upcoming Lesson

21. SUBJECT PAGE

For each student:

Physics
Mathematics
Chemistry

Clicking Physics should show:

Chapters

Progress

Recent lessons

Pending topics

22. CHAPTER PAGE

Show:

Chapter Number
Chapter Title
Description

Then:

Topics

Example:

Chapter 02 — Motion

5 Topics

Completed: 3
Partial: 1
Pending: 1

Progress:

60% or appropriate calculation

23. TOPIC MANAGEMENT

Allow:

Add Topic
Edit Topic
Delete Topic
Reorder Topic

Topic progress should be visible.

24. CREATE LESSON

Create a fast lesson creation form.

Fields:

Date
Student
Subject
Chapter
Topics
Lesson Goal
General Note

Default date:

TODAY

Important cascading selection:

Student
↓
Only that student's subjects
↓
Only that subject's chapters
↓
Only that chapter's topics

Do not show irrelevant records.

25. LESSON EXECUTION PAGE

Show:

Date
Student
Subject
Chapter

Then:

Distance
[Completed] [Partial] [Pending]

Displacement
[Completed] [Partial] [Pending]

Velocity
[Completed] [Partial] [Pending]

Acceleration
[Completed] [Partial] [Pending]

Make status changes extremely quick.

Prefer buttons/toggles over opening additional forms.

26. LESSON NOTES

Allow a short note for each topic.

Example:

Velocity:

Status: Partial

Note:

"Student is confusing velocity with speed."

Also allow a general lesson note.

27. LESSON HISTORY

Create a lesson history page.

Allow filtering by:

Student

Subject

Date

Status

Example:

08 Aug 2026
Rahim
Physics
Chapter 02 — Motion

Completed: 2
Partial: 1
Pending: 1

Click to open the complete lesson.

28. SEARCH

Implement fast local search.

Search:

Student name

Subject

Chapter number

Chapter title

Topic

Lesson notes

Example:

Search:

velocity

Show:

Rahim
Physics
Chapter 02
Velocity

08 Aug 2026
Partial

Search must work offline because all data is local.

29. FILTERS

Allow:

Student
Subject
Date
Status

All filtering must happen locally.

Do not require server requests.

30. PROGRESS TRACKING

Show progress for:

Student
Subject
Chapter

Example:

Physics:

Total Topics: 20
Completed: 12
Partial: 3
Pending: 5

Progress:

60%

IMPORTANT:

Do not calculate historical lesson progress by simply counting lessons.

Use the current topic state appropriately.

Do not allow repeated lessons to artificially inflate progress.

31. CALENDAR

Calendar can be included if it does not complicate the MVP.

Show:

Planned lessons

Completed lessons

Pending/carry-forward items

Click a date:

Show that day's lessons.

Calendar must work completely offline.

32. PWA REQUIREMENTS

The application must be a real installable PWA.

Implement:

Web App Manifest

Service Worker

Offline caching

App icons

Splash/launch experience where supported

Installable on Android

Installable on desktop browsers

The application should be usable as an installed app.

33. OFFLINE REQUIREMENTS

This is CRITICAL.

After the first successful app load:

The application should remain usable even if the internet disappears.

Test:

Open app online.

Install PWA.

Turn off Wi-Fi.

Turn off mobile data.

Restart app.

Open students.

Add student.

Edit student.

Create lesson.

Mark topics completed.

Carry forward a topic.

Search.

View history.

Close app.

Reopen app.

All core functionality must continue working.

34. LOCAL DATA PERSISTENCE

Use IndexedDB via Dexie.js.

Never rely on:

React state

localStorage

browser memory

for permanent application data.

Every important change must be persisted to IndexedDB.

Examples:

Adding student
Editing student
Adding subject
Creating lesson
Changing topic status
Carry-forward
Deleting records

All must persist after browser restart.

35. DATA EXPORT

This is a REQUIRED MVP feature.

The user must be able to export all application data.

Create:

Settings
↓
Data Management
↓
Export Data

Button:

Export Backup

Export all necessary data into a portable file.

Recommended format:

JSON

Example filename:

TutorFlow_Backup_2026-08-08.json

The exported JSON should contain:

Students

Subjects

Chapters

Topics

Lessons

Lesson topics

Carry-forward items

App settings if necessary

Do not export unnecessary internal cache data.

36. DATA IMPORT

Also REQUIRED.

Create:

Import Backup

The user selects a TutorFlow JSON backup file.

The application must:

Validate the file.

Check schema/version.

Show a summary.

Ask for confirmation.

Import the data.

Preserve relationships.

Report success/failure.

Example:

"This backup contains:

8 students
21 subjects
73 chapters
310 topics
185 lessons

Do you want to import?"

[Cancel]
[Import]

37. IMPORT SAFETY

Never blindly overwrite existing data.

Support at least:

Merge Import

Meaning:

Existing data remains.

Imported data is added/updated safely.

Also consider:

Replace All

Merge

If Replace All is implemented, require strong confirmation.

Example:

"WARNING: This will delete current local data."

Do NOT make destructive import the default.

38. BACKUP VERSIONING

Every exported backup should contain:

appName

backupVersion

exportedAt

appVersion

data

Example structure:

{
"appName": "TutorFlow",
"backupVersion": 1,
"appVersion": "1.0.0",
"exportedAt": "...",
"data": {
...
}
}

Future versions of the app must be able to migrate old backup formats.

39. DATA VALIDATION DURING IMPORT

Never import arbitrary JSON directly.

Validate:

file type

JSON structure

backup version

required fields

IDs

relationships

dates

If invalid:

Show a human-friendly message.

Example:

"This backup file is not compatible with TutorFlow."

40. BACKUP REMINDER

Optional but recommended:

Show a small reminder in Settings:

"Last backup: 8 days ago"

If the user has never exported data:

"Your data exists only on this device. Create a backup."

Do not annoy the user with popups.

41. DATA LOSS WARNING

Because data is stored locally, make this clear in Settings:

"Your data is stored on this device. Export regular backups so you can restore it if the browser/app data is cleared."

Keep the wording short and friendly.

42. OPTIONAL FUTURE SYNC

Do NOT implement cloud sync in MVP.

But architect the data layer so that future versions can support:

Local IndexedDB
↓
Optional Cloud Sync
↓
Multiple Devices

The MVP should remain fully functional without cloud sync.

43. SETTINGS PAGE

Create:

Settings

Sections:

Appearance
Data Management
About

Data Management:

Export Backup

Import Backup

Last Backup

Clear All Data

Clear All Data must require strong confirmation.

44. CLEAR ALL DATA

Provide:

Delete All Local Data

But require confirmation twice.

Example:

"All students, lessons, subjects, topics and settings will be permanently deleted from this device."

Require the user to type:

DELETE

before allowing deletion.

45. OFFLINE-FIRST UI

The application should clearly indicate the local/offline nature.

A small status indicator can show:

🟢 Local data saved

or:

📴 Offline mode

Do NOT constantly show alarming offline messages.

Offline is normal for this application.

46. NO INTERNET DEPENDENCY

Do not make normal functionality dependent on:

External APIs

Online fonts

CDN-only libraries

Remote images

Cloud database

AI APIs

The installed app should continue working without internet.

Bundle necessary application assets locally.

47. AI FEATURES

Do NOT make AI features part of the core MVP.

Later versions may include:

AI lesson planner
AI homework generator
AI revision planner
AI weak-topic analysis
AI next-lesson suggestion

These can be added later.

The core application must remain useful without AI.

48. MOBILE-FIRST DESIGN

The main usage will often be on a phone.

Design mobile-first.

Important actions must be easy to tap.

Avoid tiny buttons.

Use large touch targets.

Lesson status controls should be extremely easy to use during a class.

Recommended bottom navigation:

Home
Today
Students
Lessons
Settings

Use desktop sidebar/navigation when screen width is large.

49. UI STYLE

Style:

Minimal
Clean
Fast
Modern
Professional
Teacher-friendly

Avoid:

Overly colorful UI

Complex animations

Excessive gradients

Huge dashboards

Unnecessary charts

Enterprise-style complexity

Use status colors meaningfully:

Green = Completed
Yellow = Partial
Red/orange = Pending
Neutral = Not started

50. EMPTY STATES

Every empty screen needs a useful message.

Example:

"No students yet."

"Add your first student to start planning lessons."

[+ Add Student]

Never show a blank screen.

51. ERROR HANDLING

Never expose technical errors.

Bad:

"IndexedDB ConstraintError"

Good:

"Unable to save this student. Please try again."

For developers, log useful technical information.

52. DELETE CONFIRMATION

Require confirmation for:

Student
Subject
Chapter
Topic
Lesson
All data

Explain consequences where necessary.

53. ACCESSIBILITY

Use:

Semantic HTML

Keyboard navigation

Proper labels

Accessible buttons

Sufficient contrast

Focus states

Screen-reader-friendly labels

Do not rely only on color to communicate status.

For example:

Completed ✓
Partial ~
Pending ○

54. PERFORMANCE

The app must remain fast with:

100 students
1,000+ lessons
Thousands of topics

Use IndexedDB queries efficiently.

Do not load every record unnecessarily.

Use pagination/virtualization where appropriate.

Avoid expensive re-renders.

55. DATA INTEGRITY

Maintain relationships correctly.

For example:

Student deleted
↓
Ask whether related subjects/lessons should also be removed.

Do not leave orphan records.

Use safe cascading logic.

Before deleting important records, confirm consequences.

56. COMPONENT ARCHITECTURE

Create reusable components such as:

StudentCard
StudentForm
SubjectCard
ChapterCard
TopicList
LessonCard
LessonForm
TopicStatusButton
ProgressBar
SearchBar
FilterBar
ConfirmDialog
EmptyState
LoadingState
ErrorState
BackupManager
ImportDialog

Avoid duplicate code.

57. CODE ARCHITECTURE

Separate:

UI
Business logic
Database layer
Validation
Utilities
Types

For example:

src/
components/
pages/
db/
services/
hooks/
types/
utils/
lib/

You may improve the structure if appropriate.

58. DATABASE ABSTRACTION

Do not directly call IndexedDB from every UI component.

Create a clean database/service layer.

For example:

studentService
subjectService
chapterService
topicService
lessonService
backupService

This will make future cloud sync easier.

59. VERSIONED DATABASE

Use Dexie database versioning.

When the schema changes in future versions:

Implement migrations.

Never randomly delete or recreate the database during application updates.

Existing user data must survive app updates.

60. PWA UPDATE STRATEGY

When a new version of the application is released:

Do not silently destroy cached data.

Notify the user when an update is available.

Example:

"New version available."

[Update Now]

Ensure IndexedDB data survives updates.

61. TESTING

Test offline functionality specifically.

Test:

First install

First load

Offline reload

Add student offline

Edit student offline

Delete student offline

Add subject offline

Add chapter offline

Add topic offline

Create lesson offline

Change topic status offline

Carry forward offline

Search offline

History offline

Export offline

Import offline

Browser restart

PWA restart

Update application version

62. REALISTIC TEST DATA

Use:

Student:

Rahim
Class 10

Subjects:

Physics
Mathematics

Physics:

Chapter 01 — Measurement
Chapter 02 — Motion

Motion:

Distance
Displacement
Speed
Velocity
Acceleration

Create multiple lessons.

Test carry-forward.

Test progress.

Test backup.

Delete the local database.

Restore from backup.

Verify that all data returns correctly.

63. CRITICAL ACCEPTANCE TEST

The MVP is NOT complete until this works:

Install TutorFlow as a PWA.

Turn off internet.

Open TutorFlow.

Create Rahim.

Add Physics.

Add Chapter 2 — Motion.

Add:
Distance
Displacement
Velocity
Acceleration

Create today's lesson.

Select Velocity and Acceleration.

Mark Velocity Partial.

Mark Acceleration Pending.

Save.

Carry Forward both unfinished topics.

Create tomorrow's lesson.

See the carried-forward topics.

Complete Acceleration.

Verify yesterday's lesson remains unchanged.

Verify current progress updates.

Search for Velocity.

Find the correct lesson.

Export complete backup.

Delete local data.

Import the backup.

Verify all data returns.

Close browser.

Reopen.

Turn internet OFF.

Everything still works.

If any step fails, fix it.

64. SECURITY AND PRIVACY

Because this is a local-first application:

Do not send student information to external servers.

Do not use analytics that transmit student data.

Do not send student names, notes, phone numbers, or lesson information to any AI service.

All student data must remain local unless the user explicitly chooses a future cloud-sync feature.

65. FUTURE CLOUD SYNC ARCHITECTURE

Design the database layer so that later we can add:

Local DB
↓
Sync Engine
↓
Cloud Database

Possible future features:

Login

Backup to cloud

Multiple devices

Conflict resolution

Automatic synchronization

But NONE of this is required for MVP.

66. FUTURE AI ARCHITECTURE

Later, AI can operate on selected local data.

For privacy:

Only send the minimum required information to an AI API.

Never automatically send the entire student database.

The user should explicitly trigger AI features.

67. GITHUB

Create a Git repository.

Use meaningful commits:

Initial project setup
Add PWA foundation
Add IndexedDB database
Add student management
Add subjects
Add chapters and topics
Add lesson planner
Add progress tracking
Add carry-forward
Add dashboard
Add backup/export
Add import/restore
Add offline testing
Fix mobile UI
Production release

68. README

Create a beginner-friendly README explaining:

What TutorFlow is

How offline storage works

How to run locally

How to install the PWA

How backups work

How to restore backups

How to update the app

How the database works

How to build for production

69. BEGINNER-FRIENDLY AI DEVELOPMENT

I do NOT know how to code.

Therefore:

Do not assume programming knowledge.

Whenever I need to perform an action:

Tell me exactly:

Where to click/open

What command to run

What I should expect

What to do if there is an error

If you need a technical decision from me:

Explain it simply.

Then recommend the best option.

Do not ask unnecessary technical questions.

70. DEVELOPMENT RULE

Do NOT generate the entire project blindly in one response.

Build in controlled phases.

After each phase:

Implement

Run

Test

Fix errors

Verify

Commit to Git

Continue

Never knowingly move forward with broken functionality.

71. DEVELOPMENT PHASES

Implement in this exact order:

PHASE 1
Project setup

PHASE 2
PWA foundation

PHASE 3
IndexedDB + Dexie database

PHASE 4
Database service layer

PHASE 5
Student management

PHASE 6
Subject management

PHASE 7
Chapter management

PHASE 8
Topic management

PHASE 9
Lesson creation

PHASE 10
Lesson execution and statuses

PHASE 11
Carry-forward

PHASE 12
Lesson history

PHASE 13
Dashboard

PHASE 14
Search and filters

PHASE 15
Progress tracking

PHASE 16
Export backup

PHASE 17
Import/restore

PHASE 18
Settings/data management

PHASE 19
Mobile optimization

PHASE 20
Offline testing

PHASE 21
Performance optimization

PHASE 22
Production build

PHASE 23
Deployment

72. FINAL PRODUCT PRINCIPLE

TutorFlow should answer these questions immediately:

"Who do I teach today?"

"What subject?"

"Which chapter?"

"What topics?"

"What did I finish?"

"What remains?"

"What should move to tomorrow?"

"What have I taught before?"

"How far has this student progressed?"

And it must answer all of these:

WITHOUT INTERNET.

The application should feel like a digital teaching notebook that is:

Fast
Private
Offline
Reliable
Simple

73. START NOW

DO NOT start coding immediately.

First provide:

Final architecture

IndexedDB/Dexie database schema

Entity relationships

Page structure

Navigation structure

User flow

PWA architecture

Backup/import architecture

Development phases

Potential technical risks

Explain everything in simple language because I am not a programmer.

Identify any contradictions or missing requirements.

Recommend improvements if necessary.

After presenting the architecture, WAIT for my approval.

Only after approval should you begin:

PHASE 1 — Project Setup

Do not skip planning.

Do not generate the entire application at once.

Build it carefully, test it, and keep the application simple.

END OF MASTER PROMPT

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tutorflow-offline.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/56d67271-af81-47b4-bf7c-bb0c19552fcc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
