"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
	createProject,
	getProject,
	listProjects,
	updateProject,
	deleteProject,
	getProjectWithFiles,
} from "@/lib/db/projects";
import { createFile } from "@/lib/db/files";
import type { InsertProject, ProjectTemplate } from "@/lib/types/database";

interface CreateProjectResult {
	success: boolean;
	error?: string;
	projectId?: string;
}

/**
 * Create a new project with initial template files
 */
export async function createNewProject(
	teamId: string,
	name: string,
	template: ProjectTemplate,
	description?: string
): Promise<CreateProjectResult> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "Not authenticated" };
		}

		// Create project
		const projectData: InsertProject = {
			team_id: teamId,
			name,
			template,
			description: description || null,
			settings: {
				template,
				initialized: true,
			},
		};

		const project = await createProject(projectData);

		// Create initial template files
		const templateFiles = getTemplateFiles(template);
		for (const file of templateFiles) {
			await createFile({
				project_id: project.id,
				path: file.path,
				content: file.content,
				language: file.language,
				created_by: "user",
			});
		}

		revalidatePath("/dashboard");
		return { success: true, projectId: project.id };
	} catch (error) {
		console.error("[createNewProject] Error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create project",
		};
	}
}

/**
 * Get project with all files
 */
export async function getProjectData(projectId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		return await getProjectWithFiles(projectId);
	} catch (error) {
		console.error("[getProjectData] Error:", error);
		throw error;
	}
}

/**
 * Get all projects for a team
 */
export async function getTeamProjects(teamId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		return await listProjects(teamId);
	} catch (error) {
		console.error("[getTeamProjects] Error:", error);
		throw error;
	}
}

/**
 * Update project metadata
 */
export async function updateProjectMetadata(
	projectId: string,
	updates: { name?: string; description?: string }
) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		const updated = await updateProject(projectId, updates);
		revalidatePath(`/workspace/${projectId}`);
		revalidatePath("/dashboard");
		return updated;
	} catch (error) {
		console.error("[updateProjectMetadata] Error:", error);
		throw error;
	}
}

/**
 * Delete a project
 */
export async function deleteProjectAction(projectId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		await deleteProject(projectId);
		revalidatePath("/dashboard");
	} catch (error) {
		console.error("[deleteProjectAction] Error:", error);
		throw error;
	}
}

/**
 * Open project (updates last_opened_at)
 */
export async function openProject(projectId: string) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("Not authenticated");
		}

		await updateProject(projectId, {
			last_opened_at: new Date().toISOString(),
		});

		redirect(`/workspace/${projectId}`);
	} catch (error) {
		console.error("[openProject] Error:", error);
		throw error;
	}
}

// ============================================================================
// TEMPLATE HELPERS
// ============================================================================

interface TemplateFile {
	path: string;
	content: string;
	language: string;
}

function getTemplateFiles(template: ProjectTemplate): TemplateFile[] {
	switch (template) {
		case "blank":
			return [
				{
					path: "README.md",
					content: "# New Project\n\nStart building your application!",
					language: "markdown",
				},
			];

		case "simple_site":
			return [
				{
					path: "index.html",
					content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Site</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Welcome to My Site</h1>
  <p>Start editing to see changes!</p>
  <script src="script.js"></script>
</body>
</html>`,
					language: "html",
				},
				{
					path: "styles.css",
					content: `body {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
}

h1 {
  color: #333;
}`,
					language: "css",
				},
				{
					path: "script.js",
					content: `console.log('Hello from your new site!');`,
					language: "javascript",
				},
			];

		case "nextjs":
			return [
				{
					path: "package.json",
					content: JSON.stringify(
						{
							name: "my-nextjs-app",
							version: "0.1.0",
							private: true,
							scripts: {
								dev: "next dev",
								build: "next build",
								start: "next start",
							},
							dependencies: {
								next: "^14.0.0",
								react: "^18.0.0",
								"react-dom": "^18.0.0",
							},
						},
						null,
						2
					),
					language: "json",
				},
				{
					path: "app/page.tsx",
					content: `export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Welcome to Next.js!</h1>
      <p className="mt-4">Start editing this file to see changes.</p>
    </main>
  );
}`,
					language: "typescript",
				},
				{
					path: "app/layout.tsx",
					content: `export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
					language: "typescript",
				},
			];

		case "react_spa":
			return [
				{
					path: "package.json",
					content: JSON.stringify(
						{
							name: "my-react-app",
							version: "0.1.0",
							private: true,
							scripts: {
								dev: "vite",
								build: "vite build",
								preview: "vite preview",
							},
							dependencies: {
								react: "^18.0.0",
								"react-dom": "^18.0.0",
							},
							devDependencies: {
								"@vitejs/plugin-react": "^4.0.0",
								vite: "^5.0.0",
							},
						},
						null,
						2
					),
					language: "json",
				},
				{
					path: "src/App.tsx",
					content: `function App() {
  return (
    <div className="app">
      <h1>Welcome to React!</h1>
      <p>Start building your app.</p>
    </div>
  );
}

export default App;`,
					language: "typescript",
				},
				{
					path: "src/main.tsx",
					content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
					language: "typescript",
				},
				{
					path: "index.html",
					content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,
					language: "html",
				},
			];

		case "vue_spa":
			return [
				{
					path: "package.json",
					content: JSON.stringify(
						{
							name: "my-vue-app",
							version: "0.1.0",
							private: true,
							scripts: {
								dev: "vite",
								build: "vite build",
								preview: "vite preview",
							},
							dependencies: {
								vue: "^3.0.0",
							},
							devDependencies: {
								"@vitejs/plugin-vue": "^4.0.0",
								vite: "^5.0.0",
							},
						},
						null,
						2
					),
					language: "json",
				},
				{
					path: "src/App.vue",
					content: `<template>
  <div class="app">
    <h1>Welcome to Vue!</h1>
    <p>Start building your app.</p>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app {
  padding: 2rem;
}
</style>`,
					language: "vue",
				},
				{
					path: "src/main.ts",
					content: `import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');`,
					language: "typescript",
				},
				{
					path: "index.html",
					content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,
					language: "html",
				},
			];

		default:
			return [];
	}
}
