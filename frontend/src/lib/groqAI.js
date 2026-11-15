import { apiRequest } from "./api";

export async function debugAdvice(projectId, bugId) {
  const result = await apiRequest("/ai/debug-advice", {
    method: "POST",
    body: { projectId: Number(projectId), bugId: Number(bugId) },
  });

  if (!result?.advice) throw new Error("The AI did not return advice.");
  return result.advice;
}