# Environment Configuration

## Available Environments

- **local.bru** - Local development (contains actual API key)
- **test.bru** - Test environment (set your test API key in Bruno UI)
- **production.bru.example** - Production template (copy to production.bru and set API key)

## Setup Instructions

1. **For Production Use:**
   ```bash
   cp production.bru.example production.bru
   ```
   Then open in Bruno and set your production API key in the `vars:secret [apiKey]` section.

2. **API Key Configuration:**
   - Open Bruno
   - Select the desired environment
   - Click on the environment variables section
   - Set your API key value for `apiKey`
   - The `apiKey` is marked as secret and will be encrypted

## Security Notes

- `production.bru` is listed in `.gitignore` and will not be committed
- API keys are stored as secret variables in Bruno
- Never commit actual API keys to version control