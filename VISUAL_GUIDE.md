# Visual Guide - Authentication Flow

## 🎨 User Interface

### Login/Signup Page

```
╔════════════════════════════════════════════════════════════════╗
║                    TERRAIN - Login/Signup                      ║
╠══════════════════════════════╦═════════════════════════════════╣
║                              ║                                 ║
║     🏔️ HERO IMAGE            ║   📋 AUTH FORM                 ║
║     (Yosemite)               ║                                 ║
║                              ║   Terrain                       ║
║  "Discover America's         ║   National Park Explorer       ║
║   Natural Wonders"           ║                                 ║
║                              ║   ┌─────────────────────────┐  ║
║                              ║   │ 🔑 Login │ 📝 Sign Up  │  ║
║                              ║   └─────────────────────────┘  ║
║                              ║                                 ║
║                              ║   Email: [____________]         ║
║                              ║   Password: [_______]           ║
║                              ║                                 ║
║                              ║   [ Login Button ]              ║
║                              ║                                 ║
╚══════════════════════════════╩═════════════════════════════════╝
```

### Navigation - Logged Out

```
╔═══════════════════════════════════════════════════════════════╗
║  🗺️ Terrain   Discover Parks | My Trips    🔍 Search │ 👤    ║
╚═══════════════════════════════════════════════════════════════╝
```

### Navigation - Logged In

```
╔═══════════════════════════════════════════════════════════════╗
║  🗺️ Terrain   Discover Parks | My Trips    🔍 Search │ 👤▼   ║
║                                                      ┌────────┐│
║                                                      │john_doe││
║                                                      │john@em ││
║                                                      ├────────┤│
║                                                      │My Trips││
║                                                      ├────────┤│
║                                                      │🚪Logout││
║                                                      └────────┘│
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🔄 Complete User Journey

### New User Path

```
Start App
    │
    ↓
Is user logged in?
    │
    ├─ NO  → Redirect to /auth
    │       │
    │       ↓
    │       Auth Page (Login/Signup)
    │       │
    │       ├─ Click "Sign Up" tab
    │       │   │
    │       │   ↓
    │       │   Fill form:
    │       │   - Username
    │       │   - Email
    │       │   - Password
    │       │   - Confirm Password
    │       │   │
    │       │   ↓
    │       │   Click "Sign Up"
    │       │   │
    │       │   ├─ Validation
    │       │   ├─ Hash password (Base64)
    │       │   ├─ POST /api/users
    │       │   │
    │       │   ├─ ✅ Success
    │       │   │   │
    │       │   │   ↓
    │       │   │   Save to localStorage
    │       │   │   │
    │       │   │   ↓
    │       │   │   Update AuthContext
    │       │   │   │
    │       │   │   ↓
    │       │   │   Redirect to / (Home)
    │       │   │
    │       │   └─ ❌ Error
    │       │       Display error message
    │       │
    │       └─ (Go back to sign up or login)
    │
    └─ YES → Continue to Home Page
         │
         ↓
         ProtectedRoute allows access
         │
         ↓
         Navigation shows username
         │
         ↓
         User can browse parks
         │
         ↓
         Logout from dropdown
         │
         ↓
         Redirect to /auth
```

### Returning User Path

```
Start App
    │
    ↓
Load localStorage
    │
    ├─ User data found
    │   │
    │   ↓
    │   AuthContext.useEffect() loads it
    │   │
    │   ↓
    │   setUser(data)
    │   setIsLoggedIn(true)
    │   │
    │   ↓
    │   Already logged in!
    │
└─ Proceed to Home Page
```

---

## 📱 Responsive Behavior

### Desktop (1920px)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ LEFT (50%)                      │ RIGHT (50%)            │  │
│  │ Hero Image                      │ Auth Card              │  │
│  │ + Branding                      │ + Forms                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet (768px)

```
┌────────────────────────────────────┐
│                                    │
│  Hero Image (Smaller)              │
│                                    │
│  Auth Card                         │
│  (Wider)                           │
│                                    │
└────────────────────────────────────┘
```

### Mobile (375px)

```
┌──────────────┐
│              │
│ No hero      │
│ (hidden)     │
│              │
│ Auth Card    │
│ (full width) │
│              │
│ Login/Signup │
│ Form         │
│              │
└──────────────┘
```

---

## 🔐 Data Flow

### Sign Up API Call

```
Frontend (Auth.tsx)
│
├─ User enters data
│  ├─ username: "john_doe"
│  ├─ email: "john@example.com"
│  └─ password: "password123"
│
├─ Validate
│  ├─ All fields filled? ✅
│  ├─ Passwords match? ✅
│  └─ Password >= 6 chars? ✅
│
├─ Hash password
│  └─ btoa("password123") = "cGFzc3dvcmQxMjM="
│
└─ POST /api/users
   {
     "username": "john_doe",
     "email": "john@example.com",
     "password_hash": "cGFzc3dvcmQxMjM="
   }
   │
   ↓
