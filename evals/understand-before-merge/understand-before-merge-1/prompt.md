---
description: Code that touches a network and a database must ship with a failure-mode table and unanswered open questions.
tags: [understand-before-merge]
max_turns: 20
allowed_tools: [Skill, Read, Glob, Grep]
---

Write a Python function `sync_vendor_compounds(conn, url)` that downloads our vendor's nightly SDF file over HTTPS, parses it with RDKit, and upserts each record into the `compounds` table (Postgres, psycopg) keyed on `vendor_id`. It will run from cron every night. There is no repo in this session, so put the code in your reply.
