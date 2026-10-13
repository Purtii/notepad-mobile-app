# Notepad Mobile App

Notes app for iOS built with React Native, Expo and TypeScript. Create, read, edit and delete notes, stored in a Supabase (PostgreSQL) database. 

## Tech stack
- React Native, Expo, Expo Router, TypeScript
- Supabase (PostgreSQL)

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase URL and publishable key
3. Create a `notes` table in Supabase (id uuid, title text, description text, created_at timestamptz)
4. `npx expo start` and scan the QR code with Expo Go
