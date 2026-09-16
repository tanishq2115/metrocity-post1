LOKMADAT WEBSITE — COMPLETE BACKUP PACKAGE

Homepage/current design baseline:
- index.html
- styles.css
- homepage.js
- reader.js
- epaper.css
- lokmadat-logo.png
- supabase-config.js

Website / GitHub infrastructure:
- CNAME
- admin.html
- admin-login.css
- login.html
- article.html
- news.html
- epaper.html

Supabase:
- supabase-config.js contains the browser-side Supabase project URL and publishable key used by the site.
- direct_newspaper_migration.sql contains the direct-newspaper migration used by the e-paper system.

IMPORTANT SECURITY NOTE:
Do not put a Supabase service-role/secret key into this package or into GitHub Pages. The browser-side publishable key is intended for frontend use; database/storage access must be protected by Supabase RLS and policies.

GitHub Pages:
- CNAME preserves the custom domain configuration.
