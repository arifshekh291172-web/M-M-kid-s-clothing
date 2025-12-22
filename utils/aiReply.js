const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getAIReply(userMessage) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return "AI service अभी unavailable है। थोड़ी देर बाद try करें।";
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional customer support agent for an e-commerce clothing website."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.5
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Reply Error:", error.message);
    return "AI reply में problem आ रही है, admin जल्दी reply करेगा।";
  }
}

module.exports = getAIReply;
