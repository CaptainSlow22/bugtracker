import { apiRequest } from "./api";

export async function debugAdvice(description) {
  const result = await apiRequest("/ai/debug-advice", {
    method: "POST",
    body: { description },
  });

  if (!result?.advice) throw new Error("The AI did not return advice.");
  return result.advice;
}