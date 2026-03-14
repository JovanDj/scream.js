import { ProjectController } from "./project.controller.js";
import type { ProjectRepository } from "./project.service.js";

import { ProjectService } from "./project.service.js";

export const createProjectModule = ({
	projectRepository,
}: {
	projectRepository: ProjectRepository;
}) => {
	const projectService = new ProjectService(projectRepository);
	const projectController = new ProjectController(projectService);

	return { projectController, projectRepository, projectService };
};
