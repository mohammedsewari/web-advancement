import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

// import.meta.dirname resolves relative to this file instead of the working directory
const specPath = path.join(import.meta.dirname, 'docs', 'openapi.yaml');

export const swaggerSpec = YAML.parse(fs.readFileSync(specPath, 'utf8'));