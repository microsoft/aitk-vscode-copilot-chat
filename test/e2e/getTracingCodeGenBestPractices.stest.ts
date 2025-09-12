/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import { ToolName } from '../../src/extension/tools/common/toolNames';
import { deserializeWorkbenchState } from '../../src/platform/test/node/promptContextModel';
import { ssuite, stest } from '../base/stest';
import { generateToolTestRunner } from './toolSimTest';

ssuite({ title: 'getTracingCodeGenBestPractices', subtitle: 'toolCalling', location: 'panel' }, () => {
	const scenarioFolder = path.join(__dirname, '..', 'test/scenarios/test-tools');
	const getState = () => deserializeWorkbenchState(scenarioFolder, path.join(scenarioFolder, 'tools.state.json'));

	stest({ description: 'get-tracing-code-gen-best-practices', model: "claude-sonnet-4" }, generateToolTestRunner({
		question: '/editAgent generate tracing code using python and openai?',
		scenarioFolderPath: '',
		getState,
		expectedToolCalls: ToolName.GetTracingCodeGenBestPractices,
		tools: {
			[ToolName.FindFiles]: true,
			[ToolName.FindTextInFiles]: true,
			[ToolName.ReadFile]: true,
			[ToolName.EditFile]: true,
			[ToolName.Codebase]: true,
			[ToolName.ListDirectory]: true,
			[ToolName.SearchWorkspaceSymbols]: true,
			[ToolName.GetTracingCodeGenBestPractices]: true,
		},
	}, {
		allowParallelToolCalls: true,
		toolCallValidators: {
			[ToolName.GetTracingCodeGenBestPractices]: async (toolCalls) => {
				console.log('Tool calls:', toolCalls);
			}
		}
	}));
});
