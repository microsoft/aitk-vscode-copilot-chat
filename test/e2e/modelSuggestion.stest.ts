/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import path from 'path';
import { ToolName } from '../../src/extension/tools/common/toolNames';
import { deserializeWorkbenchState } from '../../src/platform/test/node/promptContextModel';
import { ssuite, stest } from '../base/stest';
import { generateToolTestRunner } from './toolSimTest';

ssuite({ title: 'modelSuggestionTool', subtitle: 'toolCalling', location: 'panel' }, () => {
	const scenarioFolder = path.join(__dirname, '..', 'test/scenarios/test-tools');
	const getState = () => deserializeWorkbenchState(scenarioFolder, path.join(scenarioFolder, 'tools.state.json'));

	stest({ description: 'model-suggestion', model: "claude-sonnet-4" }, generateToolTestRunner({
		question: '/editAgent Suggest me a model that is cheap and good for summarizing documents and using OpenAI SDK and model_suggestion tool?',
		scenarioFolderPath: '',
		getState,
		expectedToolCalls: ToolName.ModelSuggestion,
		tools: {
			[ToolName.FindFiles]: true,
			[ToolName.FindTextInFiles]: true,
			[ToolName.ReadFile]: true,
			[ToolName.EditFile]: true,
			[ToolName.Codebase]: true,
			[ToolName.ListDirectory]: true,
			[ToolName.SearchWorkspaceSymbols]: true,
			[ToolName.ModelSuggestion]: true,
		},
	}, {
		allowParallelToolCalls: true,
		toolCallValidators: {
			[ToolName.ModelSuggestion]: async (toolCalls) => {
				console.log('Tool calls:', toolCalls);
			}
		}
	}));
});
