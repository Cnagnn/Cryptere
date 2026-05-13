# Laravel Skills

Backend development skills untuk Laravel framework.

## 📚 Available Skills

### 1. **fortify-development**
Manajemen authentication dengan Laravel Fortify.
- Login, register, password reset
- Email verification
- Two-factor authentication (2FA/TOTP/QR codes)
- Profile updates
- Frontend-agnostic auth backend

**Trigger**: Kapan saja ada mention: Fortify, auth, login, register, 2FA, atau paths: `app/Actions/Fortify/`

### 2. **laravel-best-practices**
Pattern dan best practices untuk Laravel PHP code.
- Controllers, models, migrations
- Form requests, policies, jobs
- Eloquent queries & performance
- Authorization & security
- Caching & queue management

**Trigger**: Untuk semua Laravel PHP code modification

### 3. **pennant-development**
Feature flags dengan Laravel Pennant.
- Define feature flags
- Class-based features di `app/Features/`
- Scoped flags (users, teams)
- A/B testing & gradual rollouts
- Custom storage drivers

**Trigger**: Kapan saja ada mention: Pennant, feature flags, toggles

### 4. **socialite-development**
OAuth social authentication dengan Socialite.
- Add social login providers
- OAuth redirect/callback flows
- Retrieve authenticated user details
- Custom scopes & parameters
- Community providers

**Trigger**: Social login, OAuth, Socialite, third-party auth

### 5. **wayfinder-development**
Type-safe routes dan controllers dengan Laravel Wayfinder.
- Auto-generate typed functions
- Import dari `@/actions/` dan `@/routes/`
- Route typing & model binding
- Tree-shaking support
- Wayfinder Vite plugin

**Trigger**: Frontend calling backend routes, TypeScript route errors, `wayfinder:generate`

## 🚀 Recommended Flow

1. **Planning**: `laravel-best-practices` → Plan architecture
2. **Auth**: `fortify-development` → Setup authentication
3. **Features**: `pennant-development` → Manage feature flags
4. **Social**: `socialite-development` → Add social login
5. **Routes**: `wayfinder-development` → Type-safe integration

## 🔗 Dependencies

- PHP 8.4
- Laravel v13
- Requires: `laravel-best-practices` untuk semua task

## 📝 Usage

Untuk activate skill:
```
@skill:laravel/fortify-development
@skill:laravel/laravel-best-practices
```

---

**Last updated**: May 13, 2026
