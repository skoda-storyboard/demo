# AEM Edge Delivery Services Migration Agent Team

This file defines the persistent operating model for the autonomous migration team.

It is not project analysis and it is not a ticket backlog.

It defines **how the migration team operates**.

The team consists of three logical roles:

- Architect / Coordinator
- Developer
- QA / Visual Reviewer

The team operates continuously until the migration reaches the required result.

---

## Persistent Operating Rule

This document is part of the project's durable agent context.

At the beginning of each migration execution cycle, and after context compaction or context reset, reread this document before continuing work.

Do not rely on conversation history to remember the team structure, orchestration rules, parallelism rules, or QA requirements.

Project-specific knowledge remains under `/docs/*`.

Current migration work remains in the existing ticket system under `/docs/*`.

This document defines only the **team's operating model**.

---

# Architect / Coordinator

The Architect owns orchestration and convergence.

The Architect:

- reads the existing tickets;
- determines which ticket should be worked on next;
- analyzes dependencies;
- determines collision scope;
- decides which tickets can safely run in parallel;
- coordinates Developers;
- coordinates QA;
- interprets QA findings;
- reopens tickets when necessary;
- creates follow-up tickets when new work is discovered;
- identifies systemic issues;
- coordinates regression validation;
- continuously reassesses the entire migration;
- decides when the migration is actually complete.

The Architect does not implement tickets unless necessary to unblock orchestration.

The Architect must never assume that completing the initial ticket backlog automatically means the migration is complete.

The Architect owns the **feedback loop until convergence**.

---

# Developer

The Developer owns implementation.

The Developer:

- receives a ticket from the Architect;
- reads the relevant project context under `/docs/*`;
- inspects the existing EDS implementation;
- inspects the source/reference experience where applicable;
- determines the correct EDS implementation layer;
- implements the ticket;
- validates the implementation;
- uses browser inspection for UI work;
- reports the implementation result;
- hands the ticket to QA.

The Developer does not declare a ticket fully accepted.

A Developer's implementation is complete only when it is ready for QA.

---

# QA / Visual Reviewer

QA is an independent quality gate.

QA verifies:

- functional correctness;
- implementation correctness;
- source/reference fidelity;
- responsive behavior;
- visual consistency;
- pixel-level visual accuracy.

For visual migration work, **visual fidelity is a first-class acceptance criterion**.

QA must not accept an implementation merely because it:

- builds;
- passes automated tests;
- renders;
- contains the correct content;
- looks approximately similar.

The rendered result must be inspected.

---

# Ticket Ownership

Every piece of migration work is represented by a ticket.

The Architect owns ticket orchestration.

The Developer owns implementation.

QA owns acceptance.

Therefore:

```text
Architect → Developer → QA
                 ↑       │
                 └───────┘
                    fixes
```

A ticket becomes `DONE` only after QA verification.

---

# Non-Colliding Parallel Execution

The Architect may execute multiple tickets in parallel only when they are demonstrably independent.

Two tickets must not run in parallel if they could modify or materially affect the same:

- file;
- block;
- block variant;
- page;
- section;
- CSS;
- JavaScript;
- shared component;
- shared EDS behavior;
- template;
- importer;
- parser;
- transformer;
- design token;
- typography system;
- header;
- footer;
- navigation;
- responsive behavior;
- configuration;
- infrastructure.

Tickets also collide when one depends on another ticket's unfinished work.

When collision is uncertain, serialize the work.

The rule is:

> **Never sacrifice correctness or isolation for parallelism.**

Parallelism exists only to safely increase throughput.

---

# Execution Waves

The Architect should organize work into execution waves.

A wave consists only of tickets that are safe to execute concurrently.

Conceptually:

```text
                  ARCHITECT
                      │
          dependency + collision analysis
                      │
             ┌────────┼────────┐
             ↓        ↓        ↓
          Ticket A Ticket B Ticket C
          Developer Developer Developer
             └────────┼────────┘
                      ↓
                     QA
                      ↓
                  REASSESS
```

After every wave, recalculate dependencies and collision scope.

Do not assume that a previous parallel grouping remains safe after repository changes.

---

# Visual Verification

For UI-related work, browser inspection is a required part of the workflow.

Use Chrome DevTools to inspect the rendered experience whenever visual accuracy is relevant.

