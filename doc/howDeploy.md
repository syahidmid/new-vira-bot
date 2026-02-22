# Clasp Deployment Version Update Guide

## Understanding Deployments vs Versions

In Google Apps Script:
- **Deployment ID**: A unique URL/ID that remains constant (like `AKfycbw...`)
- **Version**: A numbered snapshot of your code (@160, @161, @162, etc.)
- **Active Version**: The version currently running on a deployment
- **Archived Version**: A saved snapshot that's not currently deployed

For Telegram bots and web apps, you want to **keep the same deployment ID** but **update to a new version**.

## Quick Update (Recommended)

Update your existing deployment with new code:

```bash
clasp push
clasp create-deployment -i <deployment-id> -d "Description of changes"
```

**Example:**
```bash
clasp push
clasp create-deployment -i AKfycbwhflnWVAB5RnvzVJWI9kc7iWKBnuFmZM6F0Y3v_eo-JRuZZP1Owpeuu-EqnTSfD2TTdg -d "Fixed bug in message handler"
```

This will:
1. Push your local code changes to Apps Script
2. Create a new version (e.g., @161)
3. Update the existing deployment to use the new version
4. Keep the same deployment URL (no need to update Telegram bot settings)

## Alternative: Specify Version Number

If you want to deploy a specific version:

### Step 1: Create a version
```bash
clasp create-version "Version description"
```

### Step 2: Check the version number
```bash
clasp list-versions
```

### Step 3: Deploy that specific version
```bash
clasp create-deployment --versionNumber 161 --deploymentId <deployment-id>
```

**Example:**
```bash
clasp create-version "v1.3 - Bug fixes"
clasp list-versions
clasp create-deployment --versionNumber 161 --deploymentId AKfycbwhflnWVAB5RnvzVJWI9kc7iWKBnuFmZM6F0Y3v_eo-JRuZZP1Owpeuu-EqnTSfD2TTdg
```

## List Your Deployments

To see all your deployments and current versions:

```bash
clasp list-deployments
```

**Example output:**
```
- AKfycbw9T0qz0hPSx8VecEACvXiI3GpYMssNEGaUCY35hFI5 @HEAD 
- AKfycbwhflnWVAB5RnvzVJWI9kc7iWKBnuFmZM6F0Y3v_eo-JRuZZP1Owpeuu-EqnTSfD2TTdg @160
```

## Common Mistakes to Avoid

### ❌ Don't do this:
```bash
clasp deploy  # Creates a NEW deployment with a NEW ID
```
This creates a new deployment ID, requiring you to update your Telegram bot configuration.

### ❌ Don't do this:
```bash
clasp create-version "Description"  # Only creates archived version
```
This only creates an archived version without deploying it - Telegram won't see the update.

### ✅ Do this instead:
```bash
clasp push
clasp create-deployment -i <existing-deployment-id> -d "Description"
```
This updates your existing deployment with a new version.

## Complete Workflow Example

```bash
# 1. Make your code changes locally
# ... edit your files ...

# 2. Push changes to Apps Script
clasp push

# 3. Update your deployment (creates new version automatically)
clasp create-deployment -i AKfycbwhflnWVAB5RnvzVJWI9kc7iWKBnuFmZM6F0Y3v_eo-JRuZZP1Owpeuu-EqnTSfD2TTdg -d "v1.4 - Added new features"

# 4. Verify the update
clasp list-deployments
```

## Helpful Commands

| Command | Description |
|---------|-------------|
| `clasp list-deployments` | List all deployments and their versions |
| `clasp list-versions` | List all saved versions |
| `clasp create-version "desc"` | Create an archived version |
| `clasp create-deployment -i <id> -d "desc"` | Update existing deployment with new version |
| `clasp push` | Push local code to Apps Script |

## Tips

- Always use `clasp push` before deploying to ensure your latest code is uploaded
- Use descriptive version descriptions to track changes
- Keep your deployment ID consistent for production bots
- The `-i` flag is shorthand for `--deploymentId`
- The `-d` flag is shorthand for `--description`