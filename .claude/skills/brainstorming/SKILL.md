---
name: brainstorming
description: Explore user intent, requirements, constraints, alternatives, and design before implementation. Use when the user asks to brainstorm, shape an idea, design a feature, compare approaches, clarify scope, or plan behavior before code changes.
---

# Brainstorming Ideas Into Designs

## Overview

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask focused questions to refine the idea. Once the direction is clear, present the design in concise sections and confirm important assumptions before implementation.

## Process

### Understand the idea

- Check the current project state first, including relevant files, docs, and recent changes.
- Ask one question at a time when clarification is needed.
- Prefer multiple-choice questions when possible, but use open-ended questions when they fit better.
- Focus on purpose, constraints, success criteria, and what should remain out of scope.

### Explore approaches

- Propose 2-3 different approaches with trade-offs.
- Lead with the recommended option and explain why it fits the constraints.
- Keep alternatives concrete enough that the user can make a decision.

### Present the design

- Present the design once the goal and constraints are clear.
- Break the design into short, readable sections.
- Cover architecture, components, data flow, error handling, and testing when relevant.
- Ask for confirmation when a decision affects scope, UX, data model, or implementation risk.
- Go back and clarify if something does not make sense.

## After the Design

### Documentation

- Only create a design document if the user explicitly asks for one.
- If documenting, use a concise filename such as `docs/plans/YYYY-MM-DD-<topic>-design.md` and follow the repository's documentation conventions.
- Do not commit changes unless the user asks.

### Implementation

- Ask whether the user is ready to proceed with implementation when the design is validated.
- If the user wants implementation, switch to the relevant project workflow and keep changes scoped to the agreed design.

## Principles

- Handle one decision at a time.
- Prefer multiple-choice questions when they reduce friction.
- Remove unnecessary features from the design.
- Compare alternatives before settling on an approach.
- Validate important design choices before moving on.
- Stay flexible and revisit earlier assumptions when new information changes the design.
