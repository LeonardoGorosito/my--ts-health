# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

PetHealth aims to be universal: pet owners, veterinarians, and shelters or rescuers.

- **Owners (served today):** people in Argentina with dogs and cats who want the pet's health record on their phone and a QR tag on the collar in case the pet gets lost. Mostly mobile use, often at the vet's office or right after a visit.
- **Veterinarians and shelters (target, not served yet):** there is no vet or shelter role, no sharing between accounts, and no bulk tooling. Design should not exclude them (neutral, trustworthy tone; dense data stays readable), but surfaces must not claim features they don't have.
- **Finder (public page):** a stranger who scans the QR on a found pet. Has no account, is on a phone, and needs to contact the owner in seconds.

## Product Purpose

Keep everything about a pet's health and safety in one place: profile, vaccines, dewormings, medical history, ongoing treatments, weight history, file attachments, reminders, and a public QR "digital tag" with lost mode and a "Se busca" poster. Success means the owner always has the information at hand and a lost pet gets home.

## Positioning

The whole package together, with no single piece dominating: the health record, the QR tag that works even when the account has no active plan, and the reminders. A notes app or paper booklet can't put the pet's needs and the owner's contact in a stranger's hands with one scan.

## Operating Context

- Owners log records after vet visits, check what's due, and follow treatment end dates.
- The finder opens `/public/pet/:id` from the QR, without logging in, often outdoors and under stress.
- Lost mode turns the public page into an alert and produces a printable poster.

## Capabilities and Constraints

- Species: dogs and cats only (`CAT`, `DOG`).
- Plans: 30-day trial with everything included, then Standard (up to 2 pets, no reminders or attachments) or Pro. Without a plan the account is read-only, but the QR page and lost mode keep working. Prices live only in `src/lib/plans.ts`.
- No payment provider yet; the app won't launch publicly until the product is complete.
- Spanish UI (Argentine voseo). Light, dark, and system themes are all required.
- The public page must never show medication or private health data beyond what the owner chose to share.

## Brand Commitments

- Name: PetHealth. Mascot: "Placo", a collar tag with a face (`src/components/brand/Placo.tsx`, with `mood`); `Logo` and `PlacoIcon` in the same folder.
- Brand font: Space Grotesk (`font-brand`).
- Voice: warm, plain Argentine Spanish ("vos"), with no hype. "Hecho en Santa Fe, Argentina."

## Evidence on Hand

- Landing media in `public/img` and `public/video` (hero video, pet photos) and `public/og-image.jpg`.
- No testimonials, user counts, vet partnerships, or press. Do not invent any.

## Product Principles

1. The pet's safety comes first: the public tag works always, fast, on any phone.
2. One place for everything, without making the owner hunt: what's due or ongoing comes first.
3. Honest and calm: no invented proof, no pressure, prices stated plainly.
4. Built for a phone in one hand, at the vet or on the street.

## Accessibility & Inclusion

The finder may be anyone, under stress, on any phone: big tap targets, high contrast, and contact actions that work without reading much.
