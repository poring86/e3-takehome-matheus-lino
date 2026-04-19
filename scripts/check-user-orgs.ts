import { db } from "@/lib/db";
import { users, orgMembers, organizations } from "@/drizzle/schema";


async function main() {
  try {
    console.log("Iniciando verificação de usuários e organizações...");
    const allUsers = await db.select().from(users);
    console.log(`Total de usuários encontrados: ${allUsers.length}`);
    for (const user of allUsers) {
      try {
        const memberships = await db
          .select({ orgId: orgMembers.orgId })
          .from(orgMembers)
          .where(orgMembers.userId.eq(user.id));
        if (memberships.length === 0) {
          console.log(`${user.email} NÃO está em nenhuma organização!`);
        } else {
          const orgs = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(organizations.id.eq(memberships[0].orgId));
          console.log(`${user.email} está em: ${orgs.map(o => o.name).join(", ")}`);
        }
      } catch (userErr) {
        console.error(`Erro ao verificar usuário ${user.email}:`, userErr);
      }
    }
    console.log("Verificação concluída.");
    process.exit(0);
  } catch (err) {
    console.error("Erro geral na execução do script:", err);
    process.exit(1);
  }
}

main();
