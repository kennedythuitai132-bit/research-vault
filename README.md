# Research Vault

**Secure. Organise. Protect. Innovate.**

A Secure Research Data Management System (SRDMS) for universities, research
institutions, government research departments and scientific organisations.

## Layout

- `apps/web`   - Next.js frontend (App Router, TypeScript, Tailwind)
- `apps/api`   - NestJS backend REST API (TypeScript)
- `packages/`  - shared code across apps
- `docs/`      - architecture, security, database, API docs
- `scripts/`   - utility scripts (seeding, migrations, tooling)

## Status

- [x] Phase 0 - Environment, project root, git
- [ ] Phase 1 - Frontend foundation
- [ ] Phase 2 - Backend foundation
- [ ] Phase 3 - Database & RLS
- [ ] Phase 4+ - Feature modules

## Security

Never commit `.env` files, service-role keys, encryption keys or seed credentials.
All sample data in this repository is synthetic.
