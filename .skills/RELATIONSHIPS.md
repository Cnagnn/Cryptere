# Skills Relationships & Dependencies

Memetakan hubungan antar skills dan dependency chain untuk common features.

## 🔗 Dependency Tree

```
Foundation Skills (Harus Ada)
├── laravel-best-practices       (untuk semua backend)
├── inertia-react-development    (untuk semua frontend)
└── pest-testing                 (untuk semua QA)

Specialized Skills (Pilih Sesuai)
├── fortify-development          (jika ada auth)
├── wayfinder-development        (untuk type-safe routes)
├── shadcn                        (untuk UI components)
├── tailwindcss-development      (untuk styling)
├── pennant-development          (untuk feature flags)
└── socialite-development        (untuk social login)

Analysis Skills (On-Demand)
├── understand-*                 (saat review/analyze)
├── understand-diff              (saat code review)
└── audit-website                (saat quality check)

Tooling Skills (As Needed)
├── brainstorming                (saat planning)
├── create-plan                  (saat breakdown)
├── github-*                     (saat PR management)
└── troubleshoot                 (saat debugging)
```

## 🎯 Feature to Skills Mapping

### Feature: User Authentication
```
laravel-best-practices          ← Base
  └── fortify-development       ← Auth logic
      ├── wayfinder-development ← Routes
      └── inertia-react-development ← Forms
          ├── shadcn            ← Form components
          └── tailwindcss-development ← Styling
              └── pest-testing  ← Tests
                  └── understand-diff ← Review
```

**Chain**: `fortify-development` → `wayfinder-development` → `inertia-react-development` → `shadcn` + `tailwindcss-development` → `pest-testing`

### Feature: Product Dashboard
```
laravel-best-practices          ← Base
  ├── wayfinder-development     ← API routes
  └── inertia-react-development ← Page components
      ├── shadcn                ← Dashboard components
      └── tailwindcss-development ← Grid/layout
          └── pest-testing      ← Tests
              └── understand-diff ← Review
```

**Chain**: `wayfinder-development` → `inertia-react-development` → `shadcn` + `tailwindcss-development` → `pest-testing`

### Feature: Feature Flags
```
laravel-best-practices          ← Base
  └── pennant-development       ← Feature logic
      ├── wayfinder-development ← Routes
      ├── fortify-development   ← Auth scoping
      └── inertia-react-development ← UI conditionals
          └── pest-testing      ← Tests
```

**Chain**: `pennant-development` → `wayfinder-development` + `inertia-react-development` → `pest-testing`

### Feature: Social Login
```
laravel-best-practices          ← Base
  └── socialite-development     ← OAuth logic
      ├── fortify-development   ← Auth integration
      ├── wayfinder-development ← Routes
      └── inertia-react-development ← Login flow
          ├── shadcn            ← Buttons
          └── tailwindcss-development ← Styling
              └── pest-testing  ← Tests
```

**Chain**: `socialite-development` → `fortify-development` → `wayfinder-development` → `inertia-react-development` → `shadcn` + `tailwindcss-development` → `pest-testing`

## 📊 Skills by Feature Complexity

### Beginner Features (1-3 skills)
```
✓ Simple form         → shadcn + tailwindcss
✓ Read-only page      → inertia-react + tailwindcss
✓ Form submission     → wayfinder + inertia-react + pest-testing
```

### Intermediate Features (4-6 skills)
```
✓ CRUD with API       → wayfinder + laravel-best-practices + pest-testing
✓ Styled dashboard    → shadcn + tailwindcss + inertia-react + pest-testing
✓ Feature flags       → pennant + wayfinder + inertia-react + pest-testing
```

### Advanced Features (7+ skills)
```
✓ Authentication      → fortify + wayfinder + inertia-react + shadcn + 
                         tailwindcss + pest-testing + laravel-best-practices
✓ Social login        → socialite + fortify + wayfinder + inertia-react + 
                         shadcn + tailwindcss + pest-testing
✓ Role-based access   → laravel-best-practices + fortify + wayfinder + 
                         inertia-react + pest-testing
```

## 🔄 Common Skill Combinations

### Full Stack Development
```
Backend:
  1. laravel-best-practices
  2. wayfinder-development
  3. pest-testing

Frontend:
  4. inertia-react-development
  5. shadcn
  6. tailwindcss-development

Review:
  7. understand-diff
```

### Backend Only
```
1. laravel-best-practices
2. fortify-development (if auth)
3. wayfinder-development
4. pest-testing
5. understand-diff
```

### Frontend Only
```
1. inertia-react-development
2. shadcn
3. tailwindcss-development
4. pest-testing
5. understand-diff
```

### DevOps/Tooling
```
1. agent-customization
2. project-setup-info-local
3. troubleshoot
4. understand-diff
```

## 🎓 Learning Dependencies

**To learn Feature X, master these first:**

| Feature | Prerequisites |
|---------|---------------|
| Authentication | laravel-best-practices, inertia-react-development |
| API | laravel-best-practices, wayfinder-development |
| Components | shadcn, tailwindcss-development |
| Feature Flags | laravel-best-practices, pennant-development |
| Social Login | fortify-development, socialite-development |
| Admin Panel | All of above + understand-domain |

## 🚀 Recommended Learning Order

1. **Foundation** (Week 1)
   - laravel-best-practices
   - inertia-react-development
   - pest-testing

2. **Frontend** (Week 2)
   - shadcn
   - tailwindcss-development

3. **Backend** (Week 3)
   - wayfinder-development
   - fortify-development

4. **Advanced** (Week 4+)
   - pennant-development
   - socialite-development
   - understand-*

5. **Architecture** (Ongoing)
   - understand-domain
   - understand-explain
   - understand-diff

## 📋 Pre-Feature Checklist

Before starting feature implementation:

- [ ] Identify required skills
- [ ] Check dependencies
- [ ] Read relevant READMEs
- [ ] Activate skills in order
- [ ] Follow recommended pattern
- [ ] Plan tests early
- [ ] Review with understand-diff

## 🔗 Cross-References

**Skills that work well together:**

```
fortify ←→ wayfinder      (Auth routes)
wayfinder ←→ inertia      (API & UI)
shadcn ←→ tailwindcss     (Components & styling)
pennant ←→ fortify        (Feature-scoped auth)
socialite ←→ fortify      (Social auth integration)
pest ←→ laravel-*         (All backend testing)
understand-* ←→ All       (Analysis & review)
```

---

**Version**: 1.0.0  
**Updated**: May 13, 2026  
**Use**: For planning & feature implementation
