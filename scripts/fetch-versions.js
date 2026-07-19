const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const token = process.env.GITHUB_TOKEN;

const getLatestVersionWithFetch = async (repo) => {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Node-Fetch-Versions-Script'
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    let res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.tag_name) {
        return data.tag_name;
      }
    }
  } catch (e) {
    // Ignore error
  }

  try {
    let res = await fetch(`https://api.github.com/repos/${repo}/tags`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return data[0].name;
      }
    }
  } catch (e) {
    console.error(`Fetch API failed for ${repo}:`, e.message);
  }

  return null;
};

const getLatestVersionWithCli = (repo) => {
  try {
    const releaseOut = execSync(`gh release view --repo ${repo} --json tagName --jq .tagName`, { encoding: 'utf8' }).trim();
    if (releaseOut) {
      return releaseOut;
    }
  } catch (e) {
    // Fall back to tags
  }

  try {
    const tagsOut = execSync(`gh api repos/${repo}/tags --jq ".[0].name"`, { encoding: 'utf8' }).trim();
    if (tagsOut) {
      return tagsOut;
    }
  } catch (e) {
    // Log error and fallback
  }

  return null;
};

const getLocalFallbackVersion = (repo) => {
  // Check local sibling folders to parse versions directly from Go source files
  if (repo === 'xphox2/Firewall-Monitoring') {
    try {
      const localPath = path.join(__dirname, '..', '..', 'Firewall-Mon', 'cmd', 'api', 'main.go');
      if (fs.existsSync(localPath)) {
        const content = fs.readFileSync(localPath, 'utf8');
        const match = content.match(/const ServerVersion = "(.*?)"/);
        if (match && match[1]) {
          return 'v' + match[1];
        }
      }
    } catch (e) {
      // Sibling folder check failed, return hardcoded default
    }
    return 'v0.11.122'; // Hardcoded default
  }

  if (repo === 'xphox2/Firewall-Collector') {
    try {
      const localPath = path.join(__dirname, '..', '..', 'Firewall-Collector', 'cmd', 'collector', 'main.go');
      if (fs.existsSync(localPath)) {
        const content = fs.readFileSync(localPath, 'utf8');
        const match = content.match(/const version = "(.*?)"/);
        if (match && match[1]) {
          return 'v' + match[1];
        }
      }
    } catch (e) {
      // Sibling folder check failed, return hardcoded default
    }
    return 'v1.3.16'; // Hardcoded default
  }

  if (repo === 'xphox2/Vinylfo-Releases') {
    return 'v0.16.12';
  }

  if (repo === 'xphox2/SignArtSaver') {
    return 'v0.11.14';
  }

  return 'v1.0.0';
};

const main = async () => {
  console.log('Fetching latest project versions from GitHub...');
  
  const repos = {
    vinyl: 'xphox2/Vinylfo-Releases',
    fw_server: 'xphox2/Firewall-Monitoring',
    fw_collector: 'xphox2/Firewall-Collector',
    rust_plugin: 'xphox2/SignArtSaver'
  };

  const versions = {};

  for (const [key, repo] of Object.entries(repos)) {
    let ver = null;
    if (token) {
      ver = await getLatestVersionWithFetch(repo);
    }
    if (!ver) {
      ver = getLatestVersionWithCli(repo);
    }
    versions[key] = ver || getLocalFallbackVersion(repo);
  }

  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const outputPath = path.join(assetsDir, 'versions.json');
  fs.writeFileSync(outputPath, JSON.stringify(versions, null, 2), 'utf8');
  console.log(`Successfully wrote versions to ${outputPath}:`, versions);
};

main();
