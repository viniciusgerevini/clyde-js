const LogicInterpreter = require('./logic_interpreter');

function Interpreter(doc) {
  const anchors = {
  };

  const mem = {
    access: {},
    variables: {},
    internal: {}
  };
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
    'error': node => { throw new Error(`Unkown node type "${node.type}"`) },
  };

  const alternativeHandlers = {
    'cycle': (alternatives) => {
      let current = getInternalVariable(alternatives._index, -1);
      if (current < alternatives.content.content.length - 1) {
        current += 1;
      } else {
        current = 0
      }
      setInternalVariable(alternatives._index, current);
      return current;
    },
    'once': (alternatives) => {
      const current = getInternalVariable(alternatives._index, -1);
      const index = current + 1;
      if (index <= alternatives.content.content.length - 1) {
        setInternalVariable(alternatives._index, index);
        return index;
      }
      return -1;
    },
    'sequence': (alternatives) => {
      let current = getInternalVariable(alternatives._index, -1);
      if (current < alternatives.content.content.length - 1) {
        current += 1;
        setInternalVariable(alternatives._index, current);
      }
      return current;
    },
    'shuffle': (alternatives, mode = 'sequence' ) => {
      const SHUFFLE_VISITED_KEY = `${alternatives._index}_shuffle_visited`;
      const LAST_VISITED_KEY = `${alternatives._index}_last_index`;
      let visitedItems = getInternalVariable(SHUFFLE_VISITED_KEY, []);
      const remainingOptions = alternatives.content.content.filter(a => !visitedItems.includes(a._index));

      if (remainingOptions.length === 0) {
        if (mode === 'once') {
          return -1;
        }
        if (mode === 'cycle') {
          setInternalVariable(SHUFFLE_VISITED_KEY, []);
          return alternativeHandlers['shuffle'](alternatives, mode);
        }
        return getInternalVariable(LAST_VISITED_KEY, -1);
      }

      const random = Math.floor(Math.random() * remainingOptions.length);
      const index = alternatives.content.content.indexOf(remainingOptions[random]);
      visitedItems.push(remainingOptions[random]._index);

      setInternalVariable(LAST_VISITED_KEY, index);
      setInternalVariable(SHUFFLE_VISITED_KEY, visitedItems);

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
      stack.pop();

      return handleNextNode(stackHead().current);
    } else {
      return handleNextNode(anchors[divert.target]);
    }
  };

  const handleOptionsNode = (optionsNode) => {
    if (!optionsNode._index) {
      optionsNode._index = generateIndex();
    }
    addToStack(optionsNode);
    const options = getVisibleOptions(optionsNode);

    return {
      type: 'options',
      speaker: optionsNode.speaker,
      ...(optionsNode.id ?{ id: optionsNode.id }:{}),
      name: optionsNode.name,
      options: options.map((t) => ({
        label: t.name,
        ...(t.id ?{ id: t.id }:{})
      }))
    };
  };

  const handleOptionNode = (optionNode) => {
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
      ...(lineNode.id ? { id: lineNode.id } : {}),
      ...(lineNode.speaker ? { speaker: lineNode.speaker } : {}),
      text: replaceVariables(lineNode.value)
    };
  }

  const handleActionContent = (actionNode) => {
    actionNode.action.assignments.forEach(logic.handleAssignement)
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

      setAsAccessed(content[contentIndex]._index);

      addToStack(content[contentIndex]);
      addToStack(content[contentIndex].content);
    } else {
      throw new Error('Nothing to select.');
    }
  }

  const stackHead = () => stack[stack.length - 1];

  const setAsAccessed = (id) => {
    mem.access[id] = true;
  };

  const wasAlreadyAccessed = (id) => {
    return !!mem.access[id];
  }

  const getVariable = (id) => {
    return mem.variables[id];
  };

  const setVariable = (id, value) => {
    mem.variables[id] = value;
  };

  const setInternalVariable = (id, value) => {
    mem.internal[id] = value;
  };

  const getInternalVariable = (id, defaultValue) => {
    const value = mem.internal[id];
    if (value === undefined) {
      return defaultValue;
    }
    return value;
  };

  const getVisibleOptions = (options) => {
    return options.content.filter((t, index) => {
      if (!t._index) {
        t._index = generateIndex() * 100 + index;
      }
      return !(t.mode === 'once' && wasAlreadyAccessed(t._index));
    });
  };

  const replaceVariables = (text) => {
    (text.match(/\%([A-z0-9]*)\%/g) || [])
      .map(match => {
        const name = match.replace(/\%/g, '');
        const value = getVariable(name);
        return { name: match, value };
      })
      .forEach( variable => {
        text = text.replace(variable.name, variable.value);
      });
    return text;
  };


  initializeStack();

  return {
    getContent() {
      return handleNextNode(stackHead().current)
    },
    choose(index) {
      return selectOption(index)
    },
    setVariable(name, value) {
      setVariable(name, value);
    },
    getVariable(name) {
      return getVariable(name);
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

module.exports = { Interpreter }
