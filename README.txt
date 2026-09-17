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

SHARE THUMBNAIL FIX — IMPORTANT
- Added Supabase Edge Function: supabase/functions/news-share/index.ts
- The function creates server-delivered Open Graph metadata for each written-news share link, including the article's actual main image.
- The browser article page continues to use the existing news.html design and short-key system.

DEPLOY ONCE IN SUPABASE
1. In the Supabase project, create/deploy the function named: news-share
2. Deploy the file: supabase/functions/news-share/index.ts
3. The function uses the existing Supabase Edge Function environment variables (SUPABASE_URL and SUPABASE_ANON_KEY).
4. After deployment, the article's Copy Link button uses:
   https://eomqfssvcpczfazndezs.supabase.co/functions/v1/news-share?n=SHORT_KEY
5. Opening that share URL immediately takes normal visitors to the existing metrocitynews.co.in/news.html article page. Social crawlers receive article-specific OG metadata first.

NOTE ABOUT THE DOMAIN
- This is the robust thumbnail fix without changing the existing GitHub Pages website hosting.
- Until a server-side rewrite/proxy is configured on metrocitynews.co.in, the share URL itself will contain the Supabase function domain. The preview metadata points back to the normal metrocitynews.co.in article URL.
