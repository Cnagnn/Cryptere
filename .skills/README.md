# Skills Repository - Crypter Project

Pusat pengelolaan semua skills untuk agents dan IDE support di project Crypter.

## 📁 Struktur Folder

```
.skills/
├── laravel/          # Backend Laravel framework skills
├── frontend/         # Frontend & UI component skills
├── testing/          # Testing & QA skills
├── architecture/     # Code analysis & documentation
├── tooling/          # Development tools & utilities
└── README.md         # Dokumentasi ini
```

## 🎯 Kategori Skills

### Laravel Skills (Backend)
Skills untuk pengembangan backend Laravel, authentication, packages, dan best practices.
- **fortify-development**: Manajemen authentication (login, register, 2FA)
- **laravel-best-practices**: Pattern dan best practices Laravel
- **pennant-development**: Feature flags & toggles
- **socialite-development**: OAuth & social login
- **wayfinder-development**: Type-safe routes & controllers

### Frontend Skills (Client-side)
Skills untuk pengembangan UI, components, dan styling.
- **inertia-react-development**: Inertia.js v3 + React SSA
- **tailwindcss-development**: Tailwind CSS styling & layouts
- **shadcn**: shadcn/ui component management

### Testing Skills
Skills untuk testing di berbagai level.
- **pest-testing**: Pest PHP testing framework

### Architecture Skills
Skills untuk analisis, dokumentasi, dan pemahaman kode.
- **understand**: Analisis codebase & knowledge graph
- **understand-dashboard**: Visualisasi interaktif codebase
- **understand-domain**: Domain knowledge extraction
- **understand-explain**: Deep-dive penjelasan kode
- **understand-knowledge**: LLM wiki analysis
- **understand-chat**: Q&A berbasis knowledge graph
- **understand-onboard**: Onboarding guide generation

### Tooling Skills
Skills untuk utilities, automation, dan development tools.
- **audit-website**: SEO & performance audit (squirrelscan)
- **brainstorming**: Creative planning sebelum implementation
- **create-plan**: Planning & task breakdown
- **understand-diff**: Git diff analysis
- **project-setup-info-local**: Project scaffolding & setup
- **agent-customization**: Agent configuration & customization
- **troubleshoot**: Debug chat agent behavior
- **GitHub skills**: PR/issue management (summarize, suggest-fix, etc.)

## 🚀 Cara Menggunakan

### Untuk Agents
Skills tersentralisasi dan dapat diakses oleh semua agents dengan:
```
@skill:laravel/fortify-development
@skill:frontend/inertia-react-development
```

### Untuk IDE Support
VS Code secara otomatis akan:
1. Mengindeks skills dari `.skills/` folder
2. Provide autocomplete untuk skill activation
3. Link skills ke agent instructions

## 📋 Skill Activation Checklist

Sebelum implementasi fitur, pastikan skills yang relevan sudah activated:

- [ ] Laravel backend → **laravel-best-practices**
- [ ] Authentication → **fortify-development**
- [ ] Feature flags → **pennant-development**
- [ ] Social login → **socialite-development**
- [ ] Type-safe routes → **wayfinder-development**
- [ ] React UI → **inertia-react-development**
- [ ] Styling → **tailwindcss-development**
- [ ] Components → **shadcn**
- [ ] Testing → **pest-testing**
- [ ] Code analysis → **understand** (pilih sesuai kebutuhan)
- [ ] Creative work → **brainstorming**

## 🔄 Management

Untuk menambah/update skills:
1. Buat file SKILL.md di folder kategori yang sesuai
2. Update MANIFEST.md
3. Jalankan `composer setup` atau refresh IDE

## 📝 Dokumentasi

Setiap skill memiliki:
- **SKILL.md**: Petunjuk lengkap skill
- **README.md** (optional): Overview kategori
- **Metadata**: Name, description, applyTo patterns

---

**Last updated**: May 13, 2026
**Project**: Crypter
**Maintained by**: Development Team
