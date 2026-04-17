/** Demo server action disabled — page removed for security (was unauthenticated). */
"use server";

export type CreateCommentState = { error?: string; ok?: boolean };

export async function create(
  _prev: CreateCommentState | undefined,
  _formData: FormData,
): Promise<CreateCommentState> {
  return { error: "This page has been removed." };
}
