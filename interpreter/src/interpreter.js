const LogicInterpreter = require('./logic_interpreter');

function Interpreter(doc) {
  const mem = {
    access: {},
    variables: {},
  };
  const stack = [{
    current: doc,
    contentIndex: -1
  }];
  doc._index = 1;
  const logic = LogicInterpreter(mem);

  const nodeHandlers = {
    'document': () => handleDocumentNode(),
    'content': node => handleContentNode(node),
    'options': node => handleOptionsNode(node),
    'line': node => handleLineNode(node),
    'action_content': node => handleActionContent(node),
    'conditional_content': node => handleConditionalContent(node),
    'alternatives': node => handleAlternatives(node),
    'error': node => { throw new Error(`Unkown node type "${node.type}"`) }
  }

  const handleNextNode = node => (nodeHandlers[node.type] || nodeHandlers['error'])(node);

  const generateIndex = () => (10 * stackHead().current._index) + stackHead().contentIndex;


  const handleDocumentNode = () => {
    const node = stackHead();
    const contentIndex = node.contentIndex + 1;
    if (contentIndex < node.current.content.length) {
      node.contentIndex = contentIndex
      return handleNextNode(node.current.content[contentIndex]);
    }

    stack.pop();
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

  const handleOptionsNode = (optionsNode) => {
    if (stackHead().current !== optionsNode) {
      optionsNode._index = generateIndex();
      stack.push({
        current: optionsNode,
        contentIndex: -1
      })
    }
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

  const handleConditionalContent = (conditionalNode) => {
    if (logic.checkCondition(conditionalNode.conditions)) {
      return handleNextNode(conditionalNode.content);
    }
    return handleNextNode(stackHead().current);
  };

  const selectOption = (contentIndex) => {
    const node = stackHead();
    if (node.current.type === 'options') {
      const content = getVisibleOptions(node.current);

      if (contentIndex >= content.length) {
        throw new Error(`Index ${contentIndex} not available.`)
      }

      setAsAccessed(content[contentIndex]._index);
      stack.push({
        current: content[contentIndex].content,
        contentIndex: -1
      })
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
        const value = mem.variables[name];
        return { name: match, value };
      })
      .forEach( variable => {
        text = text.replace(variable.name, variable.value);
      });
    return text;
  };

  return {
    getContent() {
      const head = stackHead();
      if (head) {
        return handleNextNode(head.current)
      }
    },
    choose(index) {
      return selectOption(index)
    },
    setVariable(name, value) {
      mem.variables[name] = value;
    },
    getVariable(name) {
      return mem.variables[name];
    }
  }
}

module.exports = { Interpreter }
