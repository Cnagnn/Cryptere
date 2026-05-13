# Skills Index

Daftar lengkap semua skills untuk quick reference dan IDE integration.

## 🎯 Skills by Category

### Laravel (Backend)
```
.skills/laravel/
├── fortify-development         → Authentication (login, 2FA, etc)
├── laravel-best-practices      → PHP code patterns & best practices
├── pennant-development         → Feature flags & toggles
├── socialite-development       → OAuth social authentication
└── wayfinder-development       → Type-safe routes & controllers
```

### Frontend (UI/UX)
```
.skills/frontend/
├── inertia-react-development   → Inertia.js v3 + React
├── tailwindcss-development     → Tailwind CSS styling
└── shadcn                       → shadcn/ui components
```

### Testing (QA)
```
.skills/testing/
└── pest-testing                → Pest PHP testing framework
```

### Architecture (Analysis & Docs)
```
.skills/architecture/
├── understand                  → Codebase analysis & knowledge graph
├── understand-dashboard        → Visual knowledge graph
├── understand-domain           → Domain extraction & mapping
├── understand-explain          → Code explanation & breakdown
├── understand-knowledge        → Wiki analysis
├── understand-chat             → Code Q&A
└── understand-onboard          → Onboarding guide generation
```

### Tooling (Utilities)
```
.skills/tooling/
├── audit-website               → Website audits
├── brainstorming               → Creative planning
├── create-plan                 → Task planning & breakdown
├── understand-diff             → Git diff analysis
├── troubleshoot                → Debug agent behavior
├── project-setup-info-local    → Project scaffolding
├── agent-customization         → Agent configuration
├── github-summarize-issue-pr   → PR/Issue summary
├── github-suggest-fix-issue    → Issue fix suggestions
├── github-form-search-query    → GitHub search builder
├── github-show-search-result   → Search results display
├── github-address-pr-comments  → PR review handling
├── github-create-pull-request  → Create PR
└── fix-customization-diagnostics → Fix customization errors
```

## 🚀 Activation Patterns

### For Agent Integration
```yaml
# In agent/instructions file
skills:
  - laravel/fortify-development
  - frontend/inertia-react-development
  - testing/pest-testing
```

### For IDE Integration
```typescript
// VS Code autocomplete
@skill:laravel/fortify-development
@skill:frontend/tailwindcss-development
```

## 📊 Quick Stats

- **Total Skills**: 59
- **Categories**: 5
- **Most Used**: laravel-best-practices, inertia-react-development, pest-testing
- **Coverage**: Backend, Frontend, Testing, Architecture, Tooling

## 🎓 Learning Path

### 1️⃣ Foundation
```
1. understand          → Learn codebase
2. laravel-best-practices → Learn Laravel patterns
3. inertia-react-development → Learn frontend
```

### 2️⃣ Features
```
1. brainstorming       → Plan feature
2. create-plan         → Break into tasks
3. fortify-development → If auth needed
4. wayfinder-development → Type-safe routes
```

### 3️⃣ Implementation
```
1. shadcn              → Add components
2. tailwindcss-development → Style
3. pest-testing        → Test
```

### 4️⃣ Quality
```
1. understand-diff     → Review changes
2. audit-website       → Check quality
3. troubleshoot        → Debug issues
```

## 📝 Common Combinations

### Full Stack Feature
```
brainstorming
→ create-plan
→ laravel-best-practices
→ wayfinder-development
→ inertia-react-development
→ shadcn
→ tailwindcss-development
→ pest-testing
→ understand-diff
```

### Authentication Implementation
```
fortify-development
→ wayfinder-development
→ inertia-react-development
→ shadcn
→ tailwindcss-development
→ pest-testing
```

### Bug Fix
```
understand
→ understand-diff
→ laravel-best-practices
→ pest-testing
→ troubleshoot
```

### Code Review
```
understand-diff
→ understand-explain
→ suggest-fix-issue
→ address-pr-comments
```

---

**Note**: Semua skills sudah siap digunakan. Docs lengkap ada di folder masing-masing category.
