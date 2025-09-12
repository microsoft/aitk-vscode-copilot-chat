/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';

/**
 * Updates allTools.ts to add the import for the new tool
 */
function updateAllToolsTs(toolFileName: string) {
	const allToolsPath = path.join(__dirname, '..', 'src', 'extension', 'tools', 'node', 'allTools.ts');
	const importStatement = `import './${toolFileName}';`;

	const content = fs.readFileSync(allToolsPath, 'utf-8');

	// Check if import already exists
	if (content.includes(importStatement)) {
		console.log(`⚠️  Import already exists in allTools.ts`);
		return;
	}

	// Find the right place to insert (after existing imports, before empty line at end)
	const lines = content.split('\n');
	let lastImportIndex = -1;

	for (let i = lines.length - 1; i >= 0; i--) {
		if (lines[i].startsWith('import ')) {
			lastImportIndex = i;
			break;
		}
	}

	if (lastImportIndex !== -1) {
		lines.splice(lastImportIndex + 1, 0, importStatement);
		fs.writeFileSync(allToolsPath, lines.join('\n'));
		console.log(`✅ Added import to allTools.ts: ${importStatement}`);
	} else {
		console.log(`❌ Could not find import section in allTools.ts`);
	}
}

/**
 * Updates toolNames.ts to add the tool to both enums
 */
function updateToolNames(toolEnumName: string, contributedToolName: string, toolValueName: string) {
	const toolNamesPath = path.join(__dirname, '..', 'src', 'extension', 'tools', 'common', 'toolNames.ts');
	let content = fs.readFileSync(toolNamesPath, 'utf-8');

	// Add to ToolName enum
	const toolNamePattern = /export enum ToolName \{([^}]+)\}/;
	const toolNameMatch = content.match(toolNamePattern);

	if (toolNameMatch) {
		const enumContent = toolNameMatch[1];
		const enumEntry = `\t${toolEnumName} = '${toolValueName}',`;

		if (!enumContent.includes(`${toolEnumName} = '${toolValueName}'`)) {
			const lastCommaIndex = enumContent.lastIndexOf(',');
			if (lastCommaIndex !== -1) {
				const beforeLastEntry = enumContent.substring(0, lastCommaIndex + 1);
				const afterLastEntry = enumContent.substring(lastCommaIndex + 1);
				const newEnumContent = beforeLastEntry + '\n' + enumEntry + afterLastEntry;
				content = content.replace(toolNamePattern, `export enum ToolName {${newEnumContent}}`);
				console.log(`✅ Added ${toolEnumName} to ToolName enum`);
			}
		} else {
			console.log(`⚠️  ${toolEnumName} already exists in ToolName enum`);
		}
	}

	// Add to ContributedToolName enum
	const contributedToolNamePattern = /export enum ContributedToolName \{([^}]+)\}/;
	const contributedToolNameMatch = content.match(contributedToolNamePattern);

	if (contributedToolNameMatch) {
		const enumContent = contributedToolNameMatch[1];
		const enumEntry = `\t${toolEnumName} = '${contributedToolName}',`;

		if (!enumContent.includes(`${toolEnumName} = '${contributedToolName}'`)) {
			const lastCommaIndex = enumContent.lastIndexOf(',');
			if (lastCommaIndex !== -1) {
				const beforeLastEntry = enumContent.substring(0, lastCommaIndex + 1);
				const afterLastEntry = enumContent.substring(lastCommaIndex + 1);
				const newEnumContent = beforeLastEntry + '\n' + enumEntry + afterLastEntry;
				content = content.replace(contributedToolNamePattern, `export enum ContributedToolName {${newEnumContent}}`);
				console.log(`✅ Added ${toolEnumName} to ContributedToolName enum`);
			}
		} else {
			console.log(`⚠️  ${toolEnumName} already exists in ContributedToolName enum`);
		}
	}

	fs.writeFileSync(toolNamesPath, content);
}

/**
 * Reads the Skylight package.json and package.nls.json to extract tool information
 */
