import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";
import { serverEnv } from "./env";

function createDbInstance() {
	const connectionString = serverEnv.DATABASE_URL;

	// Disable prefetch as it is not supported for "Transaction" pool mode
	const client = postgres(connectionString, { prepare: false });
	return drizzle(client, { schema });
}

type DbInstance = ReturnType<typeof createDbInstance>;

let dbInstance: DbInstance | undefined;

export function getDb(): DbInstance {
	if (!dbInstance) {
		dbInstance = createDbInstance();
	}

	return dbInstance;
}

export const db = new Proxy({} as DbInstance, {
	get(_target, prop, receiver) {
		const instance = getDb() as unknown as Record<PropertyKey, unknown>;
		const value = Reflect.get(instance, prop, receiver);

		return typeof value === "function"
			? (value as (...args: unknown[]) => unknown).bind(instance)
			: value;
	},
});
