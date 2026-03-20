# ~/.codex/config.toml
# Codex reads TOML key/values. Keep your “rules” inside developer_instructions.

# Controls when Codex pauses for approval before executing commands.
approval_policy = "on-request"

# Optional: suppress verbose reasoning events in the UI.
# hide_agent_reasoning = true

# Global, cross-project guidance for how Codex should work.
# Keep project-specific requirements inside each repo (e.g., ai/project.md, ai/specs/*).
developer_instructions = """
# AI Collaboration Rules

Repo root: /Users/ricardomoreira/Desktop/Art App/art-app

## Proactive Grounding

This applies across all stages. Don't wait to be told—take initiative:

- Explore the codebase to understand existing patterns, conventions, and architecture
- Research how similar things are already done before proposing something new
- Ground every decision in what actually exists in the code
- Surface relevant prior arch, typing patterns, state management approaches
- The more context you gather, the better—it's high leverage even if it takes longer

Every coding agent at every stage should be proactively grounded in the codebase.

---

## The Ask → Plan → Build → Verify Loop

### Ask Stage
- Explore ideas, dig up code, do research
- Align on what to build and why
- Proactively research architectural patterns related to the topic
- No code changes; just understanding and alignment

### Plan Stage
- Once aligned, produce a structured implementation plan
- Start with narrative: What we're trying to accomplish and why (context from our conversation)
- Show code: Preference for showing current code vs. future code when practical
- Granular steps: Break tasks into sub-steps that match the plan's structure
- Small plans: May proceed directly to Build
- Bigger plans: Optional audit loop—a fresh agent reviews the plan before building

### Build Stage
- Execute the plan incrementally
- Pause after meaningful chunks
- Course-correct as needed

### Verify Stage
- After building, think through how to verify it works
- Simple, practical validation of what we built
- Surface any gaps or unexpected behavior

---

## Debugging Methodology

When hunting bugs, think from first principles:

- Provide code evidence (snippets) proving the issue
- Search the codebase for additional context
- Suggest multiple hypotheses for the root cause
- Explain which hypothesis is most likely and why
- If stuck on the same theory without progress, pause, zoom out, and reassess together

---

## Communication Preferences

### Decision Framing
When presenting options:
- Pros and cons of each approach
- Your recommendation with clear reasoning
- Don't just list options—tell me what you'd pick and why

### When Uncertain
- Ask clarifying questions rather than assuming
- Surface ambiguity early

---

## Asset Workflow
- Figma icons must be exported (SVG preferred) and stored in the repo (e.g., public/images/ui/) before referencing in code.
- Use the exported filename/path as the source of truth; Figma layer/frame names are not accessible at build time.

## Technical Standards
- KISS, YAGNI, SOLID
- Match existing codebase patterns
- Small, incremental changes

### Commenting Standards
- Add a 1-2 line summary at the top of each file describing its main purpose
- Add short, clear comments throughout the code so it is easy to find and understand different parts later
- Add a short comment above each major function, class, and section explaining what it does
- Group related parts with high-level section comments like `// === AUTH LOGIC ===` and `// === DATA PROCESSING ===`
- Comment complex or non-obvious logic inside functions, but skip obvious lines like `i++` or `return true`
- Keep comments concise and in plain English

---

## Repo-first context rule
If the repo contains `ai/project.md` and `ai/specs/*.md`, read them first and treat them as the source of truth for product scope and feature requirements.
"""
