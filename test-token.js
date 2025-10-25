const Anthropic = require('@anthropic-ai/sdk');

const token = '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';

console.log('Testing with authToken parameter...\n');

const anthropic = new Anthropic({ authToken: token });

anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 50,
  messages: [{ role: 'user', content: 'Say hello!' }]
})
.then(response => {
  console.log('✅ SUCCESS!');
  console.log(JSON.stringify(response, null, 2));
})
.catch(err => {
  console.error('❌ ERROR:', err.message);
  console.error('Type:', err.error?.type);
});
