/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates an stest.ts file for testing AI Toolkit tools
 * @param toolName - The ToolName enum value (e.g., "GetTracingCodeGenBestPractices")
 * @param testQuestion - Optional custom test question
 */
function generateStestFile(toolName: string, testQuestion?: string) {
	if (!toolName) {
		console.error('Usage: npm run generate-stest <toolName> [testQuestion]');
		console.error('Example: npm run generate-stest GetTracingCodeGenBestPractices');
		console.error('Example: npm run generate-stest ModelSuggestion "Suggest me a good model for code generation"');
		process.exit(1);
	}

	// Convert PascalCase to kebab-case for file names and descriptions
	const kebabCaseName = toolName
		.replace(/([A-Z])/g, '-$1')
		.toLowerCase()
		.replace(/^-/, '');

	// Convert PascalCase to camelCase for suite title
	const camelCaseName = toolName.charAt(0).toLowerCase() + toolName.slice(1);

	// Generate default test question based on tool name
	const defaultQuestion = testQuestion || generateDefaultQuestion(toolName);

	// Generate the file content
	const fileContent = `/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import { ToolName } from '../../src/extension/tools/common/toolNames';
import { deserializeWorkbenchState } from '../../src/platform/test/node/promptContextModel';
import { ssuite, stest } from '../base/stest';
import { generateToolTestRunner } from './toolSimTest';

ssuite({ title: '${camelCaseName}Tool', subtitle: 'toolCalling', location: 'panel' }, () => {
	const scenarioFolder = path.join(__dirname, '..', 'test/scenarios/test-tools');
	const getState = () => deserializeWorkbenchState(scenarioFolder, path.join(scenarioFolder, 'tools.state.json'));

	stest({ description: '${kebabCaseName}', model: "claude-sonnet-4" }, generateToolTestRunner({
		question: '/editAgent ${defaultQuestion}',
		scenarioFolderPath: '',
		getState,
		expectedToolCalls: ToolName.${toolName},
		tools: {
			[ToolName.FindFiles]: true,
			[ToolName.FindTextInFiles]: true,
			[ToolName.ReadFile]: true,
			[ToolName.EditFile]: true,
			[ToolName.Codebase]: true,
			[ToolName.ListDirectory]: true,
			[ToolName.SearchWorkspaceSymbols]: true,
			[ToolName.${toolName}]: true,
		},
	}, {
		allowParallelToolCalls: true,
		toolCallValidators: {
			[ToolName.${toolName}]: async (toolCalls) => {
				console.log('Tool calls:', toolCalls);
			}
		}
	}));
});
`;

	// Create the output file path
	const outputDir = path.join(__dirname, '..', 'test', 'e2e');
	const outputFile = path.join(outputDir, `${kebabCaseName}.stest.ts`);

	// Ensure output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Check if file already exists
	if (fs.existsSync(outputFile)) {
		console.log(`⚠️  Test file already exists: ${outputFile}`);
		console.log(`   Use a different name or delete the existing file first.`);
		return;
	}

	// Write the file
	fs.writeFileSync(outputFile, fileContent);

	console.log(`✅ Generated stest file: ${outputFile}`);

	// Automatically add import to simulationTests.ts
	addImportToSimulationTests(kebabCaseName);

	console.log(`\n📝 Test details:`);
	console.log(`   Suite: ${camelCaseName}Tool`);
	console.log(`   Test: ${kebabCaseName}`);
	console.log(`   Question: "${defaultQuestion}"`);
	console.log(`   Expected tool: ToolName.${toolName}`);
	console.log(`\n🎯 Next steps:`);
	console.log(`   1. Review the generated test question and adjust if needed`);
	console.log(`   2. Run the test: npm run simulate -- --filter="${kebabCaseName}"`);
	console.log(`   3. Verify the tool is called correctly during the test`);
	console.log(`\n🎉 stest file generation complete!`);
}

/**
 * Generates a default test question based on the tool name
 */
function generateDefaultQuestion(toolName: string): string {
	const questions: Record<string, string> = {
		'GetTracingCodeGenBestPractices': 'generate tracing code using python and openai?',
		'ModelSuggestion': 'Suggest me a model that is cheap and good for summarizing documents and using OpenAI SDK?',
		'GeneratePrompt': 'Generate a prompt good for summarizing documents?',
		'OpenTracingPage': 'open the tracing page to view traces?',
		'GetAiModelGuidance': 'provide guidance on choosing the right AI model for my project?',
	};

	// Return specific question if available, otherwise generate a generic one
	return questions[toolName] || `use the ${toolName} tool to help with my task?`;
}

/**
 * Adds an import statement to simulationTests.ts for the new stest file
 */
function addImportToSimulationTests(kebabCaseName: string) {
	const simulationTestsPath = path.join(__dirname, '..', 'test', 'simulationTests.ts');
	const importStatement = `import './e2e/${kebabCaseName}.stest';`;

	try {
		const content = fs.readFileSync(simulationTestsPath, 'utf-8');

		// Check if import already exists
		if (content.includes(importStatement)) {
			console.log(`⚠️  Import already exists in simulationTests.ts`);
			return;
		}

		const lines = content.split('\n');
		let insertIndex = -1;

		// Find the last import statement in the e2e section
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].startsWith("import './e2e/") && lines[i].includes('.stest')) {
				insertIndex = i;
			}
		}

		if (insertIndex !== -1) {
			// Insert the new import after the last e2e import, keeping alphabetical order
			let inserted = false;
			for (let i = insertIndex; i >= 0; i--) {
				if (lines[i].startsWith("import './e2e/") && lines[i].includes('.stest')) {
					const existingImport = lines[i];
					const existingName = existingImport.match(/import '\.\/e2e\/(.+)\.stest';/)?.[1];
					if (existingName && kebabCaseName > existingName) {
						lines.splice(i + 1, 0, importStatement);
						inserted = true;
						break;
					}
				}
			}

			// If not inserted yet, insert at the beginning of e2e imports
			if (!inserted) {
				for (let i = 0; i < lines.length; i++) {
					if (lines[i].startsWith("import './e2e/") && lines[i].includes('.stest')) {
						lines.splice(i, 0, importStatement);
						break;
					}
				}
			}

			fs.writeFileSync(simulationTestsPath, lines.join('\n'));
			console.log(`✅ Added import to simulationTests.ts: ${importStatement}`);
		} else {
			console.log(`❌ Could not find e2e import section in simulationTests.ts`);
		}
	} catch (error) {
		console.log(`❌ Error updating simulationTests.ts: ${error}`);
	}
}

// Get command line arguments
const args = process.argv.slice(2);
const [toolName, testQuestion] = args;

generateStestFile(toolName, testQuestion);