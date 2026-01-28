Supabase setup for Obras-pro

Follow these steps to create the Supabase project, create tables and connect the app.

1) Create a Supabase project
   - Go to https://app.supabase.com/ and sign in (or create an account).
   - Click "New Project" and follow the prompts. Note the project URL (e.g. https://abcxyz.supabase.co) and the `anon` public key.

2) Create tables using the SQL editor
   - In Supabase, go to "SQL" -> "Editor" and create a new query.
   - Copy the contents of `supabase/schema.sql` from this repo and run it.
     This will create `users`, `installers`, `services` and `jobs` tables and insert example data.

3) Quick dev access (for testing only)
   - For quick testing you can disable Row Level Security (RLS) on the tables:
     - In Supabase UI, go to "Table Editor" -> select a table -> "Settings" -> disable "Enable RLS".
   - If you prefer to keep RLS enabled (recommended for production), create policies to allow `anon` to `select`, `insert`, `update`, `delete` as appropriate.

   Example policy (SQL) to allow public SELECT on `users` (development only):

   -- Allow anonymous users to read users (development only)
   CREATE POLICY "anon_select_users" ON public.users
   FOR SELECT
   USING (true);

   Repeat or adapt for `installers`, `services`, and `jobs` as needed.

4) Add environment variables
   - Create a file named `.env` in the project root (do not commit it).
   - Fill with values from Supabase (example shown in `.env.example`):

     VITE_SUPABASE_URL=https://your-project-ref.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...anon-key...

5) Run the app locally
   - Install deps (if not already):

     npm install

   - Start dev server:

     npm run dev

   - The app will load and try to fetch `jobs`, `installers` and `services` from Supabase.

6) Deploying / Publishing
   - When ready, run `npm run build` and `npm run deploy` to publish the site (already wired with `gh-pages`).

7) Notes about files and storage
   - The current implementation stores `items` as JSON in the `jobs.items` column and `photoUrl` as a text URL or data URL.
   - For production, consider using Supabase Storage to upload images and save the public URL in `photoUrl`.

Need help with any of these steps? I can:
- produce the exact SQL to create RLS policies,
- add a small `scripts/seed.js` to insert the example data via the Supabase client,
- add image upload to Supabase Storage and wiring in the UI.
