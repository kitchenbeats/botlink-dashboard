# ReactWrite AI Coding Agent Template

A comprehensive E2B sandbox template for ReactWrite with support for **all major AI providers**.

## Features

### AI Providers (Node.js & Python SDKs)
- **Claude (Anthropic)** - `@anthropic-ai/claude-code` CLI + SDKs
- **OpenAI** - GPT-4, GPT-4 Turbo, o1 models
- **Google Gemini** - Gemini 1.5 Pro, Gemini 2.0
- **Mistral AI** - Codestral and other Mistral models

### Development Environment
- **Node.js 24** - Latest LTS version with npm
- **TypeScript** - Full TypeScript support with tsx for execution
- **Python 3** - Python runtime with pip
- **Development Tools** - git, vim, nano, curl, jq
- **Popular Frameworks** - Next.js, Vite, nodemon pre-installed

### Python AI/ML Libraries
- `anthropic` - Anthropic Python SDK
- `openai` - OpenAI Python SDK
- `google-generativeai` - Google Gemini SDK
- `mistralai` - Mistral AI SDK
- `httpx` - Modern HTTP client for Python
- `pytest` - Testing framework

## Usage

This template is used by ReactWrite projects to provide a rich coding environment where users can:
- **Choose any AI provider** - Claude, OpenAI, Gemini, or Mistral
- **Switch providers on-the-fly** - Compare outputs or use different models for different tasks
- Run terminal commands
- Execute code in Node.js or Python
- Build full-stack applications
- Use version control with git

## Building the Template

To build and deploy this template to your E2B infrastructure:

```bash
# Navigate to template directory
cd e2b-templates/ai-coding-agent

# Build and push (requires E2B CLI configured)
e2b template build --name reactwrite-ai-coding
```

## Environment Variables

When creating sandboxes with this template, you can provide any/all of these API keys:

- `ANTHROPIC_API_KEY` - For Claude Code CLI and Anthropic SDK
- `OPENAI_API_KEY` - For OpenAI GPT models
- `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY` - For Google Gemini
- `MISTRAL_API_KEY` - For Mistral AI models
- `NODE_ENV` - Already set to 'development'

## Example Usage in Code

### Node.js
```javascript
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use any provider
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
```

### Python
```python
import anthropic
import openai
import google.generativeai as genai

# Use any provider
claude = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
openai.api_key = os.environ.get("OPENAI_API_KEY")
genai.configure(api_key=os.environ.get("GOOGLE_AI_API_KEY"))
```

## Template ID

After building, note the template ID for use in ReactWrite configuration.
