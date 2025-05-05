const fs = require('fs');
const path = require('path');

// Read the configuration ID from the environment variable
const configId = process.env.APP_CONFIG_ID;
if (!configId) {
  console.error('Error: APP_CONFIG_ID environment variable not set. Build cannot proceed.');
  process.exit(1); // Exit the script with an error code
}

// --- Determine the source registry file path ---
// Define potential file paths based on observed patterns in your /staging directory
// Add other patterns here if needed in the future
const possibleSourcePaths = [
  // Pattern 1: e.g., character_of_God_registry.json
  path.join(__dirname, 'public', 'staging', `${configId}_registry.json`),
  // Pattern 2: e.g., config_registry_midjourney_styles.json
  path.join(__dirname, 'public','staging', `config_registry_${configId}.json`)
];

let sourceRegistryPath = null;
// Check which file exists based on the configId
for (const p of possibleSourcePaths) {
  if (fs.existsSync(p)) {
    sourceRegistryPath = p;
    break; // Stop checking once found
  }
}

// If no matching file was found in /staging, exit with an error
if (!sourceRegistryPath) {
  console.error(`Error: Source registry file not found in /staging for config ID '${configId}'. Looked for patterns:`);
  possibleSourcePaths.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}
// --- Source path determined ---


// Define the target path for the active registry
const targetRegistryPath = path.join(__dirname, 'public', 'data', 'config-registry.json');

try {
  // Copy the selected registry file from /staging to /public/data, overwriting the target
  fs.copyFileSync(sourceRegistryPath, targetRegistryPath);

  console.log(`Successfully activated configuration '${configId}' by copying ${path.basename(sourceRegistryPath)} to ${path.relative(__dirname, targetRegistryPath)}`);

} catch (err) {
  console.error(`Error copying registry for configuration '${configId}':`, err);
  process.exit(1); // Exit the script with an error code
}

// If everything worked, the script exits successfully (code 0)
console.log('Prebuild step completed successfully.');