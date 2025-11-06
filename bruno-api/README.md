# 88code Smart Reset API Collection

A production-ready Bruno API collection for the 88code Smart Reset service with intelligent business logic and secure credential management.

## Quick Start (3 steps)

1. **Load Collection**: Open Bruno desktop app → Load collection from `bruno-api/` directory
2. **Set API Key**: Select `local` environment → Edit → Set your 88code API key in the `apiKey` field
3. **Test Connection**: Run `01-connection/test-connection.bru` to verify setup

## Collection Structure

```
bruno-api/
├── 01-connection/
│   └── test-connection.bru     # Test API connection and get usage info
├── 02-subscriptions/
│   ├── get-subscriptions.bru   # Get all subscriptions
│   └── auto-reset-credits.bru  # Smart credit reset with business logic
├── environments/
│   ├── local.bru               # Development environment
│   ├── test.bru                # Test environment
│   ├── production.bru.example  # Production template
│   └── README.md               # Environment setup guide
├── bruno.json                  # Collection metadata
├── collection.bru              # Collection configuration
└── README.md                   # This file
```

## API Endpoints

### 1. Test Connection
- **File**: `01-connection/test-connection.bru`
- **Method**: POST `/api/usage`
- **Purpose**: Verify API key and get usage statistics
- **Usage**: Start here to confirm your setup works

### 2. Get Subscriptions
- **File**: `02-subscriptions/get-subscriptions.bru`
- **Method**: POST `/api/subscription`
- **Purpose**: Retrieve all account subscriptions with details
- **Usage**: Check available subscriptions and their status

### 3. Auto Reset Credits ⭐
- **File**: `02-subscriptions/auto-reset-credits.bru`
- **Method**: POST `/api/reset-credits/{subscriptionId}`
- **Purpose**: Intelligent credit reset with business logic
- **Features**:
  - **Automatic Selection**: Finds eligible subscriptions automatically
  - **PAYGO Protection**: Never resets PAYGO subscriptions (prevents charges)
  - **Smart Filtering**: Only selects MONTHLY + active subscriptions
  - **Reset Validation**: Requires resetTimes >= 1
  - **Cooldown Period**: 5-hour minimum between resets
  - **Error Handling**: Clear messages for no eligible subscriptions

## Authentication

- **Type**: Direct API Key (no Bearer prefix)
- **Header**: `Authorization: <your-api-key>`
- **Setup**: Set your API key in the `local` environment's `apiKey` field

## Business Logic (Auto Reset)

The `auto-reset-credits.bru` endpoint includes sophisticated business logic:

### Selection Criteria
1. **Protection Rule**: Skip all PAYGO subscriptions
2. **Status Filter**: Only MONTHLY billing + active status
3. **Reset Availability**: Must have resetTimes >= 1
4. **Cooldown Enforcement**: 5 hours since last reset
5. **Selection**: First eligible subscription from filtered results

### Example Script Flow
```javascript
// 1. Fetch all subscriptions
// 2. Apply business filters
// 3. Log selection process
// 4. Set subscriptionId runtime variable
// 5. Execute reset request
```

## Environment Setup

### Local Development (Recommended)
- File: `environments/local.bru`
- Contains: baseUrl + secret apiKey
- Safe to commit: Yes (secrets are encrypted)

### Setting Your API Key
1. Select `local` environment in Bruno
2. Click environment settings (3 dots) → Edit
3. Enter your API key in the `apiKey` field
4. Save and test with `test-connection.bru`

## Testing and Validation

Each request includes comprehensive tests:
- Status code validation (200)
- Content-Type verification (application/json)
- Response structure validation
- Business logic assertions

## Usage Examples

### Basic Testing
```bash
# Load collection in Bruno
# Set API key in local environment
# Run: 01-connection/test-connection.bru
```

### Check Subscriptions
```bash
# Run: 02-subscriptions/get-subscriptions.bru
# Review available subscriptions
```

### Smart Credit Reset
```bash
# Run: 02-subscriptions/auto-reset-credits.bru
# Script automatically finds eligible subscription
# Check console for selection details
```

## Security Features

- **Secret Management**: API keys stored in `vars:secret []` (encrypted)
- **Git Safety**: Environment files safe to commit (no plaintext secrets)
- **PAYGO Protection**: Business logic prevents accidental charges
- **Validation**: Comprehensive input validation and error handling

## Troubleshooting

### Common Issues

**"No eligible subscriptions found"**
- Check that you have MONTHLY subscriptions (not PAYGO)
- Verify subscriptions are active
- Ensure resetTimes >= 1
- Wait 5 hours between resets

**"Authentication failed"**
- Verify API key is correct in environment settings
- Check key has required permissions
- Test with `test-connection.bru` first

**"fetch is not defined"**
- Not applicable - this collection uses `require('axios')`
- Bruno's sandbox environment properly configured

### Debug Tips

1. Check Bruno console for script execution logs
2. Run `get-subscriptions.bru` to inspect available data
3. Verify business logic criteria match your subscription types
4. Test with `test-connection.bru` before complex operations

## Development Notes

- **Bruno Version**: Compatible with Bruno 1.0+
- **Dependencies**: Uses built-in axios module
- **Error Handling**: Comprehensive with user-friendly messages
- **Logging**: Detailed console output for debugging
- **Security**: Follows Bruno security best practices

## Support

For issues with:
- **API functionality**: Contact 88code support
- **Collection setup**: Check this README and Bruno documentation
- **Business logic**: Review the script comments in `auto-reset-credits.bru`

---

**Version**: 1.0.0
**Updated**: 2025-01-21
**Compatible**: Bruno 1.0+