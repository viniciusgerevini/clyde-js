import { DialogueLine, DialogueOptions, DialogueOption, DialogueEnd } from '../src/interpreter';

export function line(dialogueLine: Partial<DialogueLine> & { text: string }): DialogueLine {
	return {
		type: 'line',
		...dialogueLine,
	};
}

export function options(dialogueOptions: Partial<DialogueOptions> & { options: DialogueOption[] }): DialogueOptions {
	return {
		type: 'options',
		...dialogueOptions,
	}
}

export function option(dialogueOption: Partial<DialogueOption> & { text: string }): DialogueOption {
	return {
		visited: dialogueOption.visited ?? false,
		...dialogueOption,
	}
}

export function end(): DialogueEnd {
	return { type: "end" };
}
