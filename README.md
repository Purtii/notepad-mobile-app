# Notepad

**Access your notes.** A simple, fast notes app for iPhone, built with React Native, Expo and TypeScript, with notes stored in the cloud on Supabase.

Built as a university project (*Text Editor on Smartphone*) and as a way to learn React Native, TypeScript and working with a real backend.

<!-- Add a screenshot of the app here, e.g.: ![Notepad screenshot](./docs/screenshot.png) -->

## What the app does

- **Write notes** with a title and a description in a single, always-visible form.
- **Browse all your notes** in a scrollable list, oldest first, with the header staying fixed at the top.
- **Edit any note** by tapping it. Its content loads into the form, the form switches from *Save* to *Update*, and a *Cancel* button lets you back out.
- **Delete a note** with a confirmation step, so nothing disappears by accident.
- **Live word and character counter** while you type.
- **Persistent storage in the cloud.** Notes are kept in a Supabase (PostgreSQL) database, so they survive closing the app, reinstalling it, or switching phones.
- **Sensible validation.** Empty notes can't be saved, and errors from the database are shown to the user instead of failing silently.

## How it works

The whole app is a single screen made of a few simple pieces:

- **State** (`useState`) holds the text currently in the form, the list of notes, and the id of the note being edited. When `editingId` is `null` the form creates a new note, otherwise it updates the existing one. One form, two modes.
- **Data layer** is the Supabase JavaScript client. Each of the four CRUD operations maps to one call: `insert`, `select`, `update` and `delete`, always targeting a row by its `id`.
- **The list** is a `FlatList`, the native, optimized list component, with a stable `id` from the database as its key.
- **Types** (`Note`, `Draft`) describe the shape of the data in TypeScript, so mistakes like a misspelled field are caught while writing the code, not while running it.

After every change, the app reloads the list from the database, so what you see on screen is always what is actually stored.

## Tech stack

| Area | Tools |
|---|---|
| App | React Native, Expo, Expo Router |
| Language | TypeScript |
| Backend | Supabase (PostgreSQL, auto-generated API) |
| Tooling | VS Code, Expo Go, Git and GitHub |

## Design decisions

  - Moving to Supabase made the data independent from the device and introduced real backend concepts: tables, SQL, API keys and access policies.
  - The goal was to get the core logic right (state, CRUD, async calls) before adding navigation.

## Running it locally

```bash
npm install
cp .env.example .env   # then add your Supabase URL and publishable key
npx expo start         # scan the QR code with Expo Go
```
