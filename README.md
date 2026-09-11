# Pablo Sebastian Software Engineering Portfolio

Recruiter-focused portfolio for Pablo Sebastian Uriarte Betancourt, a junior full-stack software engineer building web products and operational automation.

[Open portfolio](https://pablo-sebastian-portafolio.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/pablo-sebastian-uriarte-betancourt-234abb333) · [GitHub profile](https://github.com/AqueosHeart)

## What this portfolio proves

- Public, isolated demos instead of localhost placeholders.
- Bilingual English and Spanish presentation.
- Downloadable English and Spanish CVs.
- Project claims backed by live demos, source repositories, and real UI captures.

## Featured projects

| Project | Evidence | Stack |
| --- | --- | --- |
| [AARC ERP](https://github.com/AqueosHeart/aarc-erp-demo) | [Live demo](https://aarc-erp-demo.vercel.app/) of a read-only ERP with fictional data, employee workflows, credentials, vacations, catalogs, exports, and role-based access. | Next.js, Drizzle ORM, MySQL, Better Auth, TanStack Table |
| [LimitLoot](https://github.com/AqueosHeart/limitloot-demo) | [Live demo](https://shop-umber-theta.vercel.app/) of a safe e-commerce flow with 12 products, persistent cart, simulated checkout, and 44 automated tests. | Next.js, React, TypeScript, Prisma, PostgreSQL, Vitest |

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run build
```

## Telegram job scout

The repository includes a private, human-approved job discovery pipeline for junior software-engineering roles. It searches configured public ATS boards, scores matches against the candidate profile, sends strong opportunities to Telegram, and records Accept or Reject decisions without submitting applications.

See [scripts/job-agent/README.md](scripts/job-agent/README.md) for setup and commands.

## Demo safety

The public demos are intentionally isolated from production. They use fictional data and simulated actions where needed; no public portfolio flow should create real orders, payments, emails, or fulfillment requests.
