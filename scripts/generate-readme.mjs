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

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false
  }).format(new Date(value));
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

  if (project.url) {
    return `- **[${title}](${project.url})** - ${description}`;
  }

  return `- **${title}** - ${description}`;
}

function renderRepo(repo) {
  const title = escapeInline(repo.name);
  const description = escapeInline(repo.description || "No description added yet.");
  const language = repo.language ? ` | ${repo.language}` : "";
  return `- **[${title}](${repo.html_url})**${language} - ${description} _(Updated ${formatDate(repo.pushed_at)})_`;
}

const [user, repos] = await Promise.all([
  getJson(`https://api.github.com/users/${config.username}`),
  getJson(`https://api.github.com/users/${config.username}/repos?per_page=100&sort=updated`)
]);

const publicRepos = repos.filter((repo) => !repo.private);
const excludedRepos = new Set((config.excludedRepos || []).map((name) => name.toLowerCase()));
const nonForkRepos = publicRepos.filter(
  (repo) => !repo.fork && !excludedRepos.has(repo.name.toLowerCase())
);
const recentRepos = [...nonForkRepos]
  .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
  .slice(0, config.recentRepoCount || 4);

const languageCounts = new Map();

for (const repo of nonForkRepos) {
  if (!repo.language) {
    continue;
  }

  languageCounts.set(repo.language, (languageCounts.get(repo.language) || 0) + 1);
}

const topLanguages = [...languageCounts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 5)
  .map(([language, count]) => `${language} (${count})`);

const latestRepo = recentRepos[0];
const aboutList = config.about.map((item) => `- ${item}`).join("\n");
const manualProjects = config.manualProjects.map(renderManualProject).join("\n");
const recentRepoList = recentRepos.length
  ? recentRepos.map(renderRepo).join("\n")
  : "- No public repositories found yet.";
const topLanguagesText = topLanguages.length ? topLanguages.join(", ") : "No language data yet.";
const latestRepoText = latestRepo
  ? `**[${escapeInline(latestRepo.name)}](${latestRepo.html_url})** on ${formatDate(latestRepo.pushed_at)}`
  : "No recent public repository activity yet.";

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

## GitHub Snapshot

- Public repositories: **${user.public_repos}**
- Followers / Following: **${user.followers} / ${user.following}**
- GitHub account created: **${formatDate(user.created_at)}**
- Most common repository languages: **${topLanguagesText}**
- Most recently updated repository: ${latestRepoText}

## Languages & Tools

<p align="left">
  <img src="https://skillicons.dev/icons?i=${config.skills.join(",")}" alt="Languages and tools" />
</p>

## Selected Work

${manualProjects}

## Recent Public Repositories

${recentRepoList}

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

<sub>Last refreshed: ${formatDateTime(new Date().toISOString())} UTC via GitHub Actions</sub>
`;

await writeFile(readmePath, `${readme}\n`, "utf8");
