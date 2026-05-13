# Skills Integration Guide

Panduan lengkap mengintegrasikan skills folder dengan project Crypter.

## 🎯 Struktur Folder

```
Crypter/
├── .skills/                    ← Skills root folder
│   ├── README.md               ← Overview & documentation
│   ├── MANIFEST.md             ← List of all skills
│   ├── INDEX.md                ← Quick reference & activation
│   ├── skills.json             ← Metadata & configuration
│   ├── INTEGRATION.md           ← File ini
│   ├── laravel/                ← Backend skills
│   │   └── README.md
│   ├── frontend/               ← UI/Component skills
│   │   └── README.md
│   ├── testing/                ← QA skills
│   │   └── README.md
│   ├── architecture/           ← Analysis & docs skills
│   │   └── README.md
│   └── tooling/                ← Dev tools & utilities
│       └── README.md
```

## ✅ Integration Checklist

### ✓ IDE Support (VS Code)
- [x] Folder structure created
- [x] README & documentation added
- [x] Metadata file (skills.json) added
- [x] Category organization implemented
- [ ] Next: Add to `.vscode/settings.json` (optional)

### ✓ Agent Support
- [x] Skills organized by category
- [x] Manifest file for agent discovery
- [x] Activation format documented
- [x] Dependencies mapped

### ✓ Documentation
- [x] README.md untuk setiap kategori
- [x] Quick reference (INDEX.md)
- [x] Skills listing (MANIFEST.md)
- [x] Integration guide (ini)

## 🚀 Usage Instructions

### For Developers
1. Browse `.skills/` folder untuk explore available skills
2. Read README.md di setiap category
3. Activate relevant skills di chat:
   ```
   @skill:laravel/fortify-development
   @skill:frontend/tailwindcss-development
   ```

### For Agents
1. Reference skills dari `.skills/` folder
2. Activate otomatis saat relevan
3. Use format: `@skill:category/skill-name`

### For IDE
1. VS Code auto-indexes `.skills/` folder
2. Provides autocomplete untuk skills
3. Hover documentation tersedia

## 📋 Quick Reference

### Common Activation Patterns

**Authentication Feature**
```
@skill:laravel/fortify-development
@skill:laravel/wayfinder-development
@skill:frontend/inertia-react-development
@skill:testing/pest-testing
```

**UI Component**
```
@skill:frontend/shadcn
@skill:frontend/tailwindcss-development
@skill:testing/pest-testing
```

**Backend Feature**
```
@skill:laravel/laravel-best-practices
@skill:laravel/wayfinder-development
@skill:testing/pest-testing
```

**Code Analysis**
```
@skill:architecture/understand
@skill:architecture/understand-explain
@skill:tooling/understand-diff
```

## 🔄 Adding New Skills

Untuk menambah skill baru:

1. **Identify category**
   - Laravel → `.skills/laravel/`
   - Frontend → `.skills/frontend/`
   - Dll...

2. **Create skill file**
   ```
   .skills/[category]/[skill-name]/SKILL.md
   ```

3. **Update MANIFEST.md**
   - Add ke list
   - Update stats

4. **Update skills.json**
   - Add metadata

5. **Update category README**
   - List new skill

## 📊 File Reference

| File | Purpose | Edit By |
|------|---------|---------|
| README.md | Main overview | Maintainers |
| MANIFEST.md | Complete listing | CI/Auto |
| INDEX.md | Quick reference | Maintainers |
| skills.json | Metadata | Auto-generated |
| INTEGRATION.md | This guide | Docs team |
| Category/README.md | Category info | Category owners |

## 🛠 Maintenance

### Regular Tasks
- [ ] Review skills quarterly
- [ ] Update documentation
- [ ] Remove deprecated skills
- [ ] Add new emerging skills

### Before Commit
- [ ] All READMEs updated
- [ ] MANIFEST.md current
- [ ] skills.json valid JSON
- [ ] Links working

## 🔗 Integration Points

### With Agents
```yaml
# In agent prompt
---
skills:
  - category: laravel
  - category: frontend
  - category: testing
---
```

### With IDE
```json
// .vscode/settings.json (optional)
{
  "skillsPath": ".skills",
  "autoIndexSkills": true
}
```

### With CI/CD
```bash
# Validate skills structure
find .skills -name "README.md" -type f
validate-skills-json .skills/skills.json
```

## 📞 Support

Untuk questions tentang skills:
1. Check `.skills/README.md` untuk overview
2. Check category `README.md` untuk details
3. Check `MANIFEST.md` untuk listing
4. Check `INDEX.md` untuk quick reference

---

**Version**: 1.0.0  
**Last Updated**: May 13, 2026  
**Maintained By**: Development Team
