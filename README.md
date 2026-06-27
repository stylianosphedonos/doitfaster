# FormDocs

A simple application to configure fixed forms in an admin panel, display them as cards on the main page, and let users fill them in and export as PDF.

## Features

- **Main page** — Group cards; click a group to see its forms
- **Group page** (`/groups/[id]`) — Forms belonging to a group
- **Admin page** (`/admin`) — Four tabs (role-dependent):
  - **Groups** — Create, edit, and delete form groups
  - **Forms** — Create, edit, and delete forms (assigned to a group)
  - **Users** — Admin only: manage users and approve access requests
  - **Settings** — Branding: rename app/main page texts, upload logo and banner
- **Login** (`/login`) — Sign in or request access (username, password, email required; phone and address optional)
- **Roles** — Admin (full access), Super user (admin except Users tab), User (preview/export forms when logged in)

Default admin account (seeded on first run): username `admin`, password `admin123`
- **Form page** (`/forms/[id]`) — Fill in text fields, preview PDF, and export

## Field types

- Text
- Long text (textarea)
- Date
- Email

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Main page** — Browse and open forms
- **Admin** — Configure new forms and fields

Form configurations are stored in `data/forms.json`, groups in `data/groups.json`, and branding settings in `data/settings.json`. Uploaded logo and banner images are saved to `public/branding/`.

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- jsPDF for PDF generation
