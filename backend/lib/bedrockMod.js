// Bedrock moderation using Claude
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const BEDROCK_MOCK = process.env.BEDROCK_MOCK !== 'false';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20240620-v1:0';
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';

async function bedrockMod(text, approvedQuestions = []) {
  if (BEDROCK_MOCK) {
    // Mock stub for local dev
    return { safe: true, quality: 'high', groupId: null };
  }

  const client = new BedrockRuntimeClient({ region: AWS_REGION });

  const prompt = `You are a moderation assistant for a Q&A seminar.
Existing approved questions: ${JSON.stringify(approvedQuestions.slice(-10))}

Evaluate this new question: "${text}"

Rules:
1. Is it safe (no profanity, hate speech, or off-topic spam)?
2. Is it high quality (well-formed, relevant)?
3. Does it semantically match any existing question above 80%? If yes, provide the ID of that question as groupId.

Reply ONLY with a JSON object:
{ "safe": boolean, "quality": "high"|"low", "groupId": "uuid"|null }`;

  const input = {
    modelId: BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  };

  try {
    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract the JSON from the assistant's response - handle potential extra text
    let resultText = responseBody.content[0].text.trim();
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      resultText = jsonMatch[0];
    }
    
    return JSON.parse(resultText);
  } catch (error) {
    console.error('Bedrock Moderation Error:', error);
    // Fallback to safe but low quality if AI fails
    return { safe: true, quality: 'low', groupId: null };
  }
}

module.exports = bedrockMod;
