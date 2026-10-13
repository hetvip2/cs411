# Authentication Quick Start Guide

## What Was Implemented

A complete user authentication system with:
- ✅ Sign up functionality
- ✅ Login functionality  
- ✅ User session persistence
- ✅ Protected routes
- ✅ Username display in navigation
- ✅ Logout functionality
- ✅ Responsive design

## How to Test

### 1. Start Your Backend
```bash
cd backend
npm run dev
# Should see "Server running on port 3001"
```

### 2. Start Your Frontend
```bash
cd frontend
npm run dev
# Should see Vite running on http://localhost:5173
```

### 3. Test Sign Up
1. Open http://localhost:5173
2. You'll see the Auth page with hero image
3. Click "Sign Up" tab
4. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
5. Click "Sign Up"
6. Should redirect to home page
7. Look at navigation - should see "testuser" with user icon

### 4. Test Login After Logout
1. Click user icon dropdown in navigation
2. Click "Logout"
3. Should go back to auth page
4. Click "Login" tab
5. Enter:
   - Email: `test@example.com`
   - Password: `password123`
6. Click "Login"
7. Should be back on home page as "testuser"

### 5. Test Persistence
1. While logged in, refresh the page (F5)
2. Should stay logged in
3. Username should still appear

## File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── pages/
│   ├── Auth.tsx                 # Login/Signup page (NEW)
│   ├── HomePage.tsx
│   ├── SearchResults.tsx
│   ├── ParkDetails.tsx
│   ├── Profile.tsx
│   └── Index.tsx
├── components/
│   ├── Navigation.tsx           # Updated with user dropdown
│   └── ParkCard.tsx
└── App.tsx                      # Updated with routes & protection
```

## Key Features Explained

### AuthContext (src/contexts/AuthContext.tsx)
- Stores logged-in user state globally
- Provides `useAuth()` hook for any component
- Saves user to localStorage automatically
- Loads user from localStorage on page refresh

### Auth Page (src/pages/Auth.tsx)
- Beautiful split layout with hero image
- Two tabs: Login and Sign Up
- Validates input before sending to backend
- Hashes passwords with Base64
- Shows error messages for invalid credentials

### Protected Routes (src/App.tsx)
- Routes wrapped with ProtectedRoute component
- Checks if user is logged in
- Redirects to auth page if not authenticated
- Preserves route after login

### Navigation Updates (src/components/Navigation.tsx)
- Shows username in button when logged in
- Dropdown menu with user info
- Quick access to profile
- Logout button in dropdown

## Password Hashing (Development)

Passwords are currently hashed with Base64 encoding:
```javascript
const hashPassword = (password: string): string => {
  return btoa(password); // Base64 encoding
};
```

This is **NOT secure** and only for development. Production should use bcrypt.

## What Happens on Login/Signup

```
User fills form
    ↓
Frontend validates input
    ↓
Password hashed with Base64
    ↓
API request sent to backend
    ↓
Backend creates/validates user
    ↓
User ID returned in response
    ↓
User data stored in localStorage
    ↓
Redirect to home page
    ↓
Navigation updates with username
```

## Common Issues & Solutions

### Issue: Getting CORS errors
**Solution**: Make sure backend is running on port 3001

### Issue: Login says "User not found"
**Solution**: Make sure you signed up first with same email

### Issue: Password says "Invalid password"
**Solution**: Check that password matches exactly (case sensitive)

### Issue: Staying on auth page after login
**Solution**: Check browser console for errors, try clearing localStorage

### Issue: Username not showing after login
**Solution**: 
1. Refresh page
2. Check localStorage in DevTools (F12 → Application → localStorage)
3. Make sure backend returned user_id in response

## Debugging Tips

### Check localStorage
Open DevTools (F12) → Application → localStorage → http://localhost:5173
Should see user object with user_id, username, email

### Check Network Requests
Open DevTools → Network tab
Look for requests to `localhost:3001/api/users`
Should see 200/201 status for successful requests

### Check Console Errors
Open DevTools → Console
Look for red error messages
Should say "User logged in: username" on successful login

## Next Steps

1. ✅ Test the authentication flow
2. Make sure backend database has Users table
3. Consider production security improvements
4. Add email verification (optional)
5. Add password reset flow (optional)

## API Endpoints Used

- `POST /api/users` - Create new user
- `GET /api/users/email/:email` - Get user by email for login
- `GET /api/users/:userId` - Get user profile (optional)
- `PUT /api/users/:userId` - Update user (future)
- `DELETE /api/users/:userId` - Delete user (future)

All endpoints documented in `backend/USER_API_DOCUMENTATION.md`
