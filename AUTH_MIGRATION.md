# 🔐 Migración a Autenticación Segura con HttpOnly Cookies

## ✅ Cambios Implementados en Frontend

### 1. **AuthService Refactorizado** (`lib/auth.ts`)

**Antes (❌ INSEGURO):**
```typescript
// Tokens en localStorage - vulnerable a XSS
localStorage.setItem('token', accessToken);
const token = localStorage.getItem('token');
Authorization: `Bearer ${token}`
```

**Ahora (✅ SEGURO):**
```typescript
// HttpOnly cookies - inaccesibles desde JavaScript
credentials: 'include' // Cookies se envían automáticamente
// No hay tokens en el código frontend
```

#### Cambios en métodos:

- `login()` → Ahora retorna `User` en vez de `AuthResponse`
- `register()` → Ahora retorna `User` en vez de `AuthResponse`
- `getProfile()` → Auto-refresh en 401
- `refresh()` → Nuevo método para renovar access token
- `logout()` → Ahora es async y llama al backend
- ❌ Eliminados: `setSession()`, `getToken()`, `getUser()`, `getTenant()`, `clearSession()`

---

### 2. **AuthContext Simplificado** (`contexts/AuthContext.tsx`)

**Cambios:**
- ❌ Eliminado `loadUserFromCache()` (ya no hay localStorage)
- ✅ `refreshUser()` ahora llama directamente a `getProfile()`
- ✅ `logout()` ahora es async
- ✅ Inicialización simplificada - solo llama a `refreshUser()`

**Antes:**
```typescript
const { loadUserFromCache } = useAuth();
await loadUserFromCache();
```

**Ahora:**
```typescript
const { refreshUser } = useAuth();
await refreshUser();
```

---

### 3. **Nuevo API Wrapper** (`lib/api.ts`)

Wrapper para fetch con auto-refresh en 401:

```typescript
import { api } from '@/lib/api';

// GET request
const data = await api.get('/api/v1/users');

// POST request
const user = await api.post('/api/v1/users', {
  name: 'John',
  email: 'john@example.com'
});

// Con opciones personalizadas
const data = await api.get('/api/v1/public', {
  skipAuth: true, // No intentar refresh en 401
});
```

**Características:**
- ✅ Auto-refresh en 401
- ✅ `credentials: 'include'` por defecto
- ✅ Manejo de errores centralizado
- ✅ Métodos convenientes: `get`, `post`, `put`, `patch`, `delete`

---

### 4. **Endpoints Actualizados** (`config/api.ts`)

```typescript
export const API_ENDPOINTS = {
  auth: {
    login: `${API_URL}/auth/login`,
    register: `${API_URL}/auth/register`,
    profile: `${API_URL}/auth/profile`,
    refresh: `${API_URL}/auth/refresh`,    // ✅ Nuevo
    logout: `${API_URL}/auth/logout`,      // ✅ Nuevo
  },
};
```

---

## 🔄 Flujo de Autenticación

### Login Flow

```
1. Usuario envía credenciales
   ↓
2. Backend valida y genera:
   - Access token (15 min) → HttpOnly cookie
   - Refresh token (7 días) → HttpOnly cookie
   ↓
3. Backend retorna solo datos públicos del usuario
   ↓
4. Frontend llama refreshUser() para actualizar contexto
   ↓
5. Navegación a /dashboard
   ↓
6. ProtectedRoute verifica isAuthenticated ✓
```

### Auto-Refresh Flow

```
1. Request a API protegida
   ↓
2. Access token expiró → 401
   ↓
3. AuthService.refresh() automáticamente
   ↓
4. Backend valida refresh token
   ↓
5. Nuevo access token → HttpOnly cookie
   ↓
6. Retry request original → Success ✓
```

---

## 🛡️ Mejoras de Seguridad

| Vulnerabilidad | Antes | Ahora |
|----------------|-------|-------|
| **XSS** | ❌ Token en localStorage | ✅ HttpOnly cookie |
| **Token Exposure** | ❌ Visible en DevTools | ✅ No accesible desde JS |
| **CSRF** | ❌ No protegido | ✅ SameSite=strict |
| **Token Lifetime** | ❌ Token largo único | ✅ Access corto + Refresh largo |
| **Token Refresh** | ❌ Manual | ✅ Automático |

