# BLUE Governance

This document describes who makes decisions in the BLUE project and
how. It is intentionally lightweight during the early-scaffolding
phase and will evolve as the project grows.

> **Note:** BLUE has two distinct governance layers:
>
> 1. **Repository governance** (this document) — how the codebase,
>    infrastructure, and project direction are managed.
> 2. **Content governance** — the verifier (pre-publish) and
>    moderator (post-publish + disputes) system that governs
>    educational guides on the platform.
>
> The two should remain separate. Repository maintainers do not
> override verifier or moderator decisions on content, and neither
> role gets automatic commit access to the codebase.

---

## Current phase: founder-led

BLUE is in its earliest scaffolding stage. Decision-making currently
rests with the founder and any maintainers they invite.

This is explicit and temporary. Founder-led governance is the right
shape for getting from zero to a usable prototype, and the wrong shape
for a project whose mission depends on resisting capture. The transition
plan below describes how that changes.

## Maintainers

Maintainers have commit access and review authority over the codebase.
The list is kept in [`.github/CODEOWNERS`](.github/CODEOWNERS).

Becoming a maintainer requires:

- A sustained track record of high-quality contributions.
- Demonstrated alignment with the project's non-negotiable principles.
- Nomination by an existing maintainer and consensus of current
  maintainers.

Maintainers may step down at any time. Inactive maintainers (12+
months no activity) may be moved to an emeritus list.

## How decisions are made

- **Routine changes** (bug fixes, refactors, dependency bumps,
  documentation): a single maintainer approval on a PR is enough.
- **Significant changes** (new dependencies, architectural shifts,
  changes to data model or auth, anything user-visible at scale):
  require two maintainer approvals and a public discussion thread
  (GitHub Discussions or issue) open for at least 72 hours.
- **Principle-affecting changes** (anything that touches the
  non-negotiable principles, governance, licensing,
  funding, or the verifier/moderator system design): require a documented
  proposal, public comment period of at least two weeks, and consensus
  of maintainers. The founder retains veto on these during the
  founder-led phase.

We default to **lazy consensus**: if a proposal has been open for the
required period and no maintainer objects, it is accepted. Objections
must be substantive (cite a principle, a risk, or a concrete
alternative); "I just don't like it" is not enough on its own.

## Code of conduct enforcement

Enforcement is handled per [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
Reports go to the address listed there. The current enforcement team
is the founder plus any maintainer specifically designated.

## Funding and finances

BLUE's principles forbid paywalls and non-contextual advertising. Any
funding the project receives — donations, grants, contextual ad
revenue — must be:

- Public: aggregate amounts and sources disclosed at least annually.
- Mission-aligned: rejected if accepting it would create pressure to
  violate any non-negotiable principle.
- Separated from editorial: funders and advertisers have zero
  influence over content, ranking, or verifier/moderator decisions.

A formal nonprofit entity will be established before BLUE accepts
significant external funding or runs production at scale. The entity
will be incorporated in California.