function extractSkylightToolInfo(referenceToolName: string) {
	const skylightPath = path.join(__dirname, '..', '..', 'Skylight', 'vscode', 'ai-mlstudio');
	const packageJsonPath = path.join(skylightPath, 'package.json');
	const packageNlsPath = path.join(skylightPath, 'package.nls.json');

	try {
		// Read Skylight package.json
		const packageContent = fs.readFileSync(packageJsonPath, 'utf-8');
		const packageJson = JSON.parse(packageContent);

		// Find the reference tool in languageModelTools
		const tools = packageJson.contributes?.languageModelTools || [];
		const referenceTool = tools.find((tool: any) => tool.name === referenceToolName);

		if (!referenceTool) {
			console.log(`⚠️  Reference tool '${referenceToolName}' not found in Skylight package.json`);
			return null;
		}

		// Read Skylight package.nls.json
		const nlsContent = fs.readFileSync(packageNlsPath, 'utf-8');
		const nlsJson = JSON.parse(nlsContent);

		// Extract displayName and modelDescription from NLS file
		const displayNameKey = referenceTool.displayName?.replace(/^%/, '').replace(/%$/, '');
		const modelDescriptionKey = referenceTool.modelDescription?.replace(/^%/, '').replace(/%$/, '');

		const realDisplayName = displayNameKey ? nlsJson[displayNameKey] : referenceTool.displayName;
		const realModelDescription = modelDescriptionKey ? nlsJson[modelDescriptionKey] : referenceTool.modelDescription;

		return {
			displayName: realDisplayName || referenceTool.displayName,
			modelDescription: realModelDescription || referenceTool.modelDescription,
			inputSchema: referenceTool.inputSchema,
			toolReferenceName: referenceTool.toolReferenceName,
			canBeReferencedInPrompt: referenceTool.canBeReferencedInPrompt,
			tags: referenceTool.tags || []
		};
	} catch (error) {
		console.log(`❌ Error reading Skylight files: ${error}`);
		return null;
	}
}

/**
 * Updates package.json directly to add the new tool entry
 */
function updatePackageJson(toolEnumName: string, contributedToolName: string, skylightInfo: any = null) {
	const packageJsonPath = path.join(__dirname, '..', 'package.json');

	try {
		// Read current package.json
		const packageContent = fs.readFileSync(packageJsonPath, 'utf-8');
		const packageJson = JSON.parse(packageContent);

		// Ensure contributes.languageModelTools exists
		if (!packageJson.contributes) {
			packageJson.contributes = {};
		}
		if (!packageJson.contributes.languageModelTools) {
			packageJson.contributes.languageModelTools = [];
		}

		// Check if tool already exists
		const existingTool = packageJson.contributes.languageModelTools.find((tool: any) => tool.name === contributedToolName);
		if (existingTool) {
			console.log(`⚠️  Tool ${contributedToolName} already exists in package.json`);
			return;
		}

		// Create new tool entry
		const displayName = skylightInfo?.displayName || `${toolEnumName} Tool Display Name`;
		const modelDescription = skylightInfo?.modelDescription || `Description of what your ${toolEnumName} tool does...`;
		const inputSchema = skylightInfo?.inputSchema || {
			type: "object",
			properties: {
				// Define your tool's input parameters here
			},
			required: []
		};

		// Create camelCase toolReferenceName (following the pattern)
		const toolReferenceName = toolEnumName.charAt(0).toLowerCase() + toolEnumName.slice(1);

		const newTool = {
			name: contributedToolName,
			displayName: displayName,
			modelDescription: modelDescription,
			toolReferenceName: toolReferenceName,
			canBeReferencedInPrompt: skylightInfo?.canBeReferencedInPrompt !== false,
			tags: skylightInfo?.tags || [],
			inputSchema: inputSchema
		};

		// Add new tool to the array
		packageJson.contributes.languageModelTools.push(newTool);

		// Write back to package.json with proper formatting
		fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, '\t'));
		console.log(`✅ Added tool ${contributedToolName} to package.json`);

	} catch (error) {
		console.log(`❌ Error updating package.json: ${error}`);
	}
}/**
 * Generates a VS Code Copilot tool wrapper for AI Toolkit tools
 * @param referenceToolName - The reference tool name from Skylight package.json
 * @param importToolName - The name of the tool to import from "ai-mlstudio/lmt"
 * @param generatedClassName - The name of the generated wrapper class (optional, defaults to importToolName + 'Wrapper')
 */
