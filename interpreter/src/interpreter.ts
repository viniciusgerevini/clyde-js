import path from 'path';

import { LogicInterpreter } from'./logic_interpreter';
import { Memory, DialogueData } from './memory';
import { Events, EventType } from './events';
import {
  ClydeDocumentRoot,
  ContentNode,
  BlockNode,
  LineNode,
  OptionsNode,
  OptionNode,
  DivertNode,
  VariationsNode,
  ConditionalContentNode,
  ActionContentNode,
  AssignmentsNode,
  EventsNode,
  EventNode,
  MatchBlockNode,
} from '@clyde-lang/parser';

type StackItem = {
  current: any,
  contentIndex: number,
};

type WorkingNode = {
  _index?: string,
}

type DocExtraWorkingFields = {
  anchors: {[name: string]: any},
  links: {[name: string]: string},
};

type WorkingActionContentNode = ActionContentNode & { mode: string };

export type DialogueLine = {
  type: 'line';
  text: string
  speaker?: string;
  tags?: string[];
  id?: string;
};

export type DialogueOptions = {
  type: 'options',
  options: DialogueOption[],
  text?: string
  speaker?: string;
  tags?: string[];
  id?: string;
};

export type DialogueOption = {
  text: string,
  speaker?: string;
  tags?: string[];
  id?: string;
  visited: boolean;
};

export type DialogueEnd = {
  type: 'end';
};

function EndObject(): DialogueEnd {
  return { type: "end" };
}


type ContentReturnType = DialogueLine | DialogueOptions | DialogueEnd;

export type Dictionary = {
  [key: string]: string,
};

export interface InterpreterInstance {
  /**
   * Add event listener
   *
   * @param eventName - Event name
   * @param callback - Callback
   * @return callback
   */
  on(eventName: EventType, callback: Function): Function;

  /**
   * Remove event listener
   *
   * @param eventName - Event name
   * @param callback - Callback provided when adding the listener
   */
  off(eventName: EventType, callback: Function): void;

  /**
   * Get internal data
   *
   * @return data
   */
  getData(): DialogueData;

  /**
   * Load internal data
   *
   * @param data
   */
  loadData(data: DialogueData): void;

  /**
   * Clear all internal data
   */
  clearData(): void;

  /**
   * Load translation object.
   *
   * @param dictionary
   */
  loadDictionary(dictionary: Dictionary): void;

  /**
   * Get next dialogue content
   *
   * @return Content. Line, Option list or undefined.
   */
  getContent(): ContentReturnType;

  /**
   * Choose option by index. Option's index start in 0.
   *
   * @param index - Option index
   */
  choose(index: number): void;

  /**
   * set variable
   *
   * @param name - Variable name
   * @param value - Value
   */
  setVariable(name: string, value: any): void;

  /**
   * Return variable value
   * @param name - Variable name
   * @return variable value
   */
  getVariable(name: string): any;

  /**
   * Set callback to be used when requesting external variables
   */
  onExternalVariableFetch(callback: ((name: string) => any) | undefined): void;

  /**
   * Set callback to be used when an external variable is updated in the dialogue
   */
  onExternalVariableUpdate(callback: ((name: string, value: any) => void) | undefined): void;

  /**
   * Start dialogue from the begining
   *
   * @param [blockName] - Dialogue block to use
   */
  start(blockName?: string): void;
}

interface InterpreterOptions {
  // Separator used between suffixes when looking translation keys up.
  // default: &
  idSuffixLookupSeparator?: string;
  fileLoader?: (filePath: string) => RuntimeClydeDocumentRoot;
}

type WorkingDoc = Omit<RuntimeClydeDocumentRoot, "type"> & { type: "document" | "linked_document" } & WorkingNode & DocExtraWorkingFields;

export type RuntimeClydeDocumentRoot = ClydeDocumentRoot & { docPath?: string };

/**
 * Clyde Interpreter
 */
