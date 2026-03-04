const {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} = require('@aws-sdk/client-bedrock-runtime');

const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
};

// Use explicit credentials from .env to avoid AWS_PROFILE override
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

console.log('Bedrock config:', {
  region: clientConfig.region,
  modelId: process.env.BEDROCK_MODEL_ID,
  hasExplicitCreds: !!clientConfig.credentials,
});

const client = new BedrockRuntimeClient(clientConfig);

async function streamChatCompletion(messages, systemPrompt, onChunk, modelId) {
  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages: messages,
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: modelId || process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-6',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(requestBody),
  });

  const start = Date.now();
  console.log('Sending to Bedrock...');
  const response = await client.send(command);
  console.log('Bedrock responded in', Date.now() - start, 'ms');

  for await (const event of response.body) {
    if (event.chunk?.bytes) {
      const decoded = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
      onChunk(decoded.type, decoded);
    }
  }
  console.log('Stream finished in', Date.now() - start, 'ms');
}

module.exports = { streamChatCompletion };
