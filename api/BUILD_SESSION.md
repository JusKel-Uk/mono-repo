# juskel Build Sessions

Copy-paste the prompt below into Cursor Agent each time you want a guided build session.

---

## Reusable Prompt (copy everything inside the box)

```
@.cursorrules @.cursor/rules/

Start a juskel BUILD SESSION.

Rules:
- Read all cursor rules first (budget constraints, modular monolith, CQRS-Lite, learning workflow).
- I write all code manually — instruct only, one step at a time.
- Tell me which session number we're on (or start Session 1 if this is my first time).
- Give me the exact steps for THIS session only.
- When I say "I'm done", verify my work (run dotnet build, inspect files), score me /10, and preview the next session.

My goal for this session: [describe what you want to build, or leave blank for the next session in sequence]
```

---

## Quick variants

**Continue where I left off:**
```
@.cursorrules @.cursor/rules/ Continue my juskel BUILD SESSION from where we stopped. Give me the next step only.
```

**I'm finished — verify me:**
```
@.cursorrules @.cursor/rules/ I'm done with this build session. Verify my work, score me /10, and tell me what to fix.
```

---

## Session roadmap

| # | Topic | Done? |
|---|-------|-------|
| 1 | Solution + Host + lean `Program.cs` | ☐ |
| 2 | Swashbuckle UI + `GlobalExceptionHandler` + example DTOs | ☐ |
| 3 | `juskel.Shared` project | ☐ |
| 4 | `Identity.Contracts` + `Identity.Core` shell | ☐ |
| 5 | First command slice (CQRS-Lite write) | ☐ |
| 6 | First query slice (CQRS-Lite read) | ☐ |
| 7 | `Dockerfile` for Azure Container Apps | ☐ |
| 8 | EF Core `DbContext` + schema isolation | ☐ |

Tick boxes manually as you complete sessions.
