# Legacy Beta Whitelist System

This system implements a whitelist for the Legacy Beta content toggle, allowing only specific Auth0 users to see and use the Legacy Beta features.

## Setup

### 1. Create the Supabase Table

Run the SQL commands in `supabase_setup.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_setup.sql`
4. Execute the SQL

This will create:
- A `legacy_beta_whitelist` table with proper indexes
- Row Level Security (RLS) policies
- Appropriate permissions

### 2. Add Users to the Whitelist

You can add users to the whitelist in several ways:

#### Option A: Direct SQL (Recommended for initial setup)
```sql
INSERT INTO legacy_beta_whitelist (auth0_user_id) VALUES ('auth0|1234567890abcdef');
```

#### Option B: Using the Admin Utility (For programmatic management)
```typescript
import { addUserToWhitelist } from '../utils/whitelistAdmin';

// Add a user
await addUserToWhitelist('auth0|1234567890abcdef');
```

### 3. Finding Auth0 User IDs

To find a user's Auth0 ID:

1. Have the user log in to your application
2. Check the browser's developer tools → Application → Cookies
3. Look for the Auth0 session cookie and decode it, or
4. Add temporary logging in your app:
   ```typescript
   const { user } = useUser();
   console.log('User ID:', user?.sub);
   ```

## How It Works

1. **Component Level**: The `ContentToggleButton` component checks if the current user is whitelisted
2. **Database Query**: The `isUserWhitelistedForLegacyBeta()` function queries the Supabase table
3. **Conditional Rendering**: The Legacy Beta toggle only appears if the user is whitelisted
4. **Real-time Updates**: The whitelist status is checked whenever the user data changes

## User Experience

- **Whitelisted users**: See the "Enable Legacy Beta Content" toggle in the Content Settings
- **Non-whitelisted users**: Do not see the Legacy Beta toggle at all
- **Unauthenticated users**: Do not see the toggle (requires login)

## Management Functions

The `whitelistAdmin.ts` utility provides functions for managing the whitelist:

- `addUserToWhitelist(auth0UserId)` - Add a user to the whitelist
- `removeUserFromWhitelist(auth0UserId)` - Remove a user from the whitelist
- `getAllWhitelistedUsers()` - Get all whitelisted user IDs
- `isUserInWhitelist(auth0UserId)` - Check if a user is whitelisted

## Security Notes

- The table uses Row Level Security (RLS)
- Users can only read their own whitelist status
- Only service role can modify the whitelist
- All database operations are logged for audit purposes

## Troubleshooting

### Toggle not appearing for whitelisted users:
1. Check that the user is logged in
2. Verify the user ID in the database matches exactly
3. Check browser console for any errors
4. Ensure Supabase environment variables are set correctly

### Database connection issues:
1. Verify Supabase URL and anon key in environment variables
2. Check that RLS policies are properly configured
3. Ensure the table was created successfully

## Example Usage

```typescript
// Check if current user is whitelisted
const { user } = useUser();
const [isWhitelisted, setIsWhitelisted] = useState(false);

useEffect(() => {
  const checkStatus = async () => {
    if (user?.sub) {
      const whitelisted = await isUserWhitelistedForLegacyBeta(user.sub);
      setIsWhitelisted(whitelisted);
    }
  };
  checkStatus();
}, [user?.sub]);

// Conditionally render content
{isWhitelisted && (
  <div>Legacy Beta Content Available!</div>
)}
``` 