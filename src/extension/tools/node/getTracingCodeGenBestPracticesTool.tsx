/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { GetTracingCodeGenBestPracticesTool } from "ai-mlstudio/lmt/getTracingCodeGenBestPracticesTool";
import type * as vscode from 'vscode';
import { LanguageModelTextPart, LanguageModelToolResult } from '../../../vscodeTypes';
import { ToolName } from '../common/toolNames';
import { ICopilotTool, ToolRegistry } from '../common/toolsRegistry';

export class TracingCodeBestPracticesTool implements ICopilotTool<void> {
	public static toolName = ToolName.GetTracingCodeGenBestPractices;
	public static getTracingCodeGenBestPractices = new GetTracingCodeGenBestPracticesTool();
	constructor() {
	}

	async invoke(options: vscode.LanguageModelToolInvocationOptions<void>, token: vscode.CancellationToken) {
		const toolResult = await TracingCodeBestPracticesTool.getTracingCodeGenBestPractices.invoke(options as any, token);
		return new LanguageModelToolResult([
			new LanguageModelTextPart(
				(toolResult.content[0] as any).value
			)
		]);
	}
}

ToolRegistry.registerTool(TracingCodeBestPracticesTool);
