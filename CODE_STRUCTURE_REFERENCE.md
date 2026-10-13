# Code Structure Reference

## Project File Organization

```
Terrain/
├── backend/
│   ├── index.js                      # Express server with user APIs
│   ├── db.js                         # MySQL connection
│   ├── package.json
│   └── USER_API_DOCUMENTATION.md     # Backend API docs
│
└── frontend/
    ├── src/
    │   ├── App.tsx                   # ✅ UPDATED - Routes & auth
    │   │   • Added AuthProvider wrapper
    │   │   • Added ProtectedRoute component
    │   │   • Added /auth route
    │   │   • Protected all other routes
    │   │
    │   ├── contexts/                 # ✅ NEW
    │   │   └── AuthContext.tsx
    │   │       • Global state management
    │   │       • User persistence
    │   │       • useAuth() hook
    │   │
    │   ├── pages/
    │   │   ├── Auth.tsx              # ✅ NEW
    │   │   │   • Login/Signup page
    │   │   │   • Split layout design
    │   │   │   • Form validation
    │   │   │
    │   │   ├── HomePage.tsx          # (unchanged)
    │   │   ├── SearchResults.tsx     # (unchanged)
    │   │   ├── ParkDetails.tsx       # (unchanged)
    │   │   ├── Profile.tsx           # (unchanged)
    │   │   ├── Index.tsx             # ✅ UPDATED
    │   │   │   • Redirects to /auth
    │   │   │
    │   │   └── NotFound.tsx          # (unchanged)
    │   │
    │   ├── components/
    │   │   ├── Navigation.tsx        # ✅ UPDATED
    │   │   │   • Added user dropdown
    │   │   │   • Added username display
    │   │   │   • Added logout button
    │   │   │
    │   │   └── ParkCard.tsx          # (unchanged)
    │   │
    │   ├── hooks/                    # (unchanged)
    │   │   ├── use-mobile.tsx
    │   │   └── use-toast.ts
    │   │
    │   ├── lib/                      # (unchanged)
    │   │   └── utils.ts
    │   │
    │   └── App.css, index.css, main.tsx, etc.
    │
    ├── AUTHENTICATION_SETUP.md       # ✅ NEW - Full technical guide
    ├── AUTH_QUICK_START.md           # ✅ NEW - Quick reference
    ├── IMPLEMENTATION_SUMMARY.md     # ✅ NEW - This file
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

## Modified Files Summary

### 1. src/App.tsx

**What Changed:**
```diff
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";

+ // Protected Route Component
+ const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
+   const { isLoggedIn } = useAuth();
+   return isLoggedIn ? element : <Navigate to="/auth" replace />;
+ };

+ const AppRoutes = () => (
+   <Routes>
+     <Route path="/auth" element={<Auth />} />
+     <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
+     ...
+   </Routes>
+ );

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      ...
      <BrowserRouter>
+       <AuthProvider>
+         <AppRoutes />
+       </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

**Routes Before:**
```
/ → HomePage (no auth)
/search → SearchResults (no auth)
/park/:id → ParkDetails (no auth)
/profile → Profile (no auth)
```

**Routes After:**
```
/auth → Auth (public)
/ → HomePage (protected) → redirects to /auth if not logged in
/search → SearchResults (protected)
/park/:id → ParkDetails (protected)
/profile → Profile (protected)
```

---

### 2. src/components/Navigation.tsx

**What Changed:**
```diff
+ import { useNavigate } from "react-router-dom";
+ import { LogOut } from "lucide-react";
+ import { useAuth } from "@/contexts/AuthContext";
+ import { DropdownMenu, ... } from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const location = useLocation();
+ const navigate = useNavigate();
+ const { user, isLoggedIn, logout } = useAuth();

+ const handleLogout = () => {
+   logout();
+   navigate("/auth");
+ };

  return (
    ...
+   {isLoggedIn && user ? (
+     <DropdownMenu>
+       <DropdownMenuTrigger>
+         <User /> {user.username}
+       </DropdownMenuTrigger>
+       <DropdownMenuContent>
+         {user.username} / {user.email}
+         <DropdownMenuItem>My Trip Plans</DropdownMenuItem>
+         <DropdownMenuItem onClick={handleLogout}>
+           Logout
+         </DropdownMenuItem>
+       </DropdownMenuContent>
+     </DropdownMenu>
+   ) : (
+     <Link to="/auth"><User /></Link>
+   )}
    ...
  );
};
```

**Display Logic:**
```
If logged in:
  Show: [👤 username ▼] → dropdown menu
        ├─ username
        ├─ email
        ├─ My Trip Plans link
        └─ Logout button

If not logged in:
  Show: [👤] (link to /auth)
```

---

### 3. src/pages/Index.tsx

