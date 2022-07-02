import { LogicInterpreter } from'./logic_interpreter';
import { Memory, InternalMemory } from './memory';
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
} from '@clyde-lang/parser';

type StackItem = {
  current: any,
  contentIndex: number,
};

type WorkingNode = {
  _index?: number,
}

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
  name?: string;
  speaker?: string;
  tags?: string[];
  id?: string;
};

export type DialogueOption = {
  label: string, 
  speaker?: string;
  tags?: string[];
  id?: string;
};

type ContentReturnType = DialogueLine | DialogueOptions | undefined;

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
  getData(): InternalMemory;

  /**
   * Load internal data
   *
   * @param data
   */
  loadData(data: InternalMemory): void;

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
  getContent(): DialogueLine | DialogueOptions | undefined;

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
   * Start dialogue from the begining
   *
   * @param [blockName] - Dialogue block to use
   */
  start(blockName?: string): void;
}

/**
 * Clyde Interpreter
 */
export function Interpreter(clydeDoc: ClydeDocumentRoot, data?: any, dictionary: Dictionary  = {}): InterpreterInstance {
  const doc: ClydeDocumentRoot & WorkingNode = clydeDoc;
  let textDictionary = dictionary;
  const anchors: {[name: string]: any} = {
  };
  const listeners = Events();
  const mem = Memory(listeners, data);
  let stack: StackItem[];
  const logic = LogicInterpreter(mem);

  doc._index = 1;
  doc.blocks.forEach((block: BlockNode & WorkingNode, index: number) => {
    block._index = index + 2;
    anchors[block.name] = block;
  });

  const initializeStack = (root = doc) => {
    stack = [{
      current: root,
      contentIndex: -1
    }]
  };

  const nodeHandlers: { [type: string]: Function } = {
    'document': () => handleDocumentNode(),
    'content': (node: ContentNode) => handleContentNode(node),
    'options': (node: OptionsNode) => handleOptionsNode(node),
    'option': (node: OptionNode) => handleOptionNode(node),
    'line': (node: LineNode) => handleLineNode(node),
    'action_content': (node: ActionContentNode) => handleActionContent(node),
    'conditional_content': (node: ConditionalContentNode, fallback: any) => handleConditionalContent(node, fallback),
    'variations': (node: VariationsNode) => handleVariations(node),
    'block': (node: BlockNode) => handleBlockNode(node),
    'divert': (node: DivertNode) => handleDivert(node),
    'assignments': (node: AssignmentsNode) => handleAssignementNode(node),
    'events': (node: EventsNode) => handleEventNode(node),
    'error': (node: any) => { throw new Error(`Unkown node type "${node.type}"`) },
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
    'shuffle': (variations: VariationsNode & WorkingNode, mode = 'cycle' ): number => {
      const SHUFFLE_VISITED_KEY = `${variations._index}_shuffle_visited`;
      const LAST_VISITED_KEY = `${variations._index}_last_index`;
      let visitedItems: number[] = mem.getInternalVariable(SHUFFLE_VISITED_KEY, []);
      const remainingOptions: (ContentNode & WorkingNode)[]  = variations.content.filter((a: ContentNode & WorkingNode) => !visitedItems.includes(a._index!));

      if (remainingOptions.length === 0) {
        if (mode === 'once') {
          return -1;
        }
        if (mode === 'cycle') {
          mem.setInternalVariable(SHUFFLE_VISITED_KEY, []);
          return variationHandlers['shuffle'](variations, mode);
        }
        return mem.getInternalVariable(LAST_VISITED_KEY, -1);
      }

      const random = Math.floor(Math.random() * remainingOptions.length);
      const index = variations.content.indexOf(remainingOptions[random]);

      visitedItems.push(remainingOptions[random]._index!);

      mem.setInternalVariable(LAST_VISITED_KEY, index);
      mem.setInternalVariable(SHUFFLE_VISITED_KEY, visitedItems);

      return index;
    },
    'shuffle sequence': (variations: VariationsNode) => {
      return variationHandlers['shuffle'](variations, 'sequence');
    },
    'shuffle once': (variations: VariationsNode) => {
      return variationHandlers['shuffle'](variations, 'once');
    },
    'shuffle cycle': (variations: VariationsNode) => {
      return variationHandlers['shuffle'](variations, 'cycle');
    }
  };

  const handleNextNode = (node: any, fallback?: any) => (nodeHandlers[node.type] || nodeHandlers['error'])(node, fallback);

  const generateIndex = () => (10 * stackHead().current._index) + stackHead().contentIndex;

  const addToStack = (node: any) => {
    if (stackHead().current !== node) {
      stack.push({
        current: node,
        contentIndex: -1
      })
    }
  };

  const handleDocumentNode = () => {
    const node = stackHead();
    const contentIndex = node.contentIndex + 1;
    if (contentIndex < node.current.content.length) {
      node.contentIndex = contentIndex
      return handleNextNode(node.current.content[contentIndex]);
    }
  }

  const handleContentNode = (contentNode: ContentNode & WorkingNode) => {
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

  const handleBlockNode = (block: BlockNode) => {
    addToStack(block);

    const node = stackHead();
    const contentIndex = node.contentIndex + 1;

    if (contentIndex < node.current.content.content.length) {
      node.contentIndex = contentIndex
      return handleNextNode(node.current.content.content[contentIndex]);
    }
  };

  const handleDivert = (divert: DivertNode) => {
    if (divert.target === '<parent>') {

      while (!['document', 'block', 'option', 'options'].includes(stackHead().current.type)) {
        stack.pop();
      }

      if (stack.length > 1) {
        stack.pop();
        return handleNextNode(stackHead().current);
      }
    } else if (divert.target === '<end>') {
      initializeStack();
      stackHead().contentIndex = stackHead().current.content.length;
    } else {
      return handleNextNode(anchors[divert.target]);
    }
  };

  const handleAssignementNode = (assignment: AssignmentsNode) => {
    assignment.assignments.forEach(logic.handleAssignement);
    return handleNextNode(stackHead().current);
  };

  const handleEventNode = (events: EventsNode) => {
    events.events.forEach((event: EventNode) => {
      listeners.triggerEvent(
        EventType.EVENT_TRIGGERED,
        { name: event.name });
    });
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
      name: replaceVariables(translateText(optionsNode.name as string, optionsNode.id, optionsNode.id_suffixes)),
      options: options.map((t: ActionContentNode | OptionNode) => t.type === 'action_content' ? t.content : t).map((t: OptionNode) => ({
        label: replaceVariables(translateText(t.name!, t.id, t.id_suffixes)),
        speaker: t.speaker,
        tags: t.tags,
        id: t.id
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
        c._index = generateIndex() * 100 + index;
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
      (actionNode.action as EventsNode).events.forEach((event: EventNode) => {
        listeners.triggerEvent(
          EventType.EVENT_TRIGGERED,
          { name: event.name });
      });
    } else {
      (actionNode.action as AssignmentsNode).assignments.forEach(logic.handleAssignement)
    }
  }

  const handleConditionalContent = (conditionalNode: ConditionalContentNode, fallbackNode = stackHead().current) => {
    if (logic.checkCondition(conditionalNode.conditions)) {
      return handleNextNode(conditionalNode.content);
    }
    return handleNextNode(fallbackNode);
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
      option._index = generateIndex() * 100 + index;
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
      let identifier = `${id}&${idSuffixes.map(p => mem.getVariable(p)).filter(Boolean).join('&')}`;
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
      (text.match(/\%([A-z0-9]*)\%/g) || [])
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

    getData(): InternalMemory {
      return mem.getAll();
    },

    loadData(data: InternalMemory) {
      mem.load(data);
    },

    clearData(): void {
      mem.clear();
    },

    loadDictionary(dictionary: Dictionary) {
      textDictionary = dictionary;
    },

    getContent(): DialogueLine | DialogueOptions | undefined {
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

    start(blockName?: string): void {
      if (blockName) {
        initializeStack(anchors[blockName]);
      } else {
        initializeStack();
      }
    }
  }
}

