import { Knex } from "knex";

export function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries

  return knex.transaction(
    async (trx) => {
      await trx("users").del();
      // Inserts seed entries
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
