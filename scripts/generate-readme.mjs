import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const configPath = path.join(rootDir, "profile.config.json");
const readmePath = path.join(rootDir, "README.md");

const config = JSON.parse(await readFile(configPath, "utf8"));

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${config.username}-profile-readme-generator`
};

if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function getJson(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}) for ${url}`);
  }

  return response.json();
}

function escapeInline(text) {
  return String(text ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderManualProject(project) {
  const title = escapeInline(project.title);
  const description = escapeInline(project.description);
  const heading = project.url ? `### [${title}](${project.url})` : `### ${title}`;
  const stack = Array.isArray(project.stack) && project.stack.length
    ? project.stack.map((item) => `\`${escapeInline(item)}\``).join(" ")
    : "";

  return [heading, description, stack].filter(Boolean).join("\n\n");
}
const user = await getJson(`https://api.github.com/users/${config.username}`);
const aboutList = config.about.map((item) => `- ${item}`).join("\n");
const manualProjects = config.manualProjects.map(renderManualProject).join("\n\n");

const readme = `# Hi there, I'm ${config.name}

### ${config.headline}

<p align="left">
  <a href="https://github.com/${config.username}">
    <img src="https://komarev.com/ghpvc/?username=${config.username}&label=Profile%20views&color=0ea5e9&style=for-the-badge" alt="Profile views" />
  </a>
  <a href="https://github.com/${config.username}?tab=followers">
    <img src="https://img.shields.io/github/followers/${config.username}?label=Followers&style=for-the-badge&color=181717" alt="GitHub followers" />
  </a>
  <a href="https://github.com/${config.username}?tab=repositories">
    <img src="https://img.shields.io/badge/Public%20Repos-${user.public_repos}-0f172a?style=for-the-badge&logo=github&logoColor=white" alt="Public repositories" />
  </a>
  <a href="${config.portfolio}">
    <img src="https://img.shields.io/badge/Portfolio-Live%20Site-0f172a?style=for-the-badge&logo=vercel&logoColor=white" alt="Portfolio website" />
  </a>
</p>

## About Me

${aboutList}
- Reach me at **[${config.email}](mailto:${config.email})**

## Languages & Tools

<p align="left">
  <img src="https://skillicons.dev/icons?i=${config.skills.join(",")}" alt="Languages and tools" />
</p>

## Featured Work

${manualProjects}

## GitHub Stats

<p align="left">
  <img src="https://github-readme-stats.vercel.app/api?username=${config.username}&show_icons=true&theme=github_dark&hide_border=true&include_all_commits=true" height="165" alt="GitHub stats" />
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${config.username}&layout=compact&theme=github_dark&hide_border=true" height="165" alt="Top languages" />
</p>

<p align="left">
  <img src="https://streak-stats.demolab.com?user=${config.username}&theme=github-dark-blue&hide_border=true" alt="GitHub streak" />
</p>

## GitHub Achievements

<p align="left">
  <img src="https://github-profile-trophy.vercel.app/?username=${config.username}&theme=algolia&no-frame=true&no-bg=true&margin-w=8&margin-h=8" alt="GitHub trophies" />
</p>

## Connect With Me

<p align="left">
  <a href="${config.linkedin}">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="https://github.com/${config.username}">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="${config.portfolio}">
    <img src="https://img.shields.io/badge/Portfolio-111827?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portfolio" />
  </a>
  <a href="mailto:${config.email}">
    <img src="https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" />
  </a>
</p>

## Activity Graph

<p align="left">
  <img src="https://github-readme-activity-graph.vercel.app/graph?username=${config.username}&theme=github-compact&hide_border=true&area=true" alt="GitHub activity graph" />
</p>
`;

await writeFile(readmePath, `${readme}\n`, "utf8");
