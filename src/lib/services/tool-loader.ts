import fs from 'fs';
import path from 'path';

const TOOLS_CONFIG_DIR = path.join(process.cwd(), 'configs', 'tools');

export function loadTool(toolName: string) {
  const toolPath = path.join(TOOLS_CONFIG_DIR, `${toolName}-tool.json`);

  if (!fs.existsSync(toolPath)) {
    throw new Error(`Tool config not found: ${toolName}`);
  }

  const content = fs.readFileSync(toolPath, 'utf-8');
  return JSON.parse(content);
}