---

## 📝 Guía de Uso

### Hacer Requests Autenticados

**Opción 1: Usar el wrapper `api`** (Recomendado)
```typescript
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';

// En un componente o hook
const fetchUsers = async () => {
  try {
    const users = await api.get(`${API_URL}/users`);
    return users;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Opción 2: Fetch directo**
```typescript
const response = await fetch(API_ENDPOINTS.someEndpoint, {
  credentials: 'include', // ⚠️ IMPORTANTE: Siempre incluir
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Logout

```typescript
const { logout } = useAuth();

const handleLogout = async () => {
  await logout(); // Limpia cookies y redirige
};
```

### Verificar Autenticación

```typescript
const { isAuthenticated, user, isLoading } = useAuth();

if (isLoading) return <Loading />;
if (!isAuthenticated) return <LoginPrompt />;

return <Dashboard user={user} />;
```

---

## 🚨 Breaking Changes

### Para Desarrolladores

1. **No más acceso directo a tokens**
   ```typescript
   // ❌ Ya no funciona
   const token = AuthService.getToken();
   const user = AuthService.getUser();
   
   // ✅ Usar el contexto
   const { user } = useAuth();
   ```

2. **loadUserFromCache eliminado**
   ```typescript
   // ❌ Ya no existe
   const { loadUserFromCache } = useAuth();
   
   // ✅ Usar refreshUser
   const { refreshUser } = useAuth();
   ```

3. **Todos los fetch necesitan credentials**
   ```typescript
   // ❌ Falta credentials
   fetch('/api/endpoint')
   
   // ✅ Correcto
   fetch('/api/endpoint', { credentials: 'include' })
   
   // ✅ Mejor: usar el wrapper
   api.get('/api/endpoint')
   ```

---

## 🔧 Configuración Requerida

### Frontend (Next.js)

Ya implementado ✅

### Backend (NestJS)

Ver `BACKEND_AUTH_GUIDE.md` para implementación completa.

**Checklist rápido:**
- [ ] Instalar `@nestjs/passport`, `passport-jwt`, `cookie-parser`
- [ ] Configurar CORS con `credentials: true`
- [ ] JWT Strategy que extraiga de cookies
- [ ] Endpoints: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/profile`
- [ ] HttpOnly cookies en responses
- [ ] Access token: 15 min
- [ ] Refresh token: 7 días

---

## 🧪 Testing

### Verificar Cookies en DevTools

1. Abrir DevTools → Application → Cookies
2. Después del login, deberías ver:
   - `access_token` (HttpOnly ✓, Secure ✓, SameSite: Strict)
   - `refresh_token` (HttpOnly ✓, Secure ✓, SameSite: Strict)

### Verificar Auto-Refresh

1. Login exitoso
2. Esperar 15 minutos (o modificar expiración en backend)
3. Hacer cualquier request
4. Debería auto-refrescar sin errores

---

## 📚 Recursos

- **Backend Guide**: `BACKEND_AUTH_GUIDE.md`
- **Auth Service**: `frontend/lib/auth.ts`
- **API Wrapper**: `frontend/lib/api.ts`
- **Auth Context**: `frontend/contexts/AuthContext.tsx`

---

## ❓ FAQ

**P: ¿Puedo seguir usando localStorage para otros datos?**  
R: Sí, pero NUNCA para tokens de autenticación.

**P: ¿Cómo funciona en desarrollo (HTTP)?**  
R: Las cookies funcionan, pero `secure: false` en desarrollo. En producción debe ser HTTPS.

**P: ¿Qué pasa si el refresh token expira?**  
R: El usuario es redirigido automáticamente a `/auth/login`.

**P: ¿Cómo implemento OAuth (Google, GitHub)?**  
R: Ver sección OAuth en `BACKEND_AUTH_GUIDE.md`.

**P: ¿Necesito cambiar mis componentes existentes?**  
R: Solo si usaban `loadUserFromCache()` → cambiar a `refreshUser()`.
