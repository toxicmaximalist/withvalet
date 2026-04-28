import { redirect } from "next/navigation";

export function buildPathWithMessage(
  path: string,
  type: "error" | "success",
  message: string,
) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(type, message);

  return `${url.pathname}${url.search}`;
}

export function redirectWithMessage(
  path: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(buildPathWithMessage(path, type, message));
}

export function getMessageValue(
  input: string | string[] | undefined,
) {
  return Array.isArray(input) ? input[0] : input;
}
