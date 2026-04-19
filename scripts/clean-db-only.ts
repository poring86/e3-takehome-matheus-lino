import "dotenv/config";
import { db } from "@/lib/db";
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
  // Limpa apenas as tabelas de app, sem mexer em policies ou Auth
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

async function main() {
  console.log("Limpando apenas as tabelas do app (sem mexer em Auth ou policies)...");
  await cleanDatabase();
  console.log("Limpeza concluída. Rode o seed normalmente agora.");
}

main().catch((err) => {
  console.error("Erro ao limpar o banco:", err);
  process.exit(1);
});
