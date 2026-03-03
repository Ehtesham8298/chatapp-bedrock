import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export const handler = awslambda.streamifyResponse(async (event, responseStream) => {
  const body = JSON.parse(event.body);
  const { messages, systemPrompt } = body;

  // Validate API key
  const apiKey = event.headers?.['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    responseStream.write(JSON.stringify({ error: 'Unauthorized' }));
    responseStream.end();
    return;
  }

  const metadata = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  };

  responseStream = awslambda.HttpResponseStream.from(responseStream, metadata);

  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages,
  };

  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-opus-4-6-v1',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(requestBody),
  });

  try {
    const response = await client.send(command);

    for await (const event of response.body) {
      if (event.chunk?.bytes) {
        const decoded = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
        responseStream.write(`event: ${decoded.type}\ndata: ${JSON.stringify(decoded)}\n\n`);
      }
    }

    responseStream.write('event: done\ndata: [DONE]\n\n');
  } catch (error) {
    responseStream.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
  }

  responseStream.end();
});
