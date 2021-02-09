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
    'variations': node => handleVariations(node),
    'block': node => handleBlockNode(node),
    'divert': node => handleDivert(node),
    'assignments': node => handleAssignementNode(node),
    'events': node => handleEventNode(node),
    'error': node => { throw new Error(`Unkown node type "${node.type}"`) },
  };

  const variationHandlers = {
    'cycle': (variations) => {
      let current = mem.getInternalVariable(variations._index, -1);
      if (current < variations.content.length - 1) {
        current += 1;
      } else {
        current = 0
      }
      mem.setInternalVariable(variations._index, current);
      return current;
    },
    'once': (variations) => {
      const current = mem.getInternalVariable(variations._index, -1);
      const index = current + 1;
      if (index <= variations.content.length - 1) {
        mem.setInternalVariable(variations._index, index);
        return index;
      }
      return -1;
    },
    'sequence': (variations) => {
      let current = mem.getInternalVariable(variations._index, -1);
      if (current < variations.content.length - 1) {
        current += 1;
        mem.setInternalVariable(variations._index, current);
      }
      return current;
    },
    'shuffle': (variations, mode = 'sequence' ) => {
      const SHUFFLE_VISITED_KEY = `${variations._index}_shuffle_visited`;
      const LAST_VISITED_KEY = `${variations._index}_last_index`;
      let visitedItems = mem.getInternalVariable(SHUFFLE_VISITED_KEY, []);
      const remainingOptions = variations.content.filter(a => !visitedItems.includes(a._index));

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

      visitedItems.push(remainingOptions[random]._index);

      mem.setInternalVariable(LAST_VISITED_KEY, index);
      mem.setInternalVariable(SHUFFLE_VISITED_KEY, visitedItems);

      return index;
    },
    'shuffle sequence': (variations) => {
      return variationHandlers['shuffle'](variations, 'sequence');
    },
    'shuffle once': (variations) => {
      return variationHandlers['shuffle'](variations, 'once');
    },
    'shuffle cycle': (variations) => {
      return variationHandlers['shuffle'](variations, 'cycle');
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

  const handleEventNode = (events) => {
    events.events.forEach(event => {
      listeners.triggerEvent(
        listeners.events.EVENT_TRIGGERED,
        { name: event.name });
    });
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

    if (options.length === 1 && options[0].mode === 'fallback') {
      selectOption(0);
      return handleNextNode(stackHead().current);
    }

    return {
      type: 'options',
      speaker: optionsNode.speaker,
      id: optionsNode.id,
      tags: optionsNode.tags,
      name: replaceVariables(translateText(optionsNode.name, optionsNode.id)),
      options: options.map(t => t.type === 'action_content' ? t.content : t).map((t) => ({
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

  const handleVariations = (variations, attempt = 0 ) => {
    if (!variations._index) {
      variations._index = generateIndex();
      variations.content.forEach((c, index) => {
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


  const handleLineNode = (lineNode) => {
    if (!lineNode._index) {
      lineNode._index = generateIndex();
    }
    return {
      type: 'line',
      tags: lineNode.tags,
      id: lineNode.id,
      speaker: lineNode.speaker,
      text: replaceVariables(translateText(lineNode.value, lineNode.id))
    };
  }

  const handleActionContent = (actionNode) => {
    handleAction(actionNode);
    return handleNextNode(actionNode.content);
  };

  const handleAction = (actionNode) => {
    if (actionNode.action.type === 'events') {
      actionNode.action.events.forEach(event => {
        listeners.triggerEvent(
          listeners.events.EVENT_TRIGGERED,
          { name: event.name });
      });
    } else {
      actionNode.action.assignments.forEach(logic.handleAssignement)
    }
  }

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

      if (content[contentIndex].type === 'action_content') {
        handleAction(content[contentIndex]);
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

  const getVisibleOptions = (options) => {
    return options.content
      .map(prepareOption)
      .filter((t) => {
        return t && !(t.mode === 'once' && mem.wasAlreadyAccessed(t._index));
      });
  };

  const prepareOption = (option, index) => {
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
    start(blockName) {
      if (blockName) {
        initializeStack(anchors[blockName]);
      } else {
        initializeStack();
      }
    }
  }
}

