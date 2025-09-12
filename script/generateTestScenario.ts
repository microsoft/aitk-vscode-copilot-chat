/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates a test scenario folder for AI Toolkit tools testing
 * @param expectedToolCalls - The expected tool name (e.g., "generate_prompt")
 * @param question - The test question (e.g., "Generate a prompt good for summarizing documents?")
 */
function generateTestScenario(expectedToolCalls: string, question: string) {
	if (!expectedToolCalls || !question) {
		console.error('Usage: npm run generate-test-scenario "<expectedToolCalls>" "<question>"');
		console.error('Example: npm run generate-test-scenario "generate_prompt" "Generate a prompt good for summarizing documents?"');
		console.error('Example: npm run generate-test-scenario "model_suggestion" "Suggest me a good model for code generation"');
		process.exit(1);
	}

	// Convert expectedToolCalls to kebab-case for folder name
	const folderName = `test-${expectedToolCalls.replace(/_/g, '-')}`;

	// Create main test name based on expectedToolCalls
	const testName = expectedToolCalls.replace(/_/g, '');

	// Generate the conversation.json content
	const conversationContent = {
		question: `/editAgent ${question}`,
		stateFile: "./tools.state.json",
		expectedToolCalls: expectedToolCalls,
		toolInputValues: {},
		tools: {
			"find_files": true,
			"grep_search": true,
			"read_file": true,
			"insert_edit_into_file": true,
			"semantic_search": true,
			"list_dir": true,
			"search_workspace_symbols": true,
			[expectedToolCalls]: true
		}
	};

	// Generate the tools.state.json content (standard template)
	const toolsStateContent = {
		"activeTextEditor": {
			"selections": [
				{
					"anchor": {
						"line": 15,
						"character": 0
					},
					"active": {
						"line": 20,
						"character": 1
					},
					"start": {
						"line": 15,
						"character": 0
					},
					"end": {
						"line": 20,
						"character": 1
					}
				}
			],
			"documentFilePath": "workspace/functions.ts",
			"visibleRanges": [
				{
					"start": {
						"line": 15,
						"character": 0
					},
					"end": {
						"line": 20,
						"character": 1
					}
				}
			],
			"languageId": "typescript"
		},
		"activeFileDiagnostics": [],
		"debugConsoleOutput": "Test",
		"terminalBuffer": "Hello world",
		"terminalSelection": "Hello world"
	};

	// Generate the workspace/functions.ts content (standard template)
	const functionsContent = `/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation and GitHub. All rights reserved.
 *--------------------------------------------------------------------------------------------*/
function foo() {
	console.log('foo');
}

function bar() {
	console.log('bar');
}

function qux() {  // this function doesn't get included in prompt context
	console.log('qux');
}

function baz() {
	foo();
	bar();
}
`;

	// Create the output directory structure
	const outputDir = path.join(__dirname, '..', 'test', 'scenarios', folderName);
	const workspaceDir = path.join(outputDir, 'workspace');

	// Check if folder already exists
	if (fs.existsSync(outputDir)) {
		console.log(`⚠️  Test scenario folder already exists: ${outputDir}`);
		console.log(`   Use a different tool name or delete the existing folder first.`);
		return;
	}

	// Create directories
	fs.mkdirSync(outputDir, { recursive: true });
	fs.mkdirSync(workspaceDir, { recursive: true });

	// Write files
	fs.writeFileSync(
		path.join(outputDir, `${testName}.conversation.json`),
		JSON.stringify([conversationContent], null, 4)
	);

	fs.writeFileSync(
		path.join(outputDir, 'tools.state.json'),
		JSON.stringify(toolsStateContent, null, 4)
	);

	fs.writeFileSync(
		path.join(workspaceDir, 'functions.ts'),
		functionsContent
	);

	console.log(`✅ Generated test scenario folder: ${outputDir}`);
	console.log(`\n📁 Created files:`);
	console.log(`   📄 ${testName}.conversation.json`);
	console.log(`   📄 tools.state.json`);
	console.log(`   📁 workspace/`);
	console.log(`      📄 functions.ts`);

	console.log(`\n📝 Test details:`);
	console.log(`   Folder: ${folderName}`);
	console.log(`   Question: "${question}"`);
	console.log(`   Expected tool: ${expectedToolCalls}`);

	console.log(`\n🎯 Next steps:`);
	console.log(`   1. Review the generated conversation.json and adjust if needed`);
	console.log(`   2. Customize workspace/functions.ts with relevant test code`);
	console.log(`   3. Run the test scenario with your simulation framework`);
	console.log(`   4. Add more workspace files if needed for your test case`);

	console.log(`\n🎉 Test scenario generation complete!`);
}

// Get command line arguments
const args = process.argv.slice(2);
const [expectedToolCalls, question] = args;

// Handle quoted arguments
const fullQuestion = args.find(arg => arg.includes(' ')) || question;
const toolName = args[0]; // First argument should be the tool name

generateTestScenario(toolName || expectedToolCalls, fullQuestion || question);