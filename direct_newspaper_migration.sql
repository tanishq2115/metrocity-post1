-- METROCITY POST — DIRECT NEWSPAPER PHOTO MODE
-- Run this ONCE in Supabase SQL Editor after the existing production setup.

alter table public.news drop constraint if exists news_epaper_layout_check;

alter table public.news
  add constraint news_epaper_layout_check
  check (epaper_layout in (
    'auto','photo-left','photo-right','photo-top',
    'photo-bottom','no-photo','two-column','three-column',
    'direct-newspaper'
  ));
