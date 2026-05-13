# .skills Folder Structure

Struktur lengkap dan navigasi folder `.skills/`.

## 📂 Complete Directory Map

```
.skills/
│
├── 📄 README.md                    Main documentation & overview
│   └─ Start here! Lengkap penjelasan structure, categories, activation
│
├── 📄 QUICKSTART.md                5-langkah quick start guide
│   └─ Untuk new members & quick reference
│
├── 📄 MANIFEST.md                  Complete skills listing
│   └─ Semua 59 skills dengan status & trigger conditions
│
├── 📄 INDEX.md                     Skills index & quick reference
│   └─ Categorized listing + common combinations
│
├── 📄 RELATIONSHIPS.md             Skills dependencies & combinations
│   └─ Dependency tree, feature mapping, learning order
│
├── 📄 INTEGRATION.md               Integration guide untuk developers
│   └─ Checklist, usage, maintenance
│
├── 📄 STRUCTURE.md                 This file (folder structure)
│   └─ Navigation & directory organization
│
├── 📄 skills.json                  Metadata & configuration
│   └─ Machine-readable skills config
│
│
├── 📁 laravel/                     Backend skills
│   ├── README.md
│   │   ├─ fortify-development
│   │   ├─ laravel-best-practices
│   │   ├─ pennant-development
│   │   ├─ socialite-development
│   │   └─ wayfinder-development
│   │
│   └─ _category_: Backend development
│       Skills: 5 | Coverage: Authentication, APIs, Features, Routes
│
│
├── 📁 frontend/                    Frontend skills
│   ├── README.md
│   │   ├─ inertia-react-development
│   │   ├─ tailwindcss-development
│   │   └─ shadcn
│   │
│   └─ _category_: Client-side development
│       Skills: 3 | Coverage: Components, Styling, Routes
│
│
├── 📁 testing/                     Testing skills
│   ├── README.md
│   │   └─ pest-testing
│   │
│   └─ _category_: Quality assurance
│       Skills: 1 | Coverage: Unit, Feature, Browser, Architecture
│
│
├── 📁 architecture/                Analysis & documentation
│   ├── README.md
│   │   ├─ understand
│   │   ├─ understand-dashboard
│   │   ├─ understand-domain
│   │   ├─ understand-explain
│   │   ├─ understand-knowledge
│   │   ├─ understand-chat
│   │   └─ understand-onboard
│   │
│   └─ _category_: Code analysis & understanding
│       Skills: 7 | Coverage: Analysis, Documentation, Learning
│
│
└── 📁 tooling/                     Development tools & utilities
    ├── README.md
    │   ├─ audit-website
    │   ├─ brainstorming
    │   ├─ create-plan
    │   ├─ understand-diff
    │   ├─ troubleshoot
    │   ├─ project-setup-info-local
    │   ├─ agent-customization
    │   ├─ summarize-github-issue-pr-notification
    │   ├─ suggest-fix-issue
    │   ├─ form-github-search-query
    │   ├─ show-github-search-result
    │   ├─ address-pr-comments
    │   ├─ create-pull-request
    │   └─ fix-customization-evaluation-diagnostics
    │
    └─ _category_: Tools, automation, utilities
        Skills: 14 | Coverage: Planning, CI/CD, GitHub, Tools
```

## 📋 File Purpose Guide

| File | Purpose | Audience | Read Time |
|------|---------|----------|-----------|
| README.md | Overview & full documentation | All | 5 min |
| QUICKSTART.md | Fast start for new members | New devs | 3 min |
| MANIFEST.md | Complete skills listing | Reference | 3 min |
| INDEX.md | Quick reference & index | Daily use | 2 min |
| RELATIONSHIPS.md | Dependencies & combinations | Architects | 5 min |
| INTEGRATION.md | Technical integration | DevOps/Maintainers | 5 min |
| STRUCTURE.md | This file (organization) | Navigation | 2 min |
| skills.json | Machine-readable metadata | Tools/CI | - |

## 🗺️ Navigation Guide

### "I'm new, where do I start?"
```
1. Start → README.md               (Understand what is this)
2. Then → QUICKSTART.md            (5 langkah start)
3. Finally → laravel/README.md     (atau frontend/README.md)
```

