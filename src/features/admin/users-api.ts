import { FunctionsHttpError } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/content";

export interface ManagedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  updatedAt: string | null;
  confirmedAt: string | null;
  invitedAt: string | null;
  lastSignInAt: string | null;
}
export interface UsersResponse { users: ManagedUser[]; actorId: string; hasMore: boolean }

export async function usersRequest<T>(body: Record<string, unknown>): Promise<T> {
  const client = createSupabaseBrowserClient();
  if (!client) throw new Error("Supabase não configurado.");
  const { data, error } = await client.functions.invoke<T>("admin-users", { body });
  if (error instanceof FunctionsHttpError) {
    const result = await error.context.json().catch(() => null);
    throw new Error(typeof result?.error === "string" ? result.error : "Não foi possível concluir. Entre novamente e tente outra vez.");
  }
  if (error || !data) throw new Error("Não foi possível acessar a gestão de usuários. Verifique a conexão e a implantação da função admin-users.");
  return data;
}

