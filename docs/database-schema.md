# Database Schema

This doc serves as the file for laying out the database schema for this site. This is still a work in progress and is subject to change.

## Purpose

BLUE stores one global graph of canonical guides. A guide is both a readable content object and a node in the learning graph. The graph is used to derive subject views, frontiers, walkthroughs, levels, and reachability.

The schema deliberately keeps the database source of truth small:

- Store guides and their guide-to-guide relationships.
- Store subjects as tags on guides, not as separate trees.
- Store methods and alternatives under their parent guide.
- Store version history for guides, methods, and alternatives.
- Store governance records (votes, review cases, panels, decisions) as ground truth.
- Do not store values that can be derived from the graph.

### `profiles`

- `id`: primary key, references the auth user.
- `username`: unique URL handle.
- `created_at`: row creation time.
- `updated_at`: last update time, maintained by a trigger.
- `display_name`: optional human-facing name, separate from the unique `username` handle.
- `bio`: optional short profile text.
- `role`: governance role. Role enum `learner | maintainer | admin`.
- `is_suspended`: optional flag for moderation actions against a member, kept separate from `role` so a role is not silently lost.

See [Roles and Permissions](#roles-and-permissions) for what each role can do. 

### `guides`

- `id`: primary key of the guide; the node identity in the graph.
- `current_revision_id`: primary key of the guide; the node identity in the graph.
- `slug`: stable URL identifier.
- `title`: human-readable guide title.
- `summary`: short description for lists and previews.
- `status`: draft lifecycle state (see enum below).
- `author_id`: original author profile.
- `created_at`: row creation time.
- `updated_at`: last update time.
- `forked_from_guide_id`: nullable self-reference. When a cross-subject conflict resolves into a **spin-off** (see `overall-system.md`), the guide forks into a subject-specific version. This makes the spin-off an explicit, governed exception to "one canonical guide per topic" instead of looking like an accidental duplicate. In practice, there will be a message/indicator in the guide itself saying something like "forked from {original-guide-title}".

Status enum values are:

- `draft`
- `in_review`
- `published`
- `archived`
- `rejected`

### `guide_revisions`

So, guide revisions can basically be implemented in two ways: via whole guide snapshots (faster but take up slightly more storage, which may or may not be a problem because markdown/text is so tiny anyway; note: images will not be duplicated between revisions) or deltas/diffs (take up less storage but are slower and more complex). See [Snapshots vs. Deltas](#snapshots-vs-deltas) for a comparison between the two methods. 

The main use cases for `guide_revisions` are for users to be able to see the history of specific guides, how they were changed, and if needed, to roll back to a previous version of the guide easily. Git itself stores snapshots internally for its version history system.

For BLUE's use case, it seems that snapshots are most likely the better option out of the two methods because they greatly simplify implementation while providing immediate support for rollback, auditing, and attribution. Guides are primarily text-based, which means storage requirements remain relatively small even with many revisions, especially compared to media assets such as images and videos. With snapshots, any revision can be viewed, restored, compared, or synchronized independently without reconstructing it from a long chain of changes. This makes moderation workflows, dispute resolution, and historical review much easier since moderators can inspect exactly what a guide looked like at any point in time. While delta-based storage can reduce storage usage, it introduces complexity around reconstruction, rollback, and maintenance. 

Later on, as BLUE grows to contain a massive amount of guides, `guide_revisions`'s snapshot system can be optimized for storage through compression (Postgres automatically TOAST-compresses large text, but further optimizations can be made), deduplication (e.g. multiple guides using the same assets), content hashing (generates a unique fingerprint of a revision’s content so identical or duplicate content can be detected and stored only once), and a snapshot + delta hybrid (snapshots as checkpoints with deltas in between each checkpoint).

Immutable, append-only version history for guide content. Every edit inserts a new row; rows are never updated or deleted. This is what powers the history view, the change log, diffs between versions, and rollback.

- `id`: primary key of the revision row.
- `guide_id`: which guide this revision belongs to (many revisions to one guide).
- `revision_number`: per-guide counter (1, 2, 3, ...), unique with `guide_id`.
- `change_summary`: author's note describing what changed in this revision (like a commit message). Drives the "what changed" entry in the history list.
- `body`: the full guide content (markdown) as of this revision. Media is referenced by URL, not embedded, so large assets live in object storage rather than in the row.
- `author_id`: who wrote this specific revision. May differ from `guides.author_id` (the original author), which is how edit credit spreads across contributors.
- `created_at`: when this revision was written.
- `status`: draft lifecycle state (see enum below).

Status enum values are:

- `draft`
- `in_review`
- `published`
- `archived` 
- `rejected`

**Rollback.** Rollback never deletes newer rows. It inserts a new revision that copies an older one's content. Through this, the version history shows that a rollback occurred through the change_summary.

### `guide_edges`

Relationships between guides. This table *is* the global graph.

- `id`: primary key of the edge row.
- `from_guide_id`: the source guide of the edge.
- `to_guide_id`: the target guide of the edge.
- `edge_type`: what kind of relationship this edge represents (see allowed types below).

For prerequisite edges, direction means:

```text
from_guide_id -> to_guide_id
```

Example:

```text
Arithmetic -> Algebra
edge_type = prerequisite
```

That means Arithmetic must be understood before Algebra.

Allowed edge types right now are:

- `prerequisite`
- `related`

Only `prerequisite` edges form the learning DAG. Walkthrough generation, level computation, frontier detection, and reachability checks must ignore other edge types. 

There must be a trigger that prevents cycles among prerequisite edges. Related edges may be cyclic because they do not define learning order. Related edges are used for "related" or "see also" links, discovery/navigation, and contextual suggestions.

### `subjects`

Subject tags, such as Math, Physics, or Game Development. Subjects are not containers and do not own guides. They are filters over the global guide graph.

- `id`: primary key of the subject.
- `slug`: stable URL identifier for the subject (e.g. `game-development`).
- `name`: human-readable subject name (e.g. `Game Development`).

### `guide_subjects`

Many-to-many join table between guides and subjects. Lets one canonical guide appear in multiple subject views without duplicating content.

- `guide_id`: the tagged guide.
- `subject_id`: the subject tag applied to it. The pair `(guide_id, subject_id)` is the primary key, so a guide cannot carry the same tag twice.

Example:

```text
Guide: Vectors
Subjects: Math, Physics, Game Development
```

### `todo_prerequisites`

Missing prerequisite topics declared by authors when a real guide does not exist yet. Also acts as a recruitment surface for guides that still need writing.

- `id`: primary key of the TODO entry.
- `dependent_id`: the dependent guide that declares the need.
- `title`: the named missing prerequisite topic (free text, no guide exists yet).
- `status`: `open` while unfilled, `resolved` once a real guide is created for the topic.
- `resolved_guide_id`: the guide that fulfilled this TODO, set when `status` becomes `resolved`; null while open.
- `created_at`: when the TODO was declared.

Example:

```text
Dependent guide: Newton's laws
TODO prerequisite: Vectors
status = open
```

Because walkthrough and level generation use the **longest** path, redundant transitive edges are harmless to level correctness. Authors typically declare every prerequisite a guide needs, not just the ones one level below, which produces shortcut edges (e.g. `Algebra -> Calculus`) alongside the real chain (`Algebra -> Functions -> Limits -> Calculus`). The longest path dominates, so the guide still lands at its correct deep level; the shortcut cannot pull it up.

What over-declaration does cost is **graph bloat**: redundant edges clutter the DAG, walkthroughs, and diffs. A later **transitive reduction** pass can drop any edge `A -> C` when a longer path `A -> ... -> C` already exists. This is a tidiness optimization, not a correctness requirement, since levels stay correct without it. 

### `guide_variants`

Methods and alternatives attached to a canonical parent guide. Each variant is its own page with its own URL and revision history.

- `id`: primary key of the variant.
- `parent_guide_id`: the canonical guide this variant lives under.
- `variant_type`: `method` (a competing practice route to the same outcome) or `alternative` (a competing theoretical framing of the same topic).
- `slug`: stable URL identifier for the variant.
- `status`: lifecycle state, same enum as `guides.status`.
- `author_id`: the variant's original author.
- `created_at`: row creation time.
- `updated_at`: last update time.

Ordering among sibling variants under the same parent is **derived** from net votes, not stored here.

### `guide_variant_revisions`

Immutable, append-only version history for methods and alternatives. Mirrors `guide_revisions` so variants can cleanly evolve, diff, and roll back independently of the canonical guide.

- `id`: primary key of the revision row.
- `variant_id`: which variant this revision belongs to.
- `revision_number`: per-variant counter, unique with `variant_id`.
- `body`: the full variant content (markdown) as of this revision.
- `change_summary`: author's note describing what changed.
- `author_id`: who wrote this specific revision.
- `created_at`: when this revision was written.
- `status`: draft lifecycle state (see enum below).

Status enum values are:

- `draft`
- `in_review`
- `published`
- `archived`

### `votes`

Upvotes and downvotes on guides, methods, and alternatives.

Key fields:

- `id`: primary key of the vote.
- `voter_id`: the user who cast the vote.
- `target_type`: what is being voted on, `guide` or `variant`. Combined with `target_id` this is a polymorphic pointer (no single foreign key).
- `target_id`: the id of the guide or variant being voted on.
- `direction`: `up` or `down`.
- `reason`: required only on downvotes. Enum mirroring the canonical downvote rubric exactly: `unclear`, `factually_wrong`, `missing_step`, `outdated`, `broken_link`, `prereq_gap`, `wrong_level`, `scope_creep` (covers material outside topic). 
- `note`: optional free-form text.
- `created_at`: when the vote was cast.

Constraints:

- One vote per voter per target (`unique (voter_id, target_type, target_id)`).
- A check that `reason` is present if and only if `direction = 'down'`.

Display rules: public users see upvote/downvote totals only. The rubric breakdown is visible to maintainers only, enforced by row level security. Variant ordering among siblings is **derived** from net votes, not stored as a rank column.

### `review_cases`, `review_panels`, and `review_decisions`

Verifier gates, post-publish re-reviews, disputes, and appeals all share the same shape: an odd-numbered random panel, a majority outcome, and an independent written justification per member. They share one root object (`review_cases`) plus one panel table and one decision table. Type-specific fields hang off the root in **specialized tables** (`guide_review_cases`, `re_review_cases`, `disputes`, `appeals`), each keyed 1:1 on `case_id`. The root carries what every workflow has in common (lifecycle, who opened it, timestamps); the satellite carries only what that one case type needs.

`review_cases`:

The item being reviewed.

- `id`: primary key of the case.
- `case_type`: what work the case represents: `guide_publish` | `guide_edit` | `variant_publish` | `dispute` | `appeal` | `re_review`.
- `status`: lifecycle state: `pending` | `in_review` | `approved` | `rejected`.
- `created_by`: the user who opened the case (author for publish/edit/appeal, filer for dispute).
- `created_at`: when the case was created.
- `updated_at`: when the case status was updated. Updated via a trigger.
- `time_limit`: the maximum time a panel member can take to cast a vote on a case. When the voting window closes with voting spots still empty, the non-voting members are dropped and replaced by other randomly drawn maintainers who will be assigned the same time limit.

`review_panels`:

An odd-numbered random group of maintainers assembled to decide a case.

- `id`: primary key of the panel.
- `case_id`: the case this panel decides (FK to `review_cases`). One case may have many panels.
- `outcome`: the panel's majority decision: `approved` | `rejected`. Null until the panel closes. Both `review_cases` and `review_panels` require a status/outcome column because a review case can have multiple panels in its lifetime.
- `opened_at`: when the panel was assembled.
- `closed_at`: when the panel reached its outcome; null while open.

`panel_members`:

Maintainers seated on a panel. One row per maintainer per panel. Tracks each seat's lifecycle so the time-limit/replacement flow (see `review_cases.time_limit`) is ground truth, not inferred from whether a decision exists.

- `id`: primary key of the seat.
- `panel_id`: the panel this seat belongs to (FK to `review_panels`).
- `member_id`: the maintainer holding the seat (FK to `profiles.id`). 
- `status`: seat lifecycle state (see enum below).
- `assigned_at`: when the maintainer was drawn onto the panel. The time limit counts from here.

Status enum values are:

- `assigned` — seated, vote pending.
- `recused` — stepped down for conflict of interest (see conduct rules in `overall-system.md`).
- `replaced` — dropped and swapped for a new maintainer.
- `completed` — cast a decision.

A `replaced` seat does not delete the row; a new `panel_members` row is drawn for the replacement, so the full seat history of a panel stays auditable.

`review_decisions`:

One panel member's individual vote with its written justification.

- `id`: primary key of the decision.
- `panel_member_id`: the panel seat that cast it (FK to `panel_members`). One decision per seat — a `completed` seat has exactly one decision row. Carries both the panel and the maintainer through the seat, so no separate `panel_id`/`member_id` pair is stored here.
- `decision`: that member's individual choice: `approve` | `reject`.
- `notes`: written justification for the decision.
- `created_at`: when the decision was cast.

`review_decision_reasons`:

Links a decision to one or more rubric reasons → a reviewer can cite several at once (e.g. `hierarchy_issue` **and** `missing_required_information`). 

- `decision_id`: FK to `review_decisions.id`.
- `reason`: the rubric item cited by the reviewer: `hierarchy_issue` | `factual_error` | `duplicate_content` | `scope_violation` | `clarity_issue` | `missing_required_information`.

A `reject` decision must have at least one row here; an `approve` has none. 

#### Specialized case tables

Each attaches type-specific data to a `review_cases` row. `case_id` is both primary key and FK to `review_cases` → one satellite row per case.

`guide_review_cases` (for `guide_publish`, `guide_edit`, `variant_publish`):

- `case_id`: PK and FK to `review_cases`.
- `guide_revision_id`: nullable FK to `guide_revisions`. Set for `guide_publish` / `guide_edit` — the exact guide revision under review.
- `variant_revision_id`: nullable FK to `guide_variant_revisions`. Set for `variant_publish` — variant content lives in its own revision table, so it cannot reuse `guide_revision_id`.

Either way, the case pins the panel to the exact snapshot it judged, so the decision stays attached to specific content after later edits. Check constraint: exactly one of `guide_revision_id` / `variant_revision_id` is set.

`re_review_cases`:

- `case_id`: PK and FK to `review_cases`.
- `guide_id`: the live published guide pulled back for re-review (FK to `guides`). Points at the guide, not a revision, because the trigger is about the live page's accumulated votes.
- `trigger_type`: which post-publish path fired it: `ratio` | `rubric_weighted` | `section_density` (see `overall-system.md` re-review triggers).

`disputes`:

- `case_id`: PK and FK to `review_cases`.
- `dispute_type`: `factual` |`maintainer_misconduct` | `governance` | `cross_subject`.
- `target_type`: what the dispute is against, paired with `target_id` (polymorphic, no single FK). Allowed values depend on `dispute_type` (see table below).
- `target_id`: the id of that target.
- `claim_text`: the filer's written claim and evidence summary.

What each `dispute_type` points at:


| `dispute_type`          | `target_type` | Meaning                                                                            |
| ----------------------- | ------------- | ---------------------------------------------------------------------------------- |
| `factual`               | `guide`       | A claim in the content is wrong.                                                   |
| `cross_subject`         | `guide`       | Two subject communities conflict over one guide (may spin off).                    |
| `maintainer_misconduct` | `profile`     | A verifier/maintainer acted in bad faith, so it points at the user.                |
| `governance`            | nullable      | A policy/process objection with no single content target; `target_id` may be null. |


A `cross_subject` dispute may resolve into a spin-off, recorded via `guides.forked_from_guide_id`.

`appeals`:

Contests the outcome of a prior `review_case`.

- `case_id`: PK and FK to `review_cases`.
- `appealed_case_id`: the prior case whose outcome is being challenged (FK to `review_cases`). An appeal targets a *resolved case*, not content.
- `appeal_reason`: the filer's written argument for why the ruling was wrong. The filer may be the original author contesting a ruling on their own work, or any standing-gated member challenging a moderation/re-review outcome.

---

## Snapshots vs. Deltas

`guide_revisions` and `guide_variant_revisions` store a **full snapshot** of the content per revision. The intended uses are view history, see what changed, and roll back to a previous version, which all work directly off snapshots:

- **History view**: list revisions by `revision_number` with `change_summary`, author, and date.
- **What changed**: compute a diff between two snapshots at display time (the diff is rendered, not stored).
- **Rollback**: move the accepted-revision pointer back, or insert a new revision copying an older snapshot. Never destructive.

If deltas were stored instead, a delta model would store only the change/patch from the previous revision instead of the whole `body`. In practice, suppose someone wants to view revision 50 of a guide. In a delta-based model, revision 1 would store the original content, such as “The cat sat.” Each subsequent revision would then store only the change from the previous version (e.g. revision 2 might be “+ ‘ on the mat’,” and revision 3 might represent a transformation like replacing “cat” with “dog,” and so on). This means revision 50 would effectively be represented as revision 1 plus a chain of deltas from revision 2 through revision 50. To reconstruct revision 50, the system would need to start from revision 1 and sequentially apply each delta in order until reaching the desired state, resulting in a reconstruction cost that grows linearly with the number of revisions or O(n).

**Comparison table:**


| Aspect                        | Full snapshots (current)                                                      | Deltas                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Storage                       | Larger; each revision repeats unchanged text (mitigated by TOAST compression) | Smaller; only changes stored                                             |
| Read a given version          | O(1): read one row                                                            | O(n): reconstruct all patches from a base, or store periodic checkpoints |
| Diff between versions         | Diff two snapshots directly                                                   | Already have one step; arbitrary version pairs still need reconstruction |
| Rollback                      | Trivial: point at / copy an old snapshot                                      | Must reconstruct the target version first                                |
| "Live = latest revision" rule | Simple                                                                        | Breaks; current content must be rebuilt from the chain                   |
| Complexity / bug surface      | Low                                                                           | Higher (patch apply, corruption risk if one delta is bad)                |


Because the use case is read-heavy (history, diff, rollback) and guide bodies are small markdown with media kept in object storage, **full snapshots are most likely the right option**. 

## Derived Data

These are computed from prerequisite edges and optional subject filters.

### Levels

A level is computed inside a walkthrough. The level of a guide is its longest prerequisite path from a primitive within that walkthrough.

The same guide can have different levels in different walkthroughs, so storing a global level would be wrong.

### Frontiers

A frontier is a guide with no dependents inside a subject-filtered graph.

The same guide can be a frontier in one subject and a prerequisite in another, so frontier status is derived per subject view.

### Reachability

Reachability is computed by checking whether every transitive prerequisite exists and whether TODO prerequisites remain unresolved.

Storing `reachable` would risk drift whenever an edge, guide, or TODO prerequisite changes.

### Walkthroughs

Most walkthroughs should be generated on demand by picking a target guide and computing its transitive prerequisite DAG.

Saved or user-curated walkthroughs are intentionally left for a later migration because their sharing, attribution, and dispute model is still open in `docs/open-questions.md`.

## Row Level Security

All new tables have row level security enabled.

The first-pass policy is intentionally conservative:

- Public users can read `provisional` and `published` guide graph content.
- Authors can read and edit their own drafts.
- Authenticated users can create draft guides.
- Authenticated users can create draft methods or alternatives under public/provisional guides.
- Guide authors can attach draft prerequisites, subject tags, and TODO prerequisites to their own draft guides.
- Subject prerequisite floors are publicly readable, but writes are left to service-role/governance code for now.

## Roles and Permissions

The roles are cumulative: every user is a `learner`, and `maintainer`/`admin` add permissions on top rather than replacing them. 

### `learner` (default, every user)

Responsible for consuming and contributing content and expressing preference through votes (and potentially comments in the future).

- Read published guides, variants, subject views, and walkthroughs.
- Author new guides, and methods/alternatives under existing guides (enters the maintainer queue).
- Modify own drafts and submit diff-style edits to canonical guides.
- Declare prerequisites and TODO prerequisites on own drafts.
- Upvote (single click) any guide or variant.
- Downvote, which requires a rubric reason and an optional section pointer.
- File disputes, standing-gated to prevent spam.
- Save walkthroughs (later migration).

Cannot publish content, see the per-row vote-rubric breakdown, or sit on panels.

### `maintainer` — pre-publish gate and post-publish review

Combines the verifier and moderator responsibilities from `overall-system.md` into one role: structural review before publish, and continuous vote-based review, re-review, and dispute resolution after publish. Maintainers are not required to be subject experts; the role is about applying consistent rubric-bound structural standards.

Pre-publish:

- Read the review queue (submissions in `in_review`).
- Sit on odd-numbered random review panels and cast an outcome: publish provisional or return to author.
- Write a rubric-citing justification per decision, recorded on the public audit log.

Post-publish:

- See the full vote-rubric breakdown at whole-guide and per-section granularity (learners see totals only).
- Sit on re-review panels when a guide trips a trigger (ratio, rubric-weighted, or section-density path).
- Apply re-review outcomes: edit, demote to author, route to dispute, or dismiss as brigade.
- Sit on dispute and appeal panels drawn from the maintainer pool.

Bounded by the conduct rules in `overall-system.md`: rejections must cite a named rubric item; style, ideology, author identity, and personal factual disagreement are out of scope; maintainers do not pick winners among methods/alternatives (votes do). Panels are odd-numbered, conflict-of-interest excluded, and require written justifications. A maintainer must not sit on a panel reviewing a decision they previously made on the same target — enforced at panel-draw time using the audit log, not by the role itself. Overturned decisions degrade standing.

### `admin` — operational

Not part of the `overall-system.md` governance spec; an operational role for running the platform.

- Grant and revoke the `maintainer` role (until automated credentialing exists).
- Manage `subjects` (create tags, set prerequisite floors).
- Suspend members (`is_suspended`).
- Service-role and infrastructure configuration, including governance-threshold tuning.