### "I need to implement feature X"
```
1. Check → RELATIONSHIPS.md        (Find required skills)
2. Read → Relevant category README (Learn skills)
3. Activate → In your chat         (@skill:category/skill-name)
```

### "What skills are available?"
```
1. Quick → INDEX.md                (Categories & listing)
2. Full → MANIFEST.md              (Complete listing with stats)
3. Details → Category README       (Deep dive)
```

### "I'm reviewing code, where are guidelines?"
```
1. Start → RELATIONSHIPS.md        (Dependencies check)
2. Then → understand-diff          (Code review skill)
3. Reference → Category README     (Best practices)
```

### "I want to integrate this with my tool/CI"
```
1. Read → INTEGRATION.md           (Integration guide)
2. Use → skills.json               (Metadata format)
3. Reference → Category README     (Skill details)
```

## 📊 Statistics

```
Total Files:        8 markdown files + 1 json
Total Categories:   5
Total Skills:       59
Total Documentation: ~10,000 words

Structure:
  ├── Root level:     7 documentation files
  ├── Categories:     5 folders
  └── Per Category:   1 README.md file each
```

## 🎯 Quick Access Cheat Sheet

| Want to... | Go to... | File |
|-----------|----------|------|
| Understand structure | START HERE | `README.md` |
| Quick start | 5 min overview | `QUICKSTART.md` |
| Find skill by name | Complete list | `MANIFEST.md` |
| See all skills | Quick reference | `INDEX.md` |
| Check dependencies | Feature mapping | `RELATIONSHIPS.md` |
| Integrate w/ tools | Technical guide | `INTEGRATION.md` |
| Learn Laravel skills | Backend docs | `laravel/README.md` |
| Learn UI skills | Frontend docs | `frontend/README.md` |
| Learn testing | QA docs | `testing/README.md` |
| Learn analysis | Architecture docs | `architecture/README.md` |
| Learn tools | Tooling docs | `tooling/README.md` |

## 🔄 Recommended Reading Order

**For New Team Members:**
```
Week 1: README.md → QUICKSTART.md → laravel/README.md
Week 2: frontend/README.md → testing/README.md
Week 3: RELATIONSHIPS.md → architecture/README.md
Week 4+: Reference as needed + INTEGRATION.md
```

**For Daily Use:**
```
1. INDEX.md (bookmark this!)
2. Category READMEs (as needed)
3. skills.json (for tools)
```

**For Decision Making:**
```
1. RELATIONSHIPS.md (dependencies)
2. Category README (details)
3. INTEGRATION.md (architecture)
```

## 💡 Pro Tips

1. **Bookmark this path in your IDE:**
   ```
   .skills/README.md
   ```

2. **Use INDEX.md untuk quick skill lookup:**
   ```
   Ctrl+F untuk find skill name
   ```

3. **Check RELATIONSHIPS.md sebelum implement feature:**
   ```
   Identify skills → Read READMEs → Activate
   ```

4. **Use skills.json untuk automation:**
   ```
   Parse JSON untuk populate tools/CI
   ```

5. **Reference category README saat code review:**
   ```
   Enforce best practices dari README
   ```

## 🔗 Cross-Links

All files link ke relevant resources:
- README.md → Points to category READMEs
- QUICKSTART.md → Links to RELATIONSHIPS.md
- MANIFEST.md → References INTEGRATION.md
- INDEX.md → Connected to all category READMEs
- Category READMEs → Cross-reference each other

## ✅ Verification Checklist

Untuk memastikan struktur lengkap:

- [x] Root README.md created
- [x] QUICKSTART.md created
- [x] MANIFEST.md created
- [x] INDEX.md created
- [x] RELATIONSHIPS.md created
- [x] INTEGRATION.md created
- [x] STRUCTURE.md created (this file)
- [x] skills.json created
- [x] laravel/README.md created
- [x] frontend/README.md created
- [x] testing/README.md created
- [x] architecture/README.md created
- [x] tooling/README.md created

**Status**: ✅ Complete & Ready

---

**Version**: 1.0.0  
**Created**: May 13, 2026  
**Last Updated**: May 13, 2026  
**Status**: Active & Maintained
