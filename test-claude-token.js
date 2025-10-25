#!/usr/bin/env node

/**
 * Test script to verify Claude session token works with SDK authToken parameter
 */

const Anthropic = require('@anthropic-ai/sdk');

const token = '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';

console.log('Testing Claude token with SDK authToken parameter...\n');

// Test with authToken parameter (uses Authorization: Bearer header)
console.log('Creating Anthropic client with authToken parameter...');
const anthropic = new Anthropic({ authToken: token });

console.log('Sending test message...');
anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 50,
  messages: [{ role: 'user', content: 'Say "Hello from session token!"' }]
})
.then(response => {
  console.log('\n✅ SUCCESS! Response:', JSON.stringify(response, null, 2));
})
.catch(err => {
  console.error('\n❌ ERROR:', err.message);
  console.error('Status:', err.status);
  console.error('Error type:', err.error?.type);
});
