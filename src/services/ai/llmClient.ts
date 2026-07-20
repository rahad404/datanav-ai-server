import { env } from "../../config/env";

/**
 * Minimal provider-agnostic LLM wrapper. Swap the implementation for
 * whichever provider you choose (OpenAI, Gemini, Groq, Together, Ollama...).
 * Everything else in the app just calls chatComplete(messages).
 */

export interface ChatMsg {
   role: "system" | "user" | "assistant";
   content: string;
}

export async function chatComplete(messages: ChatMsg[], opts?: { json?: boolean }): Promise<string> {
   // Example implementation for an OpenAI-compatible endpoint.
   // Groq / Together / Ollama all expose OpenAI-compatible /chat/completions APIs,
   // so only the base URL + model name typically need to change.
   const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${env.LLM_API_KEY}`,
      },
      body: JSON.stringify({
         model: env.LLM_MODEL,
         messages,
         temperature: 0.3,
         ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
      }),
   });

   if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM request failed: ${res.status} ${errText}`);
   }

   const data = await res.json();
   return data.choices[0].message.content as string;
}
