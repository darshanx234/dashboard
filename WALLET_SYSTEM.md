# Wallet System Documentation

## Overview
The wallet system manages user credits for album creation. Users receive 300 credits on signup and can add more credits as needed. Each album creation costs 10 credits.

## Features

### 1. **Automatic Signup Bonus**
- New users automatically receive 300 credits upon signup
- Credits are added to their wallet immediately after account creation

### 2. **Credit Management**
- View current credit balance
- Add credits manually with description
- Track all credit transactions
- Prevent album creation with insufficient credits

### 3. **Transaction History**
- Complete history of all credit movements
- Categorized transactions (signup bonus, manual add, album creation, refund)
- Pagination support for large transaction lists
- Detailed metadata for each transaction

### 4. **Album Creation Integration**
- Automatic credit check before album creation
- Deduct 10 credits per album
- Clear error messages for insufficient credits
- Transaction record with album details

## Database Models

### Wallet Model (`lib/models/Wallet.ts`)
```typescript
{
  userId: ObjectId,          // Reference to User
  balance: Number,           // Current credit balance (min: 0)
  currency: String,          // Default: "CREDITS"
  isActive: Boolean,         // Default: true
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Model (`lib/models/Transaction.ts`)
```typescript
{
  userId: ObjectId,          // Reference to User
  walletId: ObjectId,        // Reference to Wallet
  type: 'credit' | 'debit',  // Transaction type
  amount: Number,            // Transaction amount
  balanceBefore: Number,     // Balance before transaction
  balanceAfter: Number,      // Balance after transaction
  category: String,          // signup_bonus, manual_add, album_creation, refund, other
  description: String,       // Transaction description
  metadata: Object,          // Additional data (albumId, albumTitle, etc.)
  status: String,            // pending, completed, failed, cancelled
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### GET `/api/wallet`
Get user's wallet information
- **Auth**: Required (JWT token in cookie)
- **Response**: 
```json
{
  "success": true,
  "wallet": {
    "id": "...",
    "balance": 300,
    "currency": "CREDITS",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### POST `/api/wallet/add-credits`
Add credits to user's wallet
- **Auth**: Required
- **Body**:
```json
{
  "amount": 100,
  "description": "Credits for wedding shoots"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Credits added successfully",
  "wallet": { "balance": 400 },
  "transaction": { ... }
}
```

### GET `/api/wallet/transactions`
Get transaction history
- **Auth**: Required
- **Query Params**: 
  - `limit` (default: 50)
  - `skip` (default: 0)
- **Response**:
```json
{
  "success": true,
  "transactions": [...],
  "total": 10,
  "hasMore": false
}
```

## UI Components

### WalletCard
Displays wallet balance with visual indicators
```tsx
import { WalletCard } from '@/components/wallet';

<WalletCard 
  onAddCredits={() => setShowDialog(true)}
  onViewTransactions={() => router.push('/wallet')}
/>
```

### TransactionHistory
Shows paginated transaction history
```tsx
import { TransactionHistory } from '@/components/wallet';

<TransactionHistory limit={20} />
```

### AddCreditsDialog
Modal for adding credits
```tsx
import { AddCreditsDialog } from '@/components/wallet';

<AddCreditsDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  onSuccess={() => refreshWallet()}
/>
```

### WalletWidget
Compact widget for navigation bars
```tsx
import { WalletWidget } from '@/components/wallet';

<WalletWidget showAddButton={true} />
```

## Service Layer

### WalletService (`lib/services/wallet.service.ts`)

#### Methods:

**createWallet(params)**
- Creates a new wallet for a user
- Optionally sets initial balance
- Creates transaction record for initial balance

**getWalletByUserId(userId)**
- Retrieves user's wallet
- Returns null if not found

**addCredits(params)**
- Adds credits to wallet
- Uses MongoDB transactions for atomicity
- Creates transaction record

**deductCredits(params)**
- Deducts credits from wallet
- Checks for sufficient balance
- Uses MongoDB transactions
- Creates transaction record

**getTransactionHistory(userId, limit, skip)**
- Retrieves paginated transaction history
- Sorted by creation date (newest first)

**getBalance(userId)**
- Returns current balance
- Returns 0 if wallet not found

**hasSufficientCredits(userId, amount)**
- Checks if user has enough credits
- Returns boolean

## Integration Points

### 1. Signup Flow
File: `app/api/auth/signup/route.ts`
- After user creation, wallet is created with 300 credits
- Signup bonus transaction is recorded

### 2. Album Creation
File: `app/api/albums/route.ts`
- Before creating album, checks for sufficient credits (10 required)
- Returns 402 error if insufficient
- Deducts credits after successful album creation
- Records transaction with album metadata

## Usage Examples

### Check Balance Before Action
```typescript
const hasSufficientCredits = await WalletService.hasSufficientCredits(userId, 10);
if (!hasSufficientCredits) {
  return NextResponse.json(
    { error: 'Insufficient credits' },
    { status: 402 }
  );
}
```

### Add Credits
```typescript
const result = await WalletService.addCredits({
  userId,
  amount: 100,
  category: 'manual_add',
  description: 'Added credits for projects',
});
```

### Deduct Credits
```typescript
const result = await WalletService.deductCredits({
  userId,
  amount: 10,
  category: 'album_creation',
  description: 'Album created: Wedding 2024',
  metadata: {
    albumId: album._id,
    albumTitle: album.title,
  },
});
```

## Credit Costs

| Action | Cost |
|--------|------|
| Signup Bonus | +300 credits |
| Album Creation | -10 credits |
| Manual Add | Variable |

## Error Handling

### Insufficient Credits
- Status Code: 402 (Payment Required)
- Response includes current balance and required amount

### Wallet Not Found
- Status Code: 404
- Suggests creating a wallet

### Transaction Failures
- Uses MongoDB transactions for atomicity
- Automatic rollback on failure
- Detailed error logging

## Future Enhancements

1. **Payment Integration**
   - Integrate with payment gateway
   - Purchase credits with real money

2. **Credit Packages**
   - Predefined credit packages with discounts
   - Bulk purchase options

3. **Referral System**
   - Earn credits by referring new users

4. **Subscription Plans**
   - Monthly credit allowances
   - Unlimited plans

5. **Credit Expiry**
   - Optional expiry dates for credits
   - Notifications before expiry

6. **Analytics**
   - Credit usage analytics
   - Spending patterns
   - Budget alerts

## Testing

### Test Signup Bonus
1. Create a new user account
2. Check wallet balance (should be 300)
3. Verify transaction record exists

### Test Album Creation
1. Create album with sufficient credits
2. Verify credits deducted
3. Check transaction history
4. Try creating album with insufficient credits
5. Verify error message

### Test Add Credits
1. Add credits via dialog
2. Verify balance updated
3. Check transaction record

## Troubleshooting

### Wallet Not Created on Signup
- Check if WalletService.createWallet is called
- Verify MongoDB connection
- Check error logs

### Credits Not Deducted
- Verify album creation API calls deductCredits
- Check for transaction errors
- Ensure MongoDB transactions are supported

### Balance Mismatch
- Verify all credit operations use WalletService
- Check transaction history for discrepancies
- Ensure atomic operations (MongoDB transactions)