function generateTool(referenceToolName: string, importToolName: string, generatedClassName?: string) {
	if (!referenceToolName || !importToolName) {
		console.error('Usage: npm run generate-aitk-tool <referenceToolName> <importToolName> [generatedClassName]');
		console.error('Example: npm run generate-aitk-tool aitk-get_tracing_code_gen_best_practices GetTracingCodeGenBestPracticesTool TracingCodeBestPracticesTool');
		process.exit(1);
	}

	// If generatedClassName is not provided, use importToolName + 'Wrapper'
	if (!generatedClassName) {
		generatedClassName = importToolName + 'Wrapper';
	}

	// Convert class name to tool name (camelCase to snake_case for ToolName value)
	const toolValueName = generatedClassName
		.replace(/Tool$/, '') // Remove Tool suffix first
		.replace(/([A-Z])/g, '_$1') // Add underscore before capitals
		.toLowerCase()
		.replace(/^_/, ''); // Remove leading underscore

	// Convert import tool name to lowercase for import path
	const importPath = importToolName.charAt(0).toLowerCase() + importToolName.slice(1);

	// Create instance name (remove Tool suffix and make camelCase)
	const instanceName = importToolName.charAt(0).toLowerCase() + importToolName.slice(1);

	// Create enum name (PascalCase, remove Tool suffix)
	const toolEnumName = generatedClassName.replace(/Tool$/, '');

	// Create contributed tool name (camelCase with copilot_ prefix)
	const contributedToolName = `copilot_${toolEnumName.charAt(0).toLowerCase() + toolEnumName.slice(1)}`;

	// Create file name (camelCase + Tool suffix, following existing pattern)
	const fileName = `${toolEnumName.charAt(0).toLowerCase() + toolEnumName.slice(1)}Tool`;

	// Generate the file content
	const fileContent = `/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ${importToolName} } from "ai-mlstudio/lmt/${importPath}";
import type * as vscode from 'vscode';
import { LanguageModelTextPart, LanguageModelToolResult } from '../../../vscodeTypes';
import { ToolName } from '../common/toolNames';
import { ICopilotTool, ToolRegistry } from '../common/toolsRegistry';

export class ${generatedClassName} implements ICopilotTool<void> {
	public static toolName = ToolName.${generatedClassName.replace(/Tool$/, '')};
	public static ${instanceName} = new ${importToolName}();
	constructor() {
	}

	async invoke(options: vscode.LanguageModelToolInvocationOptions<void>, token: vscode.CancellationToken) {
		const toolResult = await ${generatedClassName}.${instanceName}.invoke(options as any, token);
		return new LanguageModelToolResult([
			new LanguageModelTextPart(
				(toolResult.content[0] as any).value
			)
		]);
	}
}

ToolRegistry.registerTool(${generatedClassName});
`;

	// Create the output file path
	const outputDir = path.join(__dirname, '..', 'src', 'extension', 'tools', 'node');
	const outputFile = path.join(outputDir, `${fileName}.tsx`);

	// Ensure output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Write the file
	fs.writeFileSync(outputFile, fileContent);

	console.log(`✅ Generated tool file: ${outputFile}`);

	// Automatically update related files
	const toolFileName = path.basename(outputFile, '.tsx');

	// Extract Skylight tool information using the reference tool name
	console.log(`🔍 Extracting information from Skylight tool: ${referenceToolName}`);
	const skylightInfo = extractSkylightToolInfo(referenceToolName);
	if (skylightInfo) {
		console.log(`✅ Successfully extracted Skylight tool information`);
	}

	// Update allTools.ts
	updateAllToolsTs(toolFileName);

	// Update toolNames.ts
	updateToolNames(toolEnumName, contributedToolName, toolValueName);

	// Update package.json directly
	updatePackageJson(toolEnumName, contributedToolName, skylightInfo);

	console.log(`\n📝 Remaining manual steps:`);
	console.log(`   1. Add the display name entry to package.nls.json if using localization`);
	console.log(`   2. Update the tool description and input schema in package.json as needed`);
	console.log(`   3. Test the generated tool integration`);
	console.log(`\n🎉 Tool generation complete! All automatic updates applied.`);
}

// Get command line arguments
const args = process.argv.slice(2);
const [referenceToolName, importToolName, generatedClassName] = args;

generateTool(referenceToolName, importToolName, generatedClassName);