**What Changed:**
```diff
+ import { useEffect } from "react";
+ import { useNavigate } from "react-router-dom";

const Index = () => {
+ const navigate = useNavigate();

+ useEffect(() => {
+   navigate("/auth", { replace: true });
+ }, [navigate]);

+ return null;
};
```

**Purpose:** Redirects landing page to auth page

---

## New Files Created

### 1. src/contexts/AuthContext.tsx

**Complete File:**
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  user_id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  signup: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
  };

  const signup = (userData: User) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Key Methods:**
- `login(user)` - Set logged in user
- `logout()` - Clear user and localStorage
- `signup(user)` - Set new user after signup
- `useAuth()` - Hook to access context in components

---

### 2. src/pages/Auth.tsx

**Key Sections:**

```typescript
// Password hashing (development only)
const hashPassword = (password: string): string => {
  return btoa(password); // Base64 encoding
};

// Sign up handler
const handleSignup = async (e: React.FormEvent) => {
  // Validation
  // Password hashing
  // API call: POST /api/users
  // localStorage storage
  // Redirect
};

// Login handler
const handleLogin = async (e: React.FormEvent) => {
  // Validation
  // API call: GET /api/users/email/:email
  // Password verification
  // localStorage storage
  // Redirect
};

// UI Layout
<div className="flex">
  <div>Hero Image (hidden on mobile)</div>
  <Card>
    <Tabs>
      <TabsContent>Login Form</TabsContent>
      <TabsContent>Signup Form</TabsContent>
    </Tabs>
  </Card>
</div>
```

---

## How Components Connect

```
App.tsx
├─ AuthProvider
│  └─ BrowserRouter
│     ├─ Route /auth
│     │  └─ Auth.tsx
│     │     ├─ useAuth() → signup
│     │     └─ API: POST /api/users
│     │
│     ├─ Route / (protected)
│     │  └─ HomePage.tsx
│     │     └─ Navigation.tsx
│     │        ├─ useAuth() → user, logout
│     │        └─ Shows: username dropdown
│     │
│     └─ Other routes (protected)
│        └─ Navigation.tsx (same as above)
│
localStorage
└─ Stores: { user_id, username, email }
   Synced by AuthContext
```

---

## Data Flow Example: Sign Up

```
User fills form
  ↓
handleSignup()
  ├─ Validate fields
  ├─ Check passwords match
  ├─ Hash password (btoa)
  └─ Make API call
       ↓
   POST /api/users
   {username, email, password_hash}
       ↓
   Backend creates user
   Returns {user_id, username, email}
       ↓
   Frontend receives response
   ├─ Call signup(userData)
   │  └─ AuthContext.signup()
   │     ├─ setUser(userData)
   │     ├─ setIsLoggedIn(true)
   │     └─ localStorage.setItem('user', userData)
   └─ navigate('/')
       ↓
   App checks: isLoggedIn = true
   ├─ ProtectedRoute allows access
   └─ Navigate.tsx shows username
```

---

## API Calls Made

### From Auth.tsx

**Signup:**
```javascript
fetch("http://localhost:3001/api/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "john_doe",
    email: "john@example.com",
    password_hash: btoa("password123")
  })
})
// Response: { success, message, user }
```

**Login:**
```javascript
fetch("http://localhost:3001/api/users/email/john@example.com")
// Response: { success, user: { user_id, username, email, password_hash } }
// Then verify: btoa(inputPassword) === user.password_hash
```

---

## TypeScript Interfaces

```typescript
// User interface (in AuthContext)
interface User {
  user_id: number;      // From backend
  username: string;     // From backend
  email: string;        // From backend
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  signup: (user: User) => void;
}
```

---

## Conditional Rendering Patterns

### In Navigation.tsx
```typescript
// Show different UI based on login state
{isLoggedIn && user ? (
  // Logged in UI
  <DropdownMenu>
    <Button>{user.username}</Button>
    ...
  </DropdownMenu>
) : (
  // Not logged in UI
  <Link to="/auth">
    <Button><User /></Button>
  </Link>
)}
```

### In App.tsx
```typescript
// Route protection
<Route 
  path="/" 
  element={
    <ProtectedRoute 
      element={isLoggedIn ? <HomePage /> : null} 
    />
  } 
/>
```

---

## Error Handling

### Auth.tsx Validations
```typescript
// Sign Up
if (!signupUsername || !signupEmail || !signupPassword) {
  setSignupError("Please fill in all fields");
}
if (signupPassword !== signupConfirmPassword) {
  setSignupError("Passwords do not match");
}
if (signupPassword.length < 6) {
  setSignupError("Password must be at least 6 characters");
}

// API response
if (!response.ok) {
  setSignupError(errorData.error);
}

// Login
if (response.status === 404) {
  setLoginError("User not found");
}
if (hashedPassword !== user.password_hash) {
  setLoginError("Invalid password");
}
```

---

This completes the authentication system implementation! 🎉
