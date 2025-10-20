# E2B Webhook Setup Guide

This guide explains how to configure webhooks to receive sandbox lifecycle events from your self-hosted E2B infrastructure.

## Overview

The webhook endpoint at `/api/webhooks/e2b` receives events when sandboxes are:
- Created
- Killed (stopped/destroyed)
- Paused
- Resumed

This keeps our database records accurate and ensures sandboxes are properly cleaned up.

## 1. Configure the Webhook Secret

### Generate a Strong Secret

```bash
# Generate a secure random string
openssl rand -hex 32
```

### Add to Environment Variables

Add the generated secret to your `.env` file:

```bash
E2B_WEBHOOK_SECRET=your_generated_secret_here
```

## 2. Get Your Webhook URL

Your webhook endpoint will be:

```
https://your-domain.com/api/webhooks/e2b
```

For development:
```
http://localhost:3000/api/webhooks/e2b
```

**Note**: For local development, you'll need to use a tunnel service like ngrok to expose your localhost to the E2B infrastructure:

```bash
ngrok http 3000
# Use the ngrok URL: https://abc123.ngrok.io/api/webhooks/e2b
```

## 3. Configure E2B Infrastructure

### Option A: Environment Variables (Recommended)

If your E2B orchestrator supports webhook configuration via environment variables, add these to your orchestrator job:

1. Edit `/e2b-infra/iac/provider-gcp/nomad/jobs/orchestrator.hcl`

2. Add webhook configuration to the `env` block:

```hcl
env {
  # ... existing env vars ...
  WEBHOOK_URL    = "${webhook_url}"
  WEBHOOK_SECRET = "${webhook_secret}"
}
```

3. Update your Terraform variables (e.g., `terraform.tfvars`):

```hcl
webhook_url    = "https://your-domain.com/api/webhooks/e2b"
webhook_secret = "your_generated_secret_here"
```

4. Apply the changes:

```bash
cd /path/to/e2b-infra/iac/provider-gcp
terraform plan
terraform apply
```

### Option B: Direct Configuration

If webhook support needs to be added to the E2B orchestrator source code:

1. The orchestrator code needs to be modified to send HTTP POST requests to the webhook URL when sandbox lifecycle events occur.

2. The request should include:
   - Header: `X-E2B-Signature: <hmac-sha256-signature>`
   - Body: JSON payload with event details

Example payload structure:
```json
{
  "eventCategory": "sandbox",
  "eventLabel": "kill",
  "sandboxId": "sbx_abc123",
  "sandboxTeamId": "team_xyz",
  "timestamp": "2025-10-15T12:00:00Z"
}
```

Signature generation (pseudo-code):
```javascript
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex')
```

## 4. Webhook Security

The webhook endpoint verifies requests using HMAC-SHA256 signatures:

1. **Request must include `X-E2B-Signature` header** with the HMAC signature
2. **Signature is computed** using the webhook secret and raw request body
3. **Request is rejected** if signature doesn't match

This ensures only your E2B infrastructure can send valid webhook events.

## 5. Testing the Webhook

### Manual Test

You can test the webhook endpoint manually:

```bash
# Generate test payload
PAYLOAD='{"eventCategory":"sandbox","eventLabel":"kill","sandboxId":"test-123","sandboxTeamId":"team-test","timestamp":"2025-10-15T12:00:00Z"}'

# Generate signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "your_webhook_secret" | cut -d' ' -f2)

# Send request
curl -X POST https://your-domain.com/api/webhooks/e2b \
  -H "Content-Type: application/json" \
  -H "X-E2B-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

Expected response:
```json
{"success": true}
```

## 6. Monitoring

Check your application logs for webhook events:

```bash
# Successful events
[E2B Webhook] Received event: { eventLabel: 'kill', sandboxId: '...' }
[E2B Webhook] Signature verified
[E2B Webhook] Verified sandbox is removed: sbx_abc123
[E2B Webhook] Updated sandbox status to stopped: sbx_abc123

# Security issues
[E2B Webhook] Missing signature header
[E2B Webhook] Invalid signature

# Errors
[E2B Webhook] Invalid payload: ...
[E2B Webhook] Sandbox not found in DB: ...
```

## How It Works

1. **Sandbox Timeout**: Sandboxes have a 30-minute rolling timeout
2. **User Activity**: Timeout resets on file save, chat, workspace load
3. **Auto-Kill**: After 30 minutes of inactivity, E2B kills the sandbox
4. **Webhook Sent**: E2B sends a "kill" event to our webhook endpoint
5. **Verification**: We attempt to connect to verify it's actually removed
6. **Database Update**: We mark the sandbox as stopped in our database
7. **Clean Records**: Our DB accurately reflects the actual infrastructure state

## Troubleshooting

### Webhook Not Receiving Events

1. Check E2B orchestrator logs for webhook errors
2. Verify the webhook URL is correct
3. Ensure the webhook endpoint is publicly accessible
4. Check firewall rules

### Signature Verification Failing

1. Ensure `E2B_WEBHOOK_SECRET` matches in both E2B infrastructure and dashboard
2. Verify the signature is computed on the raw request body (not parsed JSON)
3. Check for whitespace or encoding issues

### Sandbox Not Found Errors

This is normal for sandboxes that weren't created by the dashboard (e.g., direct E2B SDK usage). The webhook safely logs a warning and continues.

## Next Steps

Once webhooks are configured:

1. Monitor logs to ensure events are being received
2. Test the full lifecycle: create sandbox → wait 30 min → verify it's killed and DB updated
3. Consider adding webhook event logging to a dedicated table for audit purposes
