import type { Knex } from "knex";

const lookupId = async (trx: Knex.Transaction, table: string, code: string) => {
	const row = await trx(table).where({ code }).first("id");
	if (!row) {
		throw new Error(`Missing lookup row in ${table}: ${code}`);
	}

	return Number(row["id"]);
};

export function seed(knex: Knex): Promise<void> {
	return knex.transaction(async (trx) => {
		const now = new Date().toISOString();
		const projectActiveStatusId = await lookupId(
			trx,
			"project_statuses",
			"active",
		);
		const todoOpenStatusId = await lookupId(trx, "todo_statuses", "open");
		const todoCompletedStatusId = await lookupId(
			trx,
			"todo_statuses",
			"completed",
		);
		const priorityMediumId = await lookupId(trx, "todo_priorities", "medium");
		const priorityHighId = await lookupId(trx, "todo_priorities", "high");

		const [project] = await trx("projects")
			.insert({
				created_at: now,
				name: "Inbox",
				status_id: projectActiveStatusId,
				updated_at: now,
			})
			.returning(["id"]);

		const [todo1] = await trx("todos")
			.insert({
				completed_at: null,
				created_at: now,
				description: "",
				due_at: null,
				priority_id: priorityMediumId,
				project_id: Number(project["id"]),
				status_id: todoOpenStatusId,
				title: "Sample Todo",
				updated_at: now,
				version: 0,
			})
			.returning(["id"]);

		await trx("todos").insert({
			completed_at: now,
			created_at: now,
			description: "Done example",
			due_at: null,
			priority_id: priorityHighId,
			project_id: Number(project["id"]),
			status_id: todoCompletedStatusId,
			title: "Completed Todo",
			updated_at: now,
			version: 0,
		});

		const [tag1] = await trx("tags")
			.insert({
				created_at: now,
				name: "General",
				updated_at: now,
			})
			.returning(["id"]);

		const [tag2] = await trx("tags")
			.insert({
				created_at: now,
				name: "Important",
				updated_at: now,
			})
			.returning(["id"]);

		await trx("todo_tags").insert([
			{
				created_at: now,
				tag_id: Number(tag1["id"]),
				todo_id: Number(todo1["id"]),
			},
			{
				created_at: now,
				tag_id: Number(tag2["id"]),
				todo_id: Number(todo1["id"]),
			},
		]);
	});
}
