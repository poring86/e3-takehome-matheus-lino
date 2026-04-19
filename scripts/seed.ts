import { db } from "@/lib/db";
import { supabaseAdmin } from "./supabase-admin";
import {
  organizations,
  users,
  orgMembers,
  notes,
  noteVersions,
  tags,
  noteTags,
  noteShares,
  files,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
// import { randomUUID } from "node:crypto"; // Removido: não utilizado

const SAMPLE_CONTENT = [
  "This is a sample note about project planning. We need to discuss the timeline and assign responsibilities to team members.",
  "Meeting notes from today's standup. Key points: API performance improved by 20%, new feature deployment scheduled for Friday.",
  "Research findings on user behavior patterns. Most users prefer dark mode, and mobile usage has increased by 35% this quarter.",
  "Bug report: Login form validation fails when password contains special characters. Need to update regex pattern.",
  "Product roadmap for Q2. Focus on AI features, improved search, and mobile app enhancements.",
  "Code review feedback: Need better error handling in the authentication module. Consider adding retry logic.",
  "User interview insights: Customers want more customization options and better integration with third-party tools.",
  "Performance optimization results: Database queries reduced by 40% after adding proper indexing.",
  "Security audit findings: Need to implement rate limiting on API endpoints and add CSRF protection.",
  "Design system updates: New color palette and typography scale implemented across all components.",
];

const SAMPLE_TAGS = [
  "meeting",
  "bug",
  "feature",
  "research",
  "planning",
  "review",
  "security",
  "performance",
  "design",
  "api",
  "frontend",
  "backend",
  "mobile",
  "web",
  "testing",
  "deployment",
  "documentation",
  "analytics",
  "support",
  "sales",
];


async function seedDatabase() {
  const roles = ["owner", "admin", "member"] as const;
  const visibilities = ["public", "private", "shared"] as const;
  const DEFAULT_PASSWORD = "Temp@12345678";

  console.log("Starting database seeding...");

  try {
    // Create sample organizations
    const orgs = [];
    for (let i = 1; i <= 5; i++) {
      const [org] = await db
        .insert(organizations)
        .values({
          name: `Organization ${i}`,
        })
        .returning();
      orgs.push(org);
    }
    console.log(`Created ${orgs.length} organizations`);

    // Create sample users in Supabase Auth and DB
    const sampleUsers = [];
    for (let i = 1; i <= 20; i++) {
      const email = `user${i}@example.com`;
      // Cria usuário no Supabase Auth
      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
        });
      if (authError) {
        console.error(
          `Erro ao criar usuário no Supabase Auth: ${email}`,
          authError,
        );
        continue;
      }
      // Cria usuário na tabela users
      const [user] = await db
        .insert(users)
        .values({
          id: authUser.user.id,
          email,
          fullName: `User ${i}`,
        })
        .returning();
      sampleUsers.push(user);
    }
    console.log(`Created ${sampleUsers.length} users (Auth + DB)`);

    // Add users to organizations with roles (aleatório)
    for (const org of orgs) {
      const orgUsers = sampleUsers.slice(0, Math.floor(Math.random() * 8) + 3); // 3-10 users per org
      for (const user of orgUsers) {
        const role = roles[Math.floor(Math.random() * roles.length)];
        await db.insert(orgMembers).values({
          orgId: org.id,
          userId: user.id,
          role,
        });
      }
    }
    // Garante que todo usuário está em pelo menos uma organização
    for (const user of sampleUsers) {
      const memberships = await db
        .select()
        .from(orgMembers)
        .where(eq(orgMembers.userId, user.id));
      if (memberships.length === 0) {
        // Adiciona à Organization 1 como member
        await db.insert(orgMembers).values({
          orgId: orgs[0].id,
          userId: user.id,
          role: "member",
        });
      }
    }
    console.log(
      "Garantido que todos os usuários estão em pelo menos uma organização",
    );

    // Garante que cada usuário tenha uma nota privada, uma pública e uma compartilhada
    for (const user of sampleUsers) {
      // Busca uma organização do usuário
      const memberships = await db
        .select()
        .from(orgMembers)
        .where(eq(orgMembers.userId, user.id));
      if (memberships.length > 0) {
        const orgId = memberships[0].orgId;
        // Nota privada
        const contentPriv = SAMPLE_CONTENT[Math.floor(Math.random() * SAMPLE_CONTENT.length)];
        const [notePriv] = await db
          .insert(notes)
          .values({
            orgId,
            title: `Private note for ${user.email}`,
            content: contentPriv,
            visibility: "private",
            createdBy: user.id,
          })
          .returning();
        await db.insert(noteVersions).values({
          noteId: notePriv.id,
          version: 1,
          content: contentPriv,
        });
        // Nota pública
        const contentPub = SAMPLE_CONTENT[Math.floor(Math.random() * SAMPLE_CONTENT.length)];
        const [notePub] = await db
          .insert(notes)
          .values({
            orgId,
            title: `Public note for ${user.email}`,
            content: contentPub,
            visibility: "public",
            createdBy: user.id,
          })
          .returning();
        await db.insert(noteVersions).values({
          noteId: notePub.id,
          version: 1,
          content: contentPub,
        });
        // Nota compartilhada
        const contentShared = SAMPLE_CONTENT[Math.floor(Math.random() * SAMPLE_CONTENT.length)];
        const [noteShared] = await db
          .insert(notes)
          .values({
            orgId,
            title: `Shared note for ${user.email}`,
            content: contentShared,
            visibility: "shared",
            createdBy: user.id,
          })
          .returning();
        await db.insert(noteVersions).values({
          noteId: noteShared.id,
          version: 1,
          content: contentShared,
        });
        // Compartilha com outro membro aleatório da mesma organização
        const otherMembers = memberships.filter(m => m.userId !== user.id);
        if (otherMembers.length > 0) {
          const shareWith = otherMembers[Math.floor(Math.random() * otherMembers.length)];
          await db.insert(noteShares).values({
            noteId: noteShared.id,
            userId: shareWith.userId,
          });
        }
      }
    }
    console.log("Garantido que cada usuário tenha nota privada, pública e compartilhada");

    // Create tags for each organization
    const orgTags = new Map();
    for (const org of orgs) {
      const tagsForOrg = [];
      const numTags = Math.floor(Math.random() * 10) + 5; // 5-15 tags per org
      const shuffledTags = [...SAMPLE_TAGS].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numTags; i++) {
        const [tag] = await db
          .insert(tags)
          .values({
            orgId: org.id,
            name: shuffledTags[i],
          })
          .returning();
        tagsForOrg.push(tag);
      }
      orgTags.set(org.id, tagsForOrg);
    }
    console.log("Created tags for organizations");

    // Create 10,000+ notes across organizations
    // Use menos notas para testes rápidos
    const NOTES_PER_ORG = process.env.SEED_FAST === "1" ? 10 : 2500; // 10 para testes rápidos
    let totalNotes = 0;

    for (const org of orgs) {
      const orgMembersList = await db
        .select()
        .from(orgMembers)
        .where(eq(orgMembers.orgId, org.id));

      const availableTags = orgTags.get(org.id) || [];

      for (let i = 0; i < NOTES_PER_ORG; i++) {
        const author =
          orgMembersList[Math.floor(Math.random() * orgMembersList.length)];
        const visibility = visibilities[Math.floor(Math.random() * 3)];
        const content =
          SAMPLE_CONTENT[Math.floor(Math.random() * SAMPLE_CONTENT.length)];
        const title = `Note ${totalNotes + 1}: ${content.substring(0, 50)}...`;


        let note;
        try {
          [note] = await db
            .insert(notes)
            .values({
              orgId: org.id,
              title,
              content,
              visibility,
              createdBy: author.userId,
            })
            .returning();
        } catch (err) {
          console.error('Erro ao criar nota:', err);
          continue;
        }

        // Create version
        await db.insert(noteVersions).values({
          noteId: note.id,
          version: 1,
          content,
        });

        // Add random tags (0-3 tags per note)
        const numTags = Math.floor(Math.random() * 4);
        if (numTags > 0 && availableTags.length > 0) {
          const noteTagsToAdd = availableTags
            .sort(() => Math.random() - 0.5)
            .slice(0, numTags);

          for (const tag of noteTagsToAdd) {
            try {
              await db.insert(noteTags).values({
                noteId: note.id,
                tagId: tag.id,
              });
            } catch (err) {
              console.error('Erro ao associar tag à nota:', note.id, tag.id, err);
            }
          }
        }

        // Sometimes add sharing for shared notes
        if (visibility === "shared" && Math.random() < 0.3) {
          const otherMembers = orgMembersList.filter(
            (m) => m.userId !== author.userId,
          );
          if (otherMembers.length > 0) {
            const shareWith =
              otherMembers[Math.floor(Math.random() * otherMembers.length)];
            await db.insert(noteShares).values({
              noteId: note.id,
              userId: shareWith.userId,
            });
          }
        }

        totalNotes++;
        if (totalNotes % 1000 === 0) {
          console.log(`Created ${totalNotes} notes...`);
        }
      }
    }

    console.log(
      `Seeding completed! Created ${totalNotes} notes across ${orgs.length} organizations`,
    );

    // Create some sample files
    for (const org of orgs) {
      const uploader =
        sampleUsers[Math.floor(Math.random() * sampleUsers.length)];

      for (let i = 0; i < 5; i++) {
        await db.insert(files).values({
          orgId: org.id,
          name: `sample-file-${i + 1}.pdf`,
          url: `https://example.com/files/sample-${i + 1}.pdf`,
          uploadedBy: uploader.id,
        });
      }
    }
    console.log("Created sample files");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding
seedDatabase()
  .then(() => {
    console.log("Database seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exit(1);
  });

