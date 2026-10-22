# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, Tailwind v4. Before writing Next-specific code, check `node_modules/next/dist/docs/`. APIs differ from older versions; for example, `RouteContext<"/api/...">` and `LayoutProps<"/">` are global generated types, and `connection()` opts a route out of prerendering.

## Commands

```bash
npm install
cp .env.example .env.local   # then set TMAIL_API_KEY (also TMAIL_BASE_URL, TMAIL_DOMAIN)
npm run dev                  # http://localhost:3000
npm run build                # also the type check
npm run lint                 # eslint (flat config, eslint-config-next)
```

There is no test suite. Deployment is Vercel: every push to `main` deploys, and functions are pinned to `sin1` in `vercel.json` to stay close to the TMail server in Bangkok.

## What the app is

A single-page app where a customer enters an existing email address on a TMail-hosted domain, then reads mail from the services in `SERVICES` (`src/lib/services.ts`) and reads each mail as the service sent it. The app does not extract verification codes or links; the customer reads them in the email body. The customer bought the service account outright, so they see every supported mail, password resets included. The inbox is read-only: no route deletes or sends mail, and none should. The app never creates, randomizes, or offers a choice of addresses or domains, in the UI or in the API. `client.ts` has `createEmail`, but no route calls it, and none should. The README (in Thai) is the authoritative product and deploy doc. `GLOSSARY.md` defines the domain terms (Seller, Customer, Service account, Inbox, and others); use them.

## Architecture

**Server-to-TMail layer (`src/lib/tmail/`, all `import "server-only"`)**
- `config.ts` is the only place that reads env vars. It caches the config and throws `TMailError("CONFIG")` when a value is missing or invalid.
- `client.ts` `request()` is the only place that builds TMail URLs. Every upstream endpoint has the shape `{baseUrl}/api/{...segments}/{apiKey}`, so the API key sits in the URL path and logs mask it as `/***`. Responses are parsed and checked in `validate.ts` before use.
- `inbox.ts` holds the business rules that every request must go through: (1) the domain must be in TMail's domain list (cached for 10 minutes per instance; failures aren't cached); (2) only messages whose sender matches `SERVICES` ever leave the server. Route handlers call `inbox.ts`, never `client.ts` directly.
- `errors.ts` / `http.ts`: everything throws a `TMailError` with a code, and `errorResponse()` maps that code to an HTTP status plus a safe browser-facing message. Upstream details stay in the server log, and auth/config failures appear to the browser as generic 500s.

**API routes (`src/app/api/`)**: `GET /api/domains`, `GET /api/messages?email=`. Pattern: read request params *outside* the try/catch (Next signals "skip prerendering" by throwing), then `try { … } catch (err) { return errorResponse(err) }`. Each route sets `maxDuration` to cover its upstream calls.

**Browser side**
- `src/lib/api.ts` wraps fetches to our own `/api/*` routes and turns error bodies into `ApiError`. `errorText(err, t)` maps codes to strings in `t.errors` for the current language. The server's own error messages never reach the screen.
- Routing has no Next router. The open inbox lives in `?email=` and is read through `useSyncExternalStore` in `src/lib/route.ts`, so `pushState` plus a custom `tmail:navigate` event switches between Landing and Inbox in `components/app.tsx`. Landing hands already-fetched messages to the inbox so it opens already populated. `goToInbox`/`goToLanding` keep `?lang=`.
- `src/hooks/use-inbox.ts` owns the inbox state: it polls every 10s (30s after a 429), tracks new and fresh mail, and keeps read/unread state in localStorage via `lib/storage.ts`. The component is keyed by email, so switching inboxes resets the state.
- `components/email-frame.tsx` renders email bodies in a sandboxed `srcdoc` iframe that has its own CSP. This is why the site CSP in `next.config.ts` deliberately leaves script, style, and img sources open.
- Language (Thai/English) follows the same pattern as routing. `src/lib/lang.ts` reads `?lang=`, then the customer's saved choice, then falls back to Thai. It ignores the browser language on purpose: the server renders Thai, and switching languages after hydration flashes the page and costs PageSpeed points (PageSpeed runs an English browser). `useCopy()` returns the strings for that language, and `setLang()` (behind the `TH | EN` header switch) saves the choice and writes it into the URL. The server always renders Thai, including `<html lang>` and the metadata in `layout.tsx` (LINE link previews show it). `app.tsx` updates `<html lang>` on the client.
- `src/lib/services.ts` `detectService()` matches a sender to a service. Both the server and the browser use `services.ts`.

## Conventions

- All user-facing UI text lives in `src/lib/copy.ts` as `th` and `en` objects. `en` is typed as `Copy` (the shape of `th`), so a string missing from either language fails the build. Components read strings with `const t = useCopy()`, never by importing a language object. Date and time helpers in `lib/format.ts` take `t.locale`; Thai dates use the Buddhist year. Keep UI strings short and direct, with no em dashes. The README and the local notes are in Thai.
- The look is minimal: warm white (or near-black in dark mode) flat surfaces, 1px borders, 16px card radius, and one orange accent (`--accent`) kept for primary buttons, unread marks, and the selected row. There are no illustrations or decorative animations. Empty and error states use `StateIcon` (a lucide icon in a tinted circle) from `components/inbox.tsx`, and small section labels use the `.eyebrow` class. `--accent` is `#c2410c` in light mode because a brighter orange fails 4.5:1 contrast with white button text; check contrast before changing it.
- Colors are CSS variables in `src/app/globals.css`, with dark mode following the system setting. Use the tokens (`bg-surface`, `text-muted`, `border-line`, and so on), not raw hex values.
- To add a service, add an entry to `SERVICES` in `src/lib/services.ts` and add its brand color in `components/ui/service-logo.tsx`. Write the full name on the logo, not an abbreviation. The README intro lists the services by hand, so update it too. The page's meta description reads from `SERVICES`.
- Use `cx()` from `lib/cx.ts` for class names. Use the path alias `@/*` for `src/*`.
- `docs.md` is gitignored local notes on the upstream TMail API. It contains a real key, so never copy its contents into tracked files.

## Upstream quirks

- TMail rate-limits to 60 requests/min per IP. Vercel egress IPs are shared and change, so the limit has to be raised on the TMail side rather than allowlisted by IP.
- TMail errors come back either as Laravel `{"message": ...}` or as a bare JSON string, and `extractApiMessage()` handles both. The API reports no mailbox expiry time.
