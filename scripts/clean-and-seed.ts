import "dotenv/config";
import { db } from "@/lib/db";
import { supabaseAdmin } from "./supabase-admin";
import {
  users,
  organizations,
  orgMembers,
  notes,
  noteVersions,
  tags,
  noteTags,
  noteShares,
  files,
} from "@/drizzle/schema";

async function cleanDatabase() {
  // Limpa tabelas do banco na ordem correta para evitar violação de FK
  // Repete deleção de tabelas filhas para garantir remoção de registros órfãos
  await db.delete(noteTags);
  await db.delete(noteShares);
  await db.delete(noteVersions);
  await db.delete(noteTags);
  await db.delete(noteShares);
  await db.delete(noteVersions);
  await db.delete(noteTags);
  await db.delete(noteShares);
  await db.delete(noteVersions);
  await db.delete(notes);
  await db.delete(files);
  await db.delete(tags);
  await db.delete(orgMembers);
  await db.delete(users);
  await db.delete(organizations);
}

async function cleanSupabaseAuth() {
  // Fetch all users from Supabase Auth using page-based pagination.
  let nextPage: number | undefined = 1;
  do {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: nextPage,
    });
    if (error) {
      console.error("Failed to list Supabase Auth users", error);
      break;
    }
    for (const user of data.users) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
    nextPage = data.nextPage ?? undefined;
  } while (nextPage !== undefined);
}

async function main() {
  console.log("Cleaning database and Supabase Auth...");
  await cleanDatabase();
  await cleanSupabaseAuth();
  console.log("Running seed...");
  await import("./seed");
}

main().catch((err) => {
  console.error("Failed to clean and seed:", err);
  process.exit(1);
});