export function Interpreter(
  clydeDoc: RuntimeClydeDocumentRoot,
  data?: any, dictionary: Dictionary  = {},
  interpreterOptions?: InterpreterOptions
): InterpreterInstance {
  const doc: WorkingDoc = clydeDoc as WorkingDoc;
  const docStack: Array<WorkingDoc> = [doc];
  const defaultFileLoader = (filePath: string) => {
    console.warn(`File link is not implemented. '${filePath}' not accessible.`)
    return new ClydeDocumentRoot();
  };
  const intOptions: InterpreterOptions = {
    idSuffixLookupSeparator: interpreterOptions?.idSuffixLookupSeparator || '&',
  };
  const fileLoader = interpreterOptions?.fileLoader || defaultFileLoader;

  let textDictionary = dictionary;
  let anchors: {[name: string]: any} = {
  };
  const listeners = Events();
  const mem = Memory(listeners, data);
  let stack: StackItem[];
  const logic = LogicInterpreter(mem);
  let docAnchors = doc.links;
  const loadedDocs: {[path: string]: WorkingDoc} = {};

  doc._index = "r";
  doc.anchors = {};
  doc.blocks.forEach((block: BlockNode & WorkingNode) => {
    block._index = `b_${block.name}`;
    anchors[block.name] = block;
    doc.anchors[block.name] = block;
  });

  const initializeStack = (root = doc) => {
    stack = [{
      current: root,
      contentIndex: -1
    }]
  };

  const nodeHandlers: { [type: string]: Function } = {
    'document': () => handleDocumentNode(),
    'linked_document': () => handleLinkedDoc(),
    'content': (node: ContentNode) => handleContentNode(node),
    'options': (node: OptionsNode) => handleOptionsNode(node),
    'option': (node: OptionNode) => handleOptionNode(node),
    'line': (node: LineNode) => handleLineNode(node),
    'action_content': (node: ActionContentNode) => handleActionContent(node),
    'conditional_content': (node: ConditionalContentNode, fallback: any) => handleConditionalContent(node, fallback),
    'match': (node: MatchBlockNode) => handleMatchBlock(node),
    'variations': (node: VariationsNode) => handleVariations(node),
    'block': (node: BlockNode) => handleBlockNode(node),
    'divert': (node: DivertNode) => handleDivert(node),
    'assignments': (node: AssignmentsNode) => handleAssignementNode(node),
    'events': (node: EventsNode) => handleEventNode(node),
    'error': (node: any) => { throw new Error(`Unkown node type "${node.type}"`) },
  };

  const shuffleWithMemory = (variations: VariationsNode & WorkingNode, mode: string ): number => {
    const SHUFFLE_VISITED_KEY = `${variations._index}_shuffle_visited`;
    const LAST_VISITED_KEY = `${variations._index}_last_index`;
    let visitedItems: string[] = mem.getInternalVariable(SHUFFLE_VISITED_KEY, []);
    const remainingOptions: (ContentNode & WorkingNode)[]  = variations.content.filter((a: ContentNode & WorkingNode) => !visitedItems.includes(a._index!));

    if (remainingOptions.length === 0) {
      if (mode === 'once') {
        return -1;
      }
      if (mode === 'cycle') {
        mem.setInternalVariable(SHUFFLE_VISITED_KEY, []);
        return shuffleWithMemory(variations, mode);
      }
      return mem.getInternalVariable(LAST_VISITED_KEY, -1);
    }

    const random = Math.floor(Math.random() * remainingOptions.length);
    const index = variations.content.indexOf(remainingOptions[random]);

    visitedItems.push(remainingOptions[random]._index!);

    mem.setInternalVariable(LAST_VISITED_KEY, index);
    mem.setInternalVariable(SHUFFLE_VISITED_KEY, visitedItems);

    return index;
  };

  const variationHandlers: { [type: string]: Function } = {
    'cycle': (variations: VariationsNode & WorkingNode) => {
      let current = mem.getInternalVariable(`${variations._index}`, -1);
      if (current < variations.content.length - 1) {
        current += 1;
      } else {
        current = 0
      }
      mem.setInternalVariable(`${variations._index}`, current);
      return current;
    },
    'once': (variations: VariationsNode & WorkingNode) => {
      const current = mem.getInternalVariable(`${variations._index}`, -1);
      const index = current + 1;
      if (index <= variations.content.length - 1) {
        mem.setInternalVariable(`${variations._index}`, index);
        return index;
      }
      return -1;
    },
    'sequence': (variations: VariationsNode & WorkingNode) => {
      let current = mem.getInternalVariable(`${variations._index}`, -1);
      if (current < variations.content.length - 1) {
        current += 1;
        mem.setInternalVariable(`${variations._index}`, current);
      }
      return current;
    },
    'shuffle': (variations: VariationsNode & WorkingNode): number => {
      return Math.floor(Math.random() * variations.content.length);
    },
    'shuffle sequence': (variations: VariationsNode) => {
      return shuffleWithMemory(variations, 'sequence');
    },
    'shuffle once': (variations: VariationsNode) => {
      return shuffleWithMemory(variations, 'once');
    },
    'shuffle cycle': (variations: VariationsNode) => {
      return shuffleWithMemory(variations, 'cycle');
    }
  };

  const handleNextNode = (node: any, fallback?: any) => (nodeHandlers[node.type] || nodeHandlers['error'])(node, fallback);

  const generateIndex = () => `${stackHead().current._index}_${stackHead().contentIndex}`;

  const addToStack = (node: any) => {
    if (stackHead().current !== node) {
      stack.push({
        current: node,
        contentIndex: -1
      })
    }
  };

  const handleDocumentNode = (): ContentReturnType => {
    const node = stackHead();
    const contentIndex = node.contentIndex + 1;
    if (contentIndex < node.current.content.length) {
      node.contentIndex = contentIndex
      return handleNextNode(node.current.content[contentIndex]);
    }
    return { type: 'end' };
  }

  const handleContentNode = (contentNode: ContentNode & WorkingNode): ContentReturnType => {
    if (stackHead().current !== contentNode) {
      if (!contentNode._index) {
        contentNode._index = generateIndex();
      }
      stack.push({
        current: contentNode,
        contentIndex: -1
      })
    }

    const node = stackHead();
    const contentIndex = node.contentIndex + 1;
    if (contentIndex < node.current.content.length) {
      node.contentIndex = contentIndex
      return handleNextNode(node.current.content[contentIndex]);
    }
    stack.pop();
    return handleNextNode(stackHead().current);
  };

  const handleBlockNode = (block: BlockNode): ContentReturnType => {
    addToStack(block);

    const node = stackHead();
    const contentIndex = node.contentIndex + 1;

    if (contentIndex < node.current.content.content.length) {
      node.contentIndex = contentIndex
      return handleNextNode(node.current.content.content[contentIndex]);
    }

    return EndObject();
  };

  const handleDivert = (divert: DivertNode): ContentReturnType => {
    if (divert.target instanceof Object) {
      return divertToLinkedDoc(divert.target);
    }

    if (divert.target === '<parent>') {

      while (!['document', 'block', 'option', 'options', 'linked_document'].includes(stackHead().current.type)) {
        stack.pop();
      }

      if (stack.length > 1) {
        stack.pop();
        return handleNextNode(stackHead().current);
      }
      return EndObject();
    }

    if (divert.target === '<end>') {
      initializeStack();
      stackHead().contentIndex = stackHead().current.content.length;
      return EndObject();
    } 

    return handleNextNode(anchors[divert.target]);
  };

  const divertToLinkedDoc = (target: any): ContentReturnType => {
    if (!docAnchors[target.link]) {
      console.error(`Could not divert to '${target.link}'. Link not found.`);
      return EndObject();
    }
    const docPath: string = docAnchors[target.link];
    let docNode: WorkingDoc;
    let actualPath = docPath;

    if (docPath.startsWith("./") || docPath.startsWith("../")) {
      const currentDoc = docStack[docStack.length - 1];
      actualPath = path.join(path.dirname(currentDoc.docPath || ""), docPath);
    }

    if (loadedDocs[actualPath]) {
      docNode = loadedDocs[actualPath];
    } else {
      const doc = fileLoader(actualPath);
      if (!doc) {
        console.error(`Could not load file '${actualPath}'.`);
        return EndObject();
      }
      const workingDoc: WorkingDoc = {
        ...doc,
        _index: target.link,
        type: "linked_document",
        anchors: {},
      }
      workingDoc.blocks.forEach((block: BlockNode & WorkingNode) => {
        block._index = `b_${block.name}`;
        anchors[block.name] = block;
        workingDoc.anchors[block.name] = block;
      });
      docNode = workingDoc;
      loadedDocs[actualPath] = docNode;
    }

    docStack.push(docNode);
    anchors = docNode.anchors;
    docAnchors = docNode.links;
    addToStack(loadedDocs[actualPath]);

    if (target.block == "") {
      return handleDocumentNode();
    } else if (anchors[target.block]) {
      return handleNextNode(anchors[target.block]);
    } else {
      return EndObject();
    }
  };

  const handleLinkedDoc = () => {
      docStack.pop();
      const docNode = docStack[docStack.length - 1];
      anchors = docNode.anchors;
      docAnchors = docNode.links;
      stack.pop();
      return handleNextNode(stackHead().current);
  };

  const handleAssignementNode = (assignment: AssignmentsNode) => {
    assignment.assignments.forEach(logic.handleAssignement);
    return handleNextNode(stackHead().current);
  };

  const handleEventNode = (events: EventsNode) => {
    triggerEvents(events);
    return handleNextNode(stackHead().current);
  };

  const handleOptionsNode = (optionsNode: OptionsNode & WorkingNode): DialogueOptions => {
    if (!optionsNode._index) {
      optionsNode._index = generateIndex();
      mem.setInternalVariable('OPTIONS_COUNT', optionsNode.content.length);
    }
    addToStack(optionsNode);
    const options = getVisibleOptions(optionsNode);
    mem.setInternalVariable('OPTIONS_COUNT', options.length);

    if (options.length === 0) {
      stack.pop();
      return handleNextNode(stackHead().current);
    }

    if (options.length === 1 && options[0].mode === 'fallback') {
      selectOption(0);
      return handleNextNode(stackHead().current);
    }
    return {
      type: 'options',
      speaker: optionsNode.speaker,
      id: optionsNode.id,
      tags: optionsNode.tags,
      text: replaceVariables(translateText(optionsNode.name as string, optionsNode.id, optionsNode.id_suffixes)),
      options: options.map((t: ActionContentNode | OptionNode) => t.type === 'action_content' ? t.content : t).map((t: OptionNode & WorkingNode) => ({
        text: replaceVariables(translateText(t.name!, t.id, t.id_suffixes)),
        speaker: t.speaker,
        tags: t.tags,
        id: t.id,
        visited: mem.wasAlreadyAccessed(t._index!),
      }))
    };
  };

  const handleOptionNode = (_optionNode: OptionNode) => {
    // this is called when the contents inside the option
    // were read. option list default behavior is to quit
    // so we need to remove both option and option list from the stack.
    stack.pop();
    stack.pop();
    return handleNextNode(stackHead().current);
  };

  const handleVariations = (variations: VariationsNode & WorkingNode, attempt = 0 ): ContentReturnType => {
    if (!variations._index) {
      variations._index = generateIndex();
      variations.content.forEach((c: ContentNode & WorkingNode, index: number) => {
        c._index = `${generateIndex()}_${index}`;
      });
    }

    const next = variationHandlers[variations.mode](variations);

    if (next === -1 || attempt > variations.content.length) {
      return handleNextNode(stackHead().current);
    }

    if (variations.content[next].content.length === 1 && variations.content[next].content[0].type === 'conditional_content') {
      if (!logic.checkCondition(variations.content[next].content[0].conditions)) {
        return handleVariations(variations, attempt + 1);
      }
    }

    return handleNextNode(variations.content[next]);
  };


  const handleLineNode = (lineNode: LineNode & WorkingNode): DialogueLine => {
    if (!lineNode._index) {
      lineNode._index = generateIndex();
    }
    return {
      type: 'line',
      tags: lineNode.tags,
      id: lineNode.id,
      speaker: lineNode.speaker,
      text: replaceVariables(translateText(lineNode.value, lineNode.id, lineNode.id_suffixes))
    };
  }

  const handleActionContent = (actionNode: ActionContentNode) => {
    handleAction(actionNode);
    return handleNextNode(actionNode.content);
  };

  const handleAction = (actionNode: ActionContentNode) => {
    if (actionNode.action.type === 'events') {
      triggerEvents(actionNode.action as EventsNode);
    } else {
      (actionNode.action as AssignmentsNode).assignments.forEach(logic.handleAssignement)
    }
  }

  const triggerEvents = (events: EventsNode) => {
    events.events.forEach((event: EventNode) => {
      listeners.triggerEvent(
        EventType.EVENT_TRIGGERED,
        {
          name: event.name,
          parameters: event.params?.map(logic.getNodeValue),
        }
      );
    });
  }

  const handleConditionalContent = (conditionalNode: ConditionalContentNode, fallbackNode = stackHead().current) => {
    if (logic.checkCondition(conditionalNode.conditions)) {
      return handleNextNode(conditionalNode.content);
    }
    return handleNextNode(fallbackNode);
  };

  const handleMatchBlock = (node: MatchBlockNode) => {
    const conditionValue = logic.getNodeValue(node.condition);

    for (let branch of node.branches) {
      const branchValue = logic.getNodeValue((branch.check));

      if (conditionValue === branchValue) {
        return handleNextNode(branch.content);
      }
    }

    if (node.default_branch) {
      return handleNextNode(node.default_branch);
    }

    return handleNextNode(stackHead().current);
  };

  const selectOption = (contentIndex: number): void => {
    const node = stackHead();
    if (node.current.type === 'options') {
      const content = getVisibleOptions(node.current);

      if (contentIndex >= content.length) {
        throw new Error(`Index ${contentIndex} not available.`)
      }

      mem.setAsAccessed(`${content[contentIndex]._index}`);
      mem.setInternalVariable('OPTIONS_COUNT', getVisibleOptions(node.current).length);
      (content[contentIndex].content as (ContentNode & WorkingNode))._index = content[contentIndex]._index;

      if (content[contentIndex].type === 'action_content') {
        handleAction(content[contentIndex] as ActionContentNode);
        addToStack(content[contentIndex].content);
        addToStack(content[contentIndex].content.content);
      } else {
        addToStack(content[contentIndex]);
        addToStack(content[contentIndex].content);
      }

    } else {
      throw new Error('Nothing to select.');
    }
  }

  const stackHead = () => stack[stack.length - 1];

  const getVisibleOptions = (options: OptionsNode): ((OptionNode | WorkingActionContentNode) & WorkingNode)[] => {
    return options.content
      .map((o: any, index: number) => prepareOption(o, index))
      .filter((t: any) => {
        return t && !(t.mode === 'once' && mem.wasAlreadyAccessed(t._index));
      });
  };

  const prepareOption = (option: ( WorkingActionContentNode | ConditionalContentNode | OptionNode) & WorkingNode, index: number): any => {
    if (!option._index) {
      option._index = `${generateIndex()}_${index}`;
    }

    if (option.type === 'conditional_content') {
      option.content._index = option._index;
      if (logic.checkCondition(option.conditions)) {
        return prepareOption(option.content, index)
      }
      return;
    }

    if (option.type === 'action_content') {
      option.content._index = option._index;
      option.mode = option.content.mode;
      const content = prepareOption(option.content, index);
      if (!content) {
        return
      }
      return option;
    }
    return option;
  };

  const translateText = (text: string, id: string | undefined, idSuffixes?: string[]) => {
    if (idSuffixes) {
      const suffixes = idSuffixes.map(
        p => mem.getVariable(p)
      )
      .filter(Boolean)
      .join(intOptions.idSuffixLookupSeparator);

      const identifier = `${id}${intOptions.idSuffixLookupSeparator}${suffixes}`;
      if (textDictionary[identifier]) {
        return textDictionary[identifier];
      }
    }

    if (id && textDictionary[id]) {
      return textDictionary[id];
    }

    return text;
  };

  const replaceVariables = (text: string) => {
    if (text) {
      (text.match(/\%([A-z0-9@]*)\%/g) || [])
        .map(match => {
          const name = match.replace(/\%/g, '');
          let value: any;
          value = mem.getVariable(name);
          return { name: match, value };
        })
        .forEach( variable => {
          text = text.replace(variable.name, variable.value === undefined ? '' : variable.value);
        });
    }
    return text;
  };

  initializeStack();

  return {
    on(eventName: EventType, callback: Function): Function {
      return listeners.addListener(eventName, callback);
    },

    off(eventName: EventType, callback: Function): void {
      listeners.removeListener(eventName, callback);
    },

    getData(): DialogueData {
      return mem.getAll();
    },

    loadData(data: DialogueData) {
      mem.load(data);
    },

    clearData(): void {
      mem.clear();
    },

    loadDictionary(dictionary: Dictionary) {
      textDictionary = dictionary;
    },

    getContent(): ContentReturnType {
      return handleNextNode(stackHead().current)
    },

    choose(index: number): void {
      selectOption(index)
    },

    setVariable(name: string, value: any): void {
      mem.setVariable(name, value);
    },

    getVariable(name: string): any {
      return mem.getVariable(name);
    },

    onExternalVariableFetch(callback: ((name: string) => any) | undefined): void {
      mem.onExternalVariableFetch(callback);
    },

    onExternalVariableUpdate(callback: ((name: string, value: any) => void) | undefined): void {
      mem.onExternalVariableUpdate(callback);
    },

    start(blockName?: string): void {
      if (blockName) {
        initializeStack(anchors[blockName]);
      } else {
        initializeStack();
      }
    }
  }
}

