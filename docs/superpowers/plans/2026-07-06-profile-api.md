# Profile API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal current-user profile read/update flow in the isolated `/auth` test area.

**Architecture:** Use the existing Supabase session cookie to identify the current auth user on the server, map that auth UUID to the app `users` row via `auth_user_id`, then read/update the linked `profiles` row through server-side route handlers.

**Tech Stack:** Next.js App Router route handlers, React client component state, `@supabase/ssr`, `@supabase/supabase-js`, Supabase Auth, Supabase Postgres.

---
