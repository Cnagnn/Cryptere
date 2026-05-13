# Testing Skills

Quality assurance dan testing skills untuk Crypter project.

## 📚 Available Skills

### 1. **pest-testing**
Testing dengan Pest PHP testing framework.
- Feature tests dan unit tests
- `test()`, `it()`, `expect()` syntax
- Datasets & data providers
- Mocking & stubbing
- Browser testing (Playwright integration)
- Architecture tests dengan `arch()`
- Livewire component testing
- RefreshDatabase trait

**Trigger**: 
- Test creation, editing, refactoring
- Pest file mention: `tests/Feature/`, `tests/Unit/`
- Browser testing, smoke testing
- TDD workflows

**Commands**:
- Run: `php artisan test --compact`
- Filter: `php artisan test --compact --filter=TestName`
- Create: `php artisan make:test Name --pest`

## 🧪 Best Practices

1. **Coverage**: Aim untuk 80%+ code coverage
2. **Naming**: Deskriptif & clear test names
3. **Organization**: Feature tests untuk business logic, unit untuk utils
4. **Mocking**: Mock external services & databases
5. **Datasets**: Gunakan datasets untuk multiple scenarios

## 🔄 Testing Pyramid

```
┌────────────────────────┐
│    Browser Tests       │ (Playwright / Pest)
├────────────────────────┤
│   Feature Tests        │ (Integration tests)
├────────────────────────┤
│    Unit Tests          │ (Fast, isolated)
└────────────────────────┘
```

## 📝 Usage

```
@skill:testing/pest-testing
```

## 🚀 Quick Start

```bash
# Buat test baru
php artisan make:test MyFeature --pest

# Run semua tests
php artisan test --compact

# Run test tertentu
php artisan test --compact --filter=MyFeatureTest
```

---

**Last updated**: May 13, 2026
