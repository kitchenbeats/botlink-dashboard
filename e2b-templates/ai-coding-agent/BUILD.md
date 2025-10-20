# Building and Deploying the ReactWrite AI Coding Template (DEPRECIATED)

This guide explains how to build and deploy the AI coding agent template to your self-hosted E2B infrastructure.

## Prerequisites

- Access to ReactWrite Dashboard at `https://yourdomain.com/dashboard`
- Team with template creation permissions
- E2B API key for your team

## Using E2B CLI (if available for self-hosted)

```bash
# Navigate to template directory
cd e2b-templates/ai-coding-agent

# Set API domain for self-hosted
export E2B_DOMAIN=ledgai.com
export E2B_API_KEY="your_api_key"

# Build template
e2b template build

# Or with explicit name
e2b template build --name reactwrite-ai-coding
```

## Updating ReactWrite to Use the Template

After building the template, update ReactWrite configuration:

1. Note the **Template ID** from the build output (e.g., `env_abc123...`)

2. Update environment variable in `.env.local`:
   ```bash
   E2B_TEMPLATE_ID=env_abc123...
   # or
   E2B_TEMPLATE_ALIAS=reactwrite-ai-coding
   ```

3. Update code to use the template when creating sandboxes:
   ```typescript
   const sandbox = await Sandbox.create('reactwrite-ai-coding', {
     envs: {
       ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
       OPENAI_API_KEY: process.env.OPENAI_API_KEY,
       GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
       MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
     }
   });
   ```

## Verifying the Build

After the template is built, verify it includes all dependencies:

```bash
Streaming command output

To stream command output as it is being executed, pass the onStdout, onStderr callbacks to the commands.run() method in JavaScript or the on_stdout, on_stderr callbacks to the commands.run() method in Python.

JavaScript & TypeScript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()
const result = await sandbox.commands.run('echo hello; sleep 1; echo world', {
  onStdout: (data) => {
    console.log(data)
  },
  onStderr: (data) => {
    console.log(data)
  },
})
console.log(result)
```

## Troubleshooting

### Build Fails
- Check Dockerfile syntax
- Ensure base image (node:24) is accessible
- Check build logs in the E2B dashboard

### Template Not Found
- Verify template ID is correct
- Check team has access to the template
- Ensure template build completed successfully

### Missing Dependencies
- Review build logs to see if npm/pip install failed
- May need to increase disk size if running out of space during build
- Check for network issues pulling packages

## Next Steps

Once the template is built and deployed:

1. Update ReactWrite workspace to use the new template
2. Test creating projects with different AI providers
3. Verify all AI SDKs work correctly in sandboxes
4. Monitor template usage and performance