Backend (Express)
│
├─ Receive request
├─ Validate email uniqueness ✅
├─ Validate username uniqueness ✅
├─ Insert into database
└─ Return response
   {
     "success": true,
     "user": {
       "user_id": 1,
       "username": "john_doe",
       "email": "john@example.com"
     }
   }
   │
   ↓
Frontend
│
├─ Receive response
├─ Extract user data
├─ Call signup(user)
│  ├─ setUser(user)
│  ├─ setIsLoggedIn(true)
│  └─ localStorage.setItem('user', JSON.stringify(user))
│
└─ navigate('/')
   │
   ↓
Home Page (Protected Route)
│
├─ Check isLoggedIn? ✅
├─ Render HomePage
└─ Display username in navigation
```

### Login API Call

```
Frontend (Auth.tsx)
│
├─ User enters data
│  ├─ email: "john@example.com"
│  └─ password: "password123"
│
├─ Validate
│  ├─ Email filled? ✅
│  └─ Password filled? ✅
│
└─ GET /api/users/email/john@example.com
   │
   ↓
Backend
│
├─ Find user by email
├─ Return user data (including password_hash)
│  {
│    "user_id": 1,
│    "username": "john_doe",
│    "email": "john@example.com",
│    "password_hash": "cGFzc3dvcmQxMjM="
│  }
│
↓
Frontend
│
├─ Receive user data
├─ Hash input password
│  └─ btoa("password123") = "cGFzc3dvcmQxMjM="
│
├─ Compare hashes
│  └─ "cGFzc3dvcmQxMjM=" === "cGFzc3dvcmQxMjM="? ✅
│
├─ Password matches!
├─ Call login(user)
│  ├─ setUser(user)
│  ├─ setIsLoggedIn(true)
│  └─ localStorage.setItem('user', JSON.stringify(user))
│
└─ navigate('/')
```

---

## 🏠 Route Protection Logic

```
User tries to access /
│
├─ Check: isLoggedIn?
│
├─ YES ✅
│  │
│  ├─ ProtectedRoute passes element
│  │
│  ├─ Render HomePage
│  │
│  └─ Navigation shows username
│
└─ NO ❌
   │
   ├─ ProtectedRoute returns <Navigate to="/auth" />
   │
   └─ User redirected to auth page
```

---

## 💾 localStorage Structure

### Before Login
```
localStorage = {
  // Empty
}
```

### After Login/Signup
```
localStorage = {
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### After Logout
```
localStorage = {
  // user key removed
}
```

---

## 🔄 AuthContext State Management

```
AuthContext
│
├─ State
│  ├─ user: User | null
│  │  └─ { user_id, username, email }
│  │
│  └─ isLoggedIn: boolean
│
├─ Methods
│  ├─ login(user)
│  │  ├─ setUser(user)
│  │  ├─ setIsLoggedIn(true)
│  │  └─ localStorage.setItem('user', ...)
│  │
│  ├─ logout()
│  │  ├─ setUser(null)
│  │  ├─ setIsLoggedIn(false)
│  │  └─ localStorage.removeItem('user')
│  │
│  └─ signup(user)
│     └─ Same as login
│
└─ Provided to
   ├─ Auth.tsx (calls login/signup)
   ├─ Navigation.tsx (displays user)
   ├─ App.tsx (checks isLoggedIn)
   └─ All other components (via useAuth hook)
```

---

## 📊 Form Validation Flow

```
User submits form
│
├─ Check: All fields filled?
│  └─ NO → "Please fill in all fields"
│
├─ Check: Email format valid? (signup)
│  └─ NO → "Invalid email"
│
├─ Check: Passwords match? (signup)
│  └─ NO → "Passwords do not match"
│
├─ Check: Password >= 6 chars? (signup)
│  └─ NO → "Password must be at least 6 characters"
│
└─ All valid ✅
   │
   └─ Send to API
```

---

## ✨ State Transitions

```
┌─────────────┐
│ Not Logged  │
│   In        │
└──────┬──────┘
       │
       ├─ User signs up ─────────┐
       │                         │
       ├─ User logs in ──────────┤
       │                         │
       │                         ↓
       │                    ┌────────────┐
       │                    │  Logged    │
       │                    │   In       │
       │                    └────┬───────┘
       │                         │
       │                         ├─ User logs out ──┐
       │                         │                   │
       │                         ├─ Refresh (no data)┤
       │                         │                   │
       └─────────────────────────┴───────────────────┘
           (Back to Not Logged In)
```

---

## 🎯 Component Interaction Diagram

```
App.tsx
│
├─ AuthProvider
│  ├─ State: user, isLoggedIn
│  └─ Methods: login, logout, signup
│
└─ BrowserRouter
   │
   ├─ /auth Route
   │  └─ Auth.tsx
   │     ├─ useAuth() ──→ login, signup
   │     ├─ API calls
   │     └─ Form handling
   │
   └─ Protected Routes
      │
      ├─ / (Home)
      ├─ /search
      ├─ /park/:id
      └─ /profile
         │
         └─ Navigation.tsx
            ├─ useAuth() ──→ user, logout
            ├─ useNavigate() ──→ navigate
            └─ Shows user dropdown
```

---

This visual guide covers the entire authentication flow! 🎉