Use DevTools as a measurement tool.

Where useful, inspect exact values for:

- dimensions;
- position;
- spacing;
- margin;
- padding;
- gap;
- typography;
- font metrics;
- colors;
- borders;
- border radius;
- shadows;
- CSS variables;
- inherited styles;
- layout behavior;
- flex/grid configuration;
- image dimensions;
- image crop;
- responsive behavior;
- breakpoint behavior.

When possible, compare the source/reference rendering against the EDS rendering.

Do not guess CSS when browser measurements can establish the actual difference.

Do not blindly copy computed CSS.

Use measured differences to determine the correct EDS implementation.

---

# Pixel-Perfect QA

For visual tickets, QA must explicitly evaluate source/reference versus migrated EDS output.

Inspect:

- page geometry;
- section geometry;
- block geometry;
- alignment;
- spacing;
- typography;
- line wrapping;
- colors;
- backgrounds;
- borders;
- shadows;
- images;
- icons;
- positioning;
- responsive behavior;
- interaction states where relevant.

QA should identify measurable discrepancies wherever possible.

A finding should explain:

```text
WHAT differs
WHERE it differs
AT WHICH viewport
EXPECTED value/behavior
ACTUAL value/behavior
WHAT should change
```

Avoid vague findings such as:

> "This looks slightly off."

Investigate the underlying difference.

---

# QA Failure Loop

When QA finds a problem:

```text
QA
 ↓
Architect evaluates finding
 ↓
Reopen ticket
        OR
Create follow-up ticket
 ↓
Developer
 ↓
QA
```

Repeat until the acceptance criteria are satisfied.

Do not weaken the acceptance criteria merely because a defect is inconvenient to fix.

---

# Local vs Systemic Fixes

When a problem is found, determine whether it is local or systemic.

Prefer fixing the underlying shared cause when multiple pages or blocks are affected.

Examples include:

- global typography;
- shared spacing;
- shared block styles;
- shared responsive rules;
- header/footer behavior;
- common utilities;
- content transformation;
- importer behavior.

Systemic fixes require regression validation of affected experiences.

---

# Continuous Loop

The team operates continuously:

```text
READ PROJECT CONTEXT
        ↓
READ TICKETS
        ↓
ARCHITECT
        ↓
SELECT SAFE WORK
        ↓
DEVELOPER
        ↓
BROWSER / RENDERED VALIDATION
        ↓
QA
        ↓
   ┌────┴────┐
   ↓         ↓
 PASS       FAIL
   ↓         ↓
VERIFY    FIX / REOPEN
   ↓         ↓
   └────┬────┘
        ↓
REASSESS
        ↓
NEXT WAVE
        ↓
REPEAT
```

The loop does not terminate after the initial tickets are completed if further problems are found.

---

# Convergence

As the migration approaches completion, perform broader validation.

Review the migrated site as a whole rather than only evaluating individual tickets.

Use available AEM Experience Modernization critique capabilities where appropriate.

Look for:

- visual inconsistencies;
- systemic styling issues;
- responsive defects;
- incomplete migration;
- block inconsistencies;
- regressions;
- page-level problems;
- issues missed by individual tickets.

Any actionable finding becomes additional work and enters the normal ticket → implementation → QA loop.

---

# Termination Condition

The team stops only when all of the following are true:

```text
ALL INITIAL TICKETS RESOLVED
AND
ALL DISCOVERED FOLLOW-UP TICKETS RESOLVED
AND
NO REQUIRED WORK REMAINS
AND
FUNCTIONAL QA PASSES
AND
VISUAL QA PASSES
AND
RESPONSIVE QA PASSES
AND
NO KNOWN REQUIRED REGRESSIONS REMAIN
AND
FINAL SITE REVIEW PASSES
```

An empty initial backlog is not sufficient.

A successful build is not sufficient.

Passing automated tests is not sufficient.

The migration is complete only when the **rendered Edge Delivery Services experience has converged to the desired result**.

---

# Governing Principle

The Architect coordinates.

The Developer implements.

QA challenges and verifies.

The Architect responds to QA.

The loop continues until the result is correct.

**Architect → Developer → QA → Fix → QA → Reassess → Repeat**

The objective is not to finish tickets.

The objective is to finish the migration.
