use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryPackage {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub skill_count: u32,
    pub repo: String,
    pub repo_url: String,
    pub status: String,
    pub tags: Vec<String>,
    pub publisher: String,
    pub updated_at: String,
    pub skills_path: String,
    /// Individual skill names found in the repo
    #[serde(default)]
    pub skill_names: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct GitHubRepo {
    name: String,
    full_name: String,
    description: Option<String>,
    html_url: String,
    updated_at: String,
    topics: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct MarketplacePlugin {
    name: String,
    description: String,
    skills: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct MarketplaceManifest {
    plugins: Vec<MarketplacePlugin>,
}

/// GitHub Git Tree API response (efficient: 1 call gets entire tree)
#[derive(Debug, Deserialize)]
struct GitTreeResponse {
    tree: Vec<GitTreeEntry>,
    truncated: bool,
}

#[derive(Debug, Deserialize)]
struct GitTreeEntry {
    path: String,
    #[serde(rename = "type")]
    entry_type: String,
}

/// GitHub Contents API response entry
#[derive(Debug, Deserialize)]
struct GitHubContent {
    name: String,
    #[serde(rename = "type")]
    content_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CacheEntry {
    packages: Vec<RegistryPackage>,
    timestamp: u64,
}

fn cache_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("openaec-composer")
        .join("cache")
}

fn cache_file() -> PathBuf {
    cache_dir().join("registry.json")
}

fn get_cached(max_age_secs: u64) -> Option<Vec<RegistryPackage>> {
    let path = cache_file();
    if !path.exists() {
        return None;
    }
    let content = fs::read_to_string(&path).ok()?;
    let entry: CacheEntry = serde_json::from_str(&content).ok()?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH).ok()?.as_secs();
    if now - entry.timestamp > max_age_secs {
        return None;
    }
    Some(entry.packages)
}

fn set_cache(packages: &[RegistryPackage]) {
    let _ = fs::create_dir_all(cache_dir());
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let entry = CacheEntry {
        packages: packages.to_vec(),
        timestamp: now,
    };
    if let Ok(json) = serde_json::to_string_pretty(&entry) {
        let _ = fs::write(cache_file(), json);
    }
}

fn parse_skill_count(description: &Option<String>) -> u32 {
    description
        .as_ref()
        .and_then(|d| d.split_whitespace().next()?.parse::<u32>().ok())
        .unwrap_or(0)
}

fn infer_category(name: &str, topics: &[String]) -> String {
    let all = format!("{} {}", name.to_lowercase(), topics.join(" ").to_lowercase());
    if all.contains("blender") || all.contains("bonsai") || all.contains("ifc")
        || all.contains("bim") || all.contains("speckle") || all.contains("qgis")
        || all.contains("thatopen") || all.contains("three")
    {
        "aec-bim".to_string()
    } else if all.contains("erpnext") || all.contains("frappe") || all.contains("nextcloud") || all.contains("n8n") {
        "erp-business".to_string()
    } else if all.contains("docker") || all.contains("draw") {
        "devops".to_string()
    } else if all.contains("cross-tech") || all.contains("open-pdf-studio") {
        "cross-tech".to_string()
    } else {
        "web-dev".to_string()
    }
}

fn infer_status(skill_count: u32, has_topics: bool) -> String {
    if skill_count >= 10 {
        "published".to_string()
    } else if skill_count > 0 || has_topics {
        "development".to_string()
    } else {
        "planned".to_string()
    }
}

fn repo_to_id(name: &str) -> String {
    name.replace("-Claude-Skill-Package", "")
        .replace("_Claude_Skill_Package", "")
        .replace("_Anthropic_Claude_Development_Skill_Package", "")
        .replace("-ifcOpenshell-Sverchok", "")
        .to_lowercase()
        .replace('_', "-")
}

fn clean_display_name(name: &str) -> String {
    name.replace("-Claude-Skill-Package", "")
        .replace("_Claude_Skill_Package", "")
        .replace("_Anthropic_Claude_Development_Skill_Package", "")
        .replace('-', " ")
        .replace('_', " ")
}

/// Count SKILL.md files in a repo using the Git Tree API (1 API call for entire repo tree).
/// Returns (skill_count, skill_names).
async fn count_real_skills(
    client: &reqwest::Client,
    full_name: &str,
) -> (u32, Vec<String>) {
    // Use the Trees API with recursive=1 to get the full file tree in one call
    let url = format!(
        "https://api.github.com/repos/{}/git/trees/main?recursive=1",
        full_name
    );
    let response = match client
        .get(&url)
        .header("Accept", "application/vnd.github.v3+json")
        .header("User-Agent", "OpenAEC-Workspace-Composer")
        .send()
        .await
    {
        Ok(r) if r.status().is_success() => r,
        _ => return (0, vec![]),
    };

    let tree: GitTreeResponse = match response.json().await {
        Ok(t) => t,
        Err(_) => return (0, vec![]),
    };

    // Find all SKILL.md files → each one = one skill
    let skill_entries: Vec<&GitTreeEntry> = tree
        .tree
        .iter()
        .filter(|e| e.entry_type == "blob" && e.path.ends_with("/SKILL.md"))
        .collect();

    let skill_names: Vec<String> = skill_entries
        .iter()
        .filter_map(|e| {
            // Extract skill name from path like "skills/source/group/skill-name/SKILL.md"
            let parts: Vec<&str> = e.path.split('/').collect();
            if parts.len() >= 2 {
                Some(parts[parts.len() - 2].to_string())
            } else {
                None
            }
        })
        .collect();

    (skill_entries.len() as u32, skill_names)
}

async fn fetch_openaec_packages(
    client: &reqwest::Client,
) -> Result<Vec<RegistryPackage>, String> {
    let response = client
        .get("https://api.github.com/orgs/OpenAEC-Foundation/repos?per_page=100&type=public")
        .header("Accept", "application/vnd.github.v3+json")
        .header("User-Agent", "OpenAEC-Workspace-Composer")
        .send()
        .await
        .map_err(|e| format!("GitHub API error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API returned {}", response.status()));
    }

    let repos: Vec<GitHubRepo> = response.json().await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let skill_repos: Vec<GitHubRepo> = repos
        .into_iter()
        .filter(|r| r.name.contains("Skill-Package") || r.name.contains("Claude-Skill") || r.name.contains("Skill_Package"))
        .filter(|r| !r.name.contains("Workflow-Template"))
        .collect();

    // Fetch real skill counts in parallel (up to 20 concurrent)
    let mut packages = Vec::new();
    for repo in &skill_repos {
        let description_count = parse_skill_count(&repo.description);
        let (real_count, skill_names) = count_real_skills(client, &repo.full_name).await;

        // Use the higher of description count vs real count
        let skill_count = if real_count > 0 { real_count } else { description_count };
        let id = repo_to_id(&repo.name);

        packages.push(RegistryPackage {
            id,
            name: clean_display_name(&repo.name),
            description: repo.description.clone().unwrap_or_default(),
            category: infer_category(&repo.name, &repo.topics),
            skill_count,
            repo: repo.full_name.clone(),
            repo_url: repo.html_url.clone(),
            status: infer_status(skill_count, !repo.topics.is_empty()),
            tags: if repo.topics.is_empty() {
                vec![repo_to_id(&repo.name)]
            } else {
                repo.topics.clone()
            },
            publisher: "openaec".to_string(),
            updated_at: repo.updated_at.clone(),
            skills_path: "skills/source".to_string(),
            skill_names,
        });
    }

    Ok(packages)
}

async fn fetch_anthropic_packages(
    client: &reqwest::Client,
) -> Result<Vec<RegistryPackage>, String> {
    // 1. Fetch marketplace.json for plugin bundles
    let response = client
        .get("https://api.github.com/repos/anthropics/skills/contents/.claude-plugin/marketplace.json")
        .header("Accept", "application/vnd.github.v3+json")
        .header("User-Agent", "OpenAEC-Workspace-Composer")
        .send()
        .await
        .map_err(|e| format!("GitHub API error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API returned {}", response.status()));
    }

    #[derive(Deserialize)]
    struct GitHubFile { content: String }
    let file: GitHubFile = response.json().await
        .map_err(|e| format!("Failed to parse: {}", e))?;

    let clean_content = file.content.replace('\n', "");
    use base64::Engine;
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(&clean_content)
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    let manifest: MarketplaceManifest = serde_json::from_slice(&decoded)
        .map_err(|e| format!("JSON parse error: {}", e))?;

    // 2. Also list individual skills from skills/ directory
    let skills_response = client
        .get("https://api.github.com/repos/anthropics/skills/contents/skills")
        .header("Accept", "application/vnd.github.v3+json")
        .header("User-Agent", "OpenAEC-Workspace-Composer")
        .send()
        .await;

    let individual_skills: Vec<String> = if let Ok(resp) = skills_response {
        if resp.status().is_success() {
            let contents: Vec<GitHubContent> = resp.json().await.unwrap_or_default();
            contents.iter()
                .filter(|c| c.content_type == "dir")
                .map(|c| c.name.clone())
                .collect()
        } else {
            vec![]
        }
    } else {
        vec![]
    };

    let mut packages = Vec::new();

    // Add plugin bundles
    for plugin in &manifest.plugins {
        let skill_names: Vec<String> = plugin.skills.iter()
            .map(|s| s.replace("./skills/", ""))
            .collect();

        packages.push(RegistryPackage {
            id: format!("anthropic-{}", plugin.name),
            name: format!("{} (Anthropic)", plugin.name),
            description: plugin.description.clone(),
            category: if plugin.name.contains("document") { "devops".to_string() } else { "web-dev".to_string() },
            skill_count: plugin.skills.len() as u32,
            repo: "anthropics/skills".to_string(),
            repo_url: "https://github.com/anthropics/skills".to_string(),
            status: "published".to_string(),
            tags: skill_names.clone(),
            publisher: "anthropic".to_string(),
            updated_at: String::new(),
            skills_path: "skills".to_string(),
            skill_names,
        });
    }

    // Add individual skills that aren't in any bundle
    let bundled: Vec<String> = manifest.plugins.iter()
        .flat_map(|p| p.skills.iter().map(|s| s.replace("./skills/", "")))
        .collect();

    for skill in &individual_skills {
        if !bundled.contains(skill) {
            packages.push(RegistryPackage {
                id: format!("anthropic-{}", skill),
                name: format!("{} (Anthropic)", skill),
                description: format!("Anthropic official skill: {}", skill),
                category: "web-dev".to_string(),
                skill_count: 1,
                repo: "anthropics/skills".to_string(),
                repo_url: format!("https://github.com/anthropics/skills/tree/main/skills/{}", skill),
                status: "published".to_string(),
                tags: vec![skill.clone(), "anthropic".to_string()],
                publisher: "anthropic".to_string(),
                updated_at: String::new(),
                skills_path: format!("skills/{}", skill),
                skill_names: vec![skill.clone()],
            });
        }
    }

    Ok(packages)
}

#[tauri::command]
pub async fn fetch_registry(force_refresh: bool) -> Result<Vec<RegistryPackage>, String> {
    if !force_refresh {
        if let Some(cached) = get_cached(600) {
            return Ok(cached);
        }
    }

    let client = reqwest::Client::new();

    let (openaec_result, anthropic_result) = tokio::join!(
        fetch_openaec_packages(&client),
        fetch_anthropic_packages(&client),
    );

    let mut packages = Vec::new();

    if let Ok(openaec) = openaec_result {
        packages.extend(openaec);
    }
    if let Ok(anthropic) = anthropic_result {
        packages.extend(anthropic);
    }

    if packages.is_empty() {
        if let Some(cached) = get_cached(u64::MAX) {
            return Ok(cached);
        }
        return Err("No packages found and no cache available".to_string());
    }

    set_cache(&packages);
    Ok(packages)
}

#[tauri::command]
pub fn get_cached_registry() -> Result<Vec<RegistryPackage>, String> {
    get_cached(u64::MAX).ok_or_else(|| "No cached registry data".to_string())
}
