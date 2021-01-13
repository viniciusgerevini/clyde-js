import { LogicInterpreter } from'./logic_interpreter.js';
import { Memory } from './memory.js';
import { Events, events } from './events.js';

export { events } from './events.js';

export function Interpreter(doc, data, dictionary = {}) {
  let textDictionary = dictionary;
  const anchors = {
  };
  const listeners = Events();
  const mem = Memory(listeners, data);
  let stack;
  const logic = LogicInterpreter(mem);


  doc._index = 1;
  doc.blocks.forEach((block, index) => {
    block._index = index + 2;
    anchors[block.name] = block;
  });

  const initializeStack = (root = doc) => {
    stack = [{
      current: root,
      contentIndex: -1
    }]
  };

  const nodeHandlers = {
    'document': () => handleDocumentNode(),
    'content': node => handleContentNode(node),
    'options': node => handleOptionsNode(node),
    'option': node => handleOptionNode(node),
    'line': node => handleLineNode(node),
    'action_content': node => handleActionContent(node),
    'conditional_content': (node, fallback) => handleConditionalContent(node, fallback),
    'alternatives': node => handleAlternatives(node),
    'block': node => handleBlockNode(node),
    'divert': node => handleDivert(node),
    'assignments': node => handleAssignementNode(node),
    'event': node => handleEventNode(node),
    'error': node => { throw new Error(`Unkown node type "${node.type}"`) },
  };

  const alternativeHandlers = {
    'cycle': (alternatives) => {
      let current = mem.getInternalVariable(alternatives._index, -1);
      if (current < alternatives.content.content.length - 1) {
        current += 1;
      } else {
        current = 0
      }
      mem.setInternalVariable(alternatives._index, current);
      return current;
    },
    'once': (alternatives) => {
      const current = mem.getInternalVariable(alternatives._index, -1);
      const index = current + 1;
      if (index <= alternatives.content.content.length - 1) {
        mem.setInternalVariable(alternatives._index, index);
        return index;
      }
      return -1;
    },
    'sequence': (alternatives) => {
      let current = mem.getInternalVariable(alternatives._index, -1);
      if (current < alternatives.content.content.length - 1) {
        current += 1;
        mem.setInternalVariable(alternatives._index, current);
      }
      return current;
    },
    'shuffle': (alternatives, mode = 'sequence' ) => {
      const SHUFFLE_VISITED_KEY = `${alternatives._index}_shuffle_visited`;
      const LAST_VISITED_KEY = `${alternatives._index}_last_index`;
      let visitedItems = mem.getInternalVariable(SHUFFLE_VISITED_KEY, []);
      const remainingOptions = alternatives.content.content.filter(a => !visitedItems.includes(a._index));

      if (remainingOptions.length === 0) {
        if (mode === 'once') {
          return -1;
        }
        if (mode === 'cycle') {
          mem.setInternalVariable(SHUFFLE_VISITED_KEY, []);
          return alternativeHandlers['shuffle'](alternatives, mode);
        }
        return mem.getInternalVariable(LAST_VISITED_KEY, -1);
      }

      const random = Math.floor(Math.random() * remainingOptions.length);
      const index = alternatives.content.content.indexOf(remainingOptions[random]);
      visitedItems.push(remainingOptions[random]._index);

      mem.setInternalVariable(LAST_VISITED_KEY, index);
      mem.setInternalVariable(SHUFFLE_VISITED_KEY, visitedItems);

      return index;
    },
    'shuffle sequence': (alternatives) => {
      return alternativeHandlers['shuffle'](alternatives, 'sequence');
    },
    'shuffle once': (alternatives) => {
      return alternativeHandlers['shuffle'](alternatives, 'once');
    },
    'shuffle cycle': (alternatives) => {
      return alternativeHandlers['shuffle'](alternatives, 'cycle');
    }
  };

  const handleNextNode = (node, fallback) => (nodeHandlers[node.type] || nodeHandlers['error'])(node, fallback);

  const generateIndex = () => (10 * stackHead().current._index) + stackHead().contentIndex;

  const addToStack = (node) => {
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

  const handleContentNode = (contentNode) => {
    if (stackHead().current !== contentNode) {
      contentNode._index = generateIndex();
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

  const handleBlockNode = (block) => {
    addToStack(block);

    const node = stackHead();
    const contentIndex = node.contentIndex + 1;

    if (contentIndex < node.current.content.content.length) {
      node.contentIndex = contentIndex
      return handleNextNode(node.current.content.content[contentIndex]);
    }
  };

  const handleDivert = (divert) => {
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

  const handleAssignementNode = (assignment) => {
    assignment.assignments.forEach(logic.handleAssignement)
    return handleNextNode(stackHead().current);
  };

  const handleEventNode = (event) => {
    listeners.triggerEvent(listeners.events.EVENT_TRIGGERED, { name: event.name });
    return handleNextNode(stackHead().current);
  };

  const handleOptionsNode = (optionsNode) => {
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

    return {
      type: 'options',
      speaker: optionsNode.speaker,
      id: optionsNode.id,
      tags: optionsNode.tags,
      name: replaceVariables(translateText(optionsNode.name, optionsNode.id)),
      options: options.map((t) => ({
        label: replaceVariables(translateText(t.name, t.id)),
        speaker: t.speaker,
        tags: t.tags,
        id: t.id
      }))
    };
  };

  const handleOptionNode = (_optionNode) => {
    // this is called when the contents inside the option
    // were read. option list default behavior is to quit
    // so we need to remove both option and option list from the stack.
    stack.pop();
    stack.pop();
    return handleNextNode(stackHead().current);
  };

  const handleAlternatives = (alternatives) => {
    if (!alternatives._index) {
      alternatives._index = generateIndex();
      alternatives.content.content.forEach((c, index) => {
        c._index = generateIndex() * 100 + index;
      });
    }

    const next = alternativeHandlers[alternatives.mode](alternatives);

    if (next === -1) {
      return handleNextNode(stackHead().current);
    }

    return handleNextNode(alternatives.content.content[next], alternatives);
  };

  const handleLineNode = (lineNode) => {
    if (!lineNode._index) {
      lineNode._index = generateIndex();
    }
    return {
      type: 'dialogue',
      tags: lineNode.tags,
      id: lineNode.id,
      speaker: lineNode.speaker,
      text: replaceVariables(translateText(lineNode.value, lineNode.id))
    };
  }

  const handleActionContent = (actionNode) => {
    if (actionNode.action.type === 'event') {
      listeners.triggerEvent(listeners.events.EVENT_TRIGGERED, { name: actionNode.action.name });
    } else {
      actionNode.action.assignments.forEach(logic.handleAssignement)
    }
    return handleNextNode(actionNode.content);
  };

  const handleConditionalContent = (conditionalNode, fallbackNode = stackHead().current) => {
    if (logic.checkCondition(conditionalNode.conditions)) {
      return handleNextNode(conditionalNode.content);
    }
    return handleNextNode(fallbackNode);
  };

  const selectOption = (contentIndex) => {
    const node = stackHead();
    if (node.current.type === 'options') {
      const content = getVisibleOptions(node.current);

      if (contentIndex >= content.length) {
        throw new Error(`Index ${contentIndex} not available.`)
      }

      mem.setAsAccessed(content[contentIndex]._index);
      mem.setInternalVariable('OPTIONS_COUNT', getVisibleOptions(node.current).length);
      content[contentIndex].content._index = content[contentIndex]._index;
      addToStack(content[contentIndex]);
      addToStack(content[contentIndex].content);
    } else {
      throw new Error('Nothing to select.');
    }
  }

  const stackHead = () => stack[stack.length - 1];

  const getVisibleOptions = (options) => {
    return options.content
      .map((option, index) => {
        if (!option._index) {
          option._index = generateIndex() * 100 + index;
        }
        if (option.type === 'conditional_content') {
          option.content._index = option._index;
          if (logic.checkCondition(option.conditions)) {
            return option.content;
          }
          return;
        }
        return option;
      })
      .filter((t) => {
        return t && !(t.mode === 'once' && mem.wasAlreadyAccessed(t._index));
      });
  };

  const translateText = (text, id) => {
    if (id && textDictionary[id]) {
      return textDictionary[id];
    }
    return text;
  };

  const replaceVariables = (text) => {
    if (text) {
      (text.match(/\%([A-z0-9]*)\%/g) || [])
        .map(match => {
          const name = match.replace(/\%/g, '');
          let value;
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
    events,
    on(eventName, callback) {
      return listeners.addListener(eventName, callback);
    },
    off(eventName, callback) {
      listeners.removeListener(eventName, callback);
    },
    getData() {
      return mem.getAll();
    },
    loadData(data) {
      mem.load(data);
    },
    clearData() {
      mem.clear();
    },
    loadDictionary(dictionary) {
      textDictionary = dictionary;
    },
    getContent() {
      return handleNextNode(stackHead().current)
    },
    choose(index) {
      return selectOption(index)
    },
    setVariable(name, value) {
      mem.setVariable(name, value);
    },
    getVariable(name) {
      return mem.getVariable(name);
    },
    begin(blockName) {
      if (blockName) {
        initializeStack(anchors[blockName]);
      } else {
        initializeStack();
      }
    }
  }
}

