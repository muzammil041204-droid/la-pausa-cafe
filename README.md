# La Pausa Caffè — Menu

A phone-first digital menu built with React, Tailwind, GSAP and Lenis.

- `/` is the customer menu.
- `/admin` is the menu editor, where you can change photos, names, descriptions, prices, categories, sold out, today's special and cafe info.

## Run it

```bash
npm install
npm run dev
```

Without Supabase keys the site runs in **demo mode**: `/admin` opens without a login, and edits are saved only in that browser.

## Connect Supabase (so edits reach every customer)

1. Create a free project at supabase.com.
2. Open **SQL Editor**, paste all of `supabase/setup.sql` and click **Run**.
3. Go to **Authentication → Users → Add user**, enter the owner's email and password, and tick *Auto confirm*.
4. Back in the SQL Editor, run this with that email:
   `insert into public.admins (email) values ('owner@example.com');`
5. Go to **Authentication → Sign In / Providers** and turn off **Allow new users to sign up**.
6. Copy `.env.example` to `.env` and paste the **Project URL** and **anon public key** from Project Settings → API.
7. Restart `npm run dev`. `/admin` now asks for the login.

## Deploy (Netlify)

Build command `npm run build`, publish folder `dist`. Add the two `VITE_SUPABASE_*` values as environment variables in Netlify. `public/_redirects` makes `/admin` work on refresh.

## Notes

- Starter menu and prices live in `src/data/seed.js`. If you change it, regenerate the SQL with `node scripts/make-sql.mjs`.
- Food photos are in `public/menu/`. The originals in `photos/` had their backgrounds removed and were converted to WebP.
- Photos uploaded from `/admin` are shrunk on the phone before upload, so the menu stays fast.
