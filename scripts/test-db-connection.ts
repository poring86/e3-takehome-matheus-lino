import { db } from "@/lib/db";

async function main() {
  try {
    console.log("Testando conexão com o banco...");
    // Executa uma query simples
    const result = await db.execute("SELECT 1+1 AS result");
    console.log("Conexão bem-sucedida! Resultado:", result);
    process.exit(0);
  } catch (err) {
    console.error("Erro ao conectar no banco:", err);
    process.exit(1);
  }
}

main();
