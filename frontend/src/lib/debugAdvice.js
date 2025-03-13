import Groq from "groq-sdk";

const groq = new Groq({ apiKey: `${import.meta.env.VITE_GROQ_API_KEY}`, dangerouslyAllowBrowser:true });


export async function debugAdvice(description) {
  try {
    const chatCompletion = await getGroqChatCompletion(description);

    const advice = chatCompletion.choices[0]?.message?.content || "No advice provided";
    console.log(advice);

    return advice;
  } catch (error) {
    console.error("Error fetching financial advice:", error);
    return "Sorry, I couldn't fetch the financial advice at this moment.";
  }
}

export async function getGroqChatCompletion(description) {
  try {
    return await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Guide a developer in solving this technical problem step by step: ${description}`,
        },
      ],
      model: "llama3-8b-8192", 
    });
  } catch (error) {
    console.error("Error fetching chat completion from Groq:", error);
    throw error;
  }
}