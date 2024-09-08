import type { Knex } from "knex";

export function seed(knex: Knex): Promise<void> {
	return knex.transaction(
		async (trx) => {
			await trx("users").del();

			await trx("users").insert([
				{ username: "User 1" },
				{ username: "User 2" },
				{ username: "User 3" },
			]);

			await trx.commit();
		},
		{ isolationLevel: "serializable", readOnly: false },
	);
}
