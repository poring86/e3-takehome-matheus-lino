import { db } from "@/lib/db";
import { users, orgMembers, organizations } from "@/drizzle/schema";
import { eq } from "drizzle-orm";


async function main() {
  try {
    console.log("Starting user and organization verification...");
    const allUsers = await db.select().from(users);
    console.log(`Total users found: ${allUsers.length}`);
    for (const user of allUsers) {
      try {
        const memberships = await db
          .select({ orgId: orgMembers.orgId })
          .from(orgMembers)
          .where(eq(orgMembers.userId, user.id));
        if (memberships.length === 0) {
          console.log(`${user.email} is NOT in any organization!`);
        } else {
          const orgs = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, memberships[0].orgId));
          console.log(`${user.email} is in: ${orgs.map(o => o.name).join(", ")}`);
        }
      } catch (userErr) {
        console.error(`Error checking user ${user.email}:`, userErr);
      }
    }
    console.log("Verification completed.");
    process.exit(0);
  } catch (err) {
    console.error("General error running the script:", err);
    process.exit(1);
  }
}

main();
