const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const getLatestVersion = (repo) => {
  try {
    // 1. Try to get the latest release tag name using gh
    const releaseOut = execSync(`gh release view --repo ${repo} --json tagName --jq .tagName`, { encoding: 'utf8' }).trim();
    if (releaseOut) {
      return releaseOut;
    }
  } catch (e) {
    // If no release, fall back to checking tags
  }

  try {
    // 2. Try to get the latest tag name using gh api
    const tagsOut = execSync(`gh api repos/${repo}/tags --jq ".[0].name"`, { encoding: 'utf8' }).trim();
    if (tagsOut) {
      return tagsOut;
    }
  } catch (e) {
    // Log error and fallback
    console.error(`Failed to fetch version for ${repo}:`, e.message);
  }

  return 'v1.0.0'; // Default fallback
};

const main = () => {
  console.log('Fetching latest project versions from GitHub...');
  
  const versions = {
    vinyl: getLatestVersion('xphox2/Vinylfo-Releases'),
    fw_server: getLatestVersion('xphox2/Firewall-Monitoring'),
    fw_collector: getLatestVersion('xphox2/Firewall-Collector'),
    rust_plugin: getLatestVersion('xphox2/SignArtSaver')
  };

  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const outputPath = path.join(assetsDir, 'versions.json');
  fs.writeFileSync(outputPath, JSON.stringify(versions, null, 2), 'utf8');
  console.log(`Successfully wrote versions to ${outputPath}:`, versions);
};

main();
