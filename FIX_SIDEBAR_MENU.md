# Update User Roles in MongoDB

## Quick Fix: Set User Role

If your sidebar is not showing menu items, it's likely because your user doesn't have a role set in the database.

### Option 1: MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your database
3. Find the `users` collection
4. Find your user by email
5. Edit the document and add/update the `role` field to one of:
   - `photographer` (default, recommended)
   - `client`
   - `admin`
6. Save the document
7. Logout and login again

### Option 2: MongoDB Shell
```bash
# Connect to your MongoDB
mongosh "YOUR_MONGODB_CONNECTION_STRING"

# Update user role to photographer (default)
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "photographer" } }
)

# Or update to client
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "client" } }
)

# Or update to admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)

# Verify the update
db.users.findOne({ email: "your-email@example.com" }, { email: 1, role: 1 })
```

### Option 3: Update All Existing Users
```bash
# Set all users without a role to photographer
db.users.updateMany(
  { role: { $exists: false } },
  { $set: { role: "photographer" } }
)

# Or set all null/undefined roles to photographer
db.users.updateMany(
  { $or: [{ role: null }, { role: { $exists: false } }] },
  { $set: { role: "photographer" } }
)
```

## After Updating

1. **Logout** from your application
2. **Clear browser cookies** (or use incognito mode)
3. **Login again** - This will generate a new JWT token with the role
4. **Check the sidebar** - Menu items should now appear

## Debug: Check Browser Console

Open your browser console (F12) and look for these logs:
```
Sidebar - User: { ... }
Sidebar - User Role: photographer (or client/admin)
Sidebar - Menu Items: [ ... ] (should show array of menu items)
```

If you see:
- `User Role: undefined` or `User Role: null` → User needs role set in database
- `Menu Items: []` → Role is not matching or getSidebarMenu not working
- `User: null` → User is not authenticated

## Troubleshooting

### Issue: Sidebar shows "Loading menu..." with "Role: Not set"
**Solution:** User doesn't have a role in database. Update using MongoDB commands above.

### Issue: Sidebar shows "Loading menu..." with a role displayed
**Solution:** The role might not be recognized. Check for typos. Valid roles are:
- `photographer`
- `client`  
- `admin`

### Issue: Menu still not showing after setting role
**Solution:**
1. Logout completely
2. Clear all cookies for localhost:3000
3. Login again (this generates new JWT with role)
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: I get redirected to a different page
**Solution:** This is normal! Role-based redirects are working:
- `photographer` → redirects to `/`
- `client` → redirects to `/my-albums`
- `admin` → redirects to `/admin/dashboard`
