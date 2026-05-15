const {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} = require('@aws-sdk/client-bedrock-runtime');

const clientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

console.log('Bedrock config:', {
  region: clientConfig.region,
  modelId: process.env.BEDROCK_MODEL_ID,
  hasCredentials: !!process.env.AWS_ACCESS_KEY_ID,
});

const client = new BedrockRuntimeClient(clientConfig);

async function streamChatCompletion(messages, systemPrompt, onChunk, modelId) {
  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages,
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

  const response = await client.send(command);

  for await (const event of response.body) {
    if (event.chunk?.bytes) {
      const decoded = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
      onChunk(decoded.type, decoded);
    }
  }
}

module.exports = { streamChatCompletion };
