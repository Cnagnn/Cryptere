# Architecture & Code Analysis Skills

Skills untuk analisis, dokumentasi, dan pemahaman codebase.

## 📚 Available Skills

### 1. **understand**
Analisis lengkap codebase & generate knowledge graph interaktif.
- Architecture visualization
- Component relationships
- File dependencies
- Code metrics

**Trigger**: `understand` command, codebase exploration

### 2. **understand-dashboard**
Dashboard interaktif untuk visualisasi knowledge graph.
- Visual codebase map
- Interactive exploration
- Dependency graphs
- Component hierarchy

**Trigger**: Need visual understanding, exploration

### 3. **understand-domain**
Extract business domain knowledge & generate domain flow graph.
- Domain entity extraction
- Business logic visualization
- Feature relationships
- Context mapping

**Trigger**: Domain analysis, business logic understanding

### 4. **understand-explain**
Deep-dive explanation untuk specific file, function, atau module.
- Code explanation
- Logic breakdown
- Purpose & context
- Usage examples

**Trigger**: Complex code, understanding specific logic

### 5. **understand-knowledge**
Analisis LLM wiki knowledge base.
- Entity extraction
- Implicit relationships
- Topic clustering
- Knowledge graph

**Trigger**: Wiki/documentation analysis

### 6. **understand-chat**
Q&A berbasis knowledge graph.
- Ask questions tentang codebase
- Get contextual answers
- Reference documentation
- Cross-reference linking

**Trigger**: Codebase Q&A, reference lookups

### 7. **understand-onboard**
Generate onboarding guide untuk team members baru.
- Setup instructions
- Architecture overview
- Key concepts
- Getting started

**Trigger**: Onboarding documentation, team training

## 🎯 Usage Flowchart

```
Start → Is it unfamiliar codebase?
        ├─ Yes → understand (full analysis)
        │        ├─ Visual? → understand-dashboard
        │        ├─ Domain? → understand-domain
        │        └─ Details? → understand-explain
        │
        └─ No  → understand-chat (Q&A)
                 ├─ Domain knowledge? → understand-knowledge
                 └─ New team? → understand-onboard
```

## 📝 Usage

```
@skill:architecture/understand
@skill:architecture/understand-dashboard
@skill:architecture/understand-domain
@skill:architecture/understand-explain
@skill:architecture/understand-knowledge
@skill:architecture/understand-chat
@skill:architecture/understand-onboard
```

## 🔍 When to Use

| Situation | Skill | Output |
|-----------|-------|--------|
| Understand architecture | `understand` | Knowledge graph |
| Visual exploration | `understand-dashboard` | Interactive map |
| Domain analysis | `understand-domain` | Domain flow |
| Code explanation | `understand-explain` | Detailed breakdown |
| Wiki analysis | `understand-knowledge` | Entity graph |
| Answer questions | `understand-chat` | Q&A responses |
| Team onboarding | `understand-onboard` | Guide document |

---

**Last updated**: May 13, 2026
