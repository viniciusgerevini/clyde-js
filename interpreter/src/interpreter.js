const LogicInterpreter = require('./logic_interpreter');

function Interpreter(doc) {
  const mem = {
    access: {},
    variables: {},
  };
  const stack = [{
    current: doc,
    index: -1
  }];
  const logic = LogicInterpreter(mem);

  const nodeHandlers = {
    'document': () => handleDocumentNode(),
    'content': node => handleContentNode(node),
    'options': node => handleOptionsNode(node),
    'line': node => handleLineNode(node),
    'action_content': node => handleActionContent(node),
    'conditional_content': node => handleConditionalContent(node),
    'error': node => { throw new Error(`Unkown node type "${node.type}"`) }
  }

  const handleNextNode = node => (nodeHandlers[node.type] || nodeHandlers['error'])(node);


  const handleDocumentNode = () => {
    const node = stackHead();
    const index = node.index + 1;
    if (index < node.current.content.length) {
      node.index = index
      return handleNextNode(node.current.content[index]);
    }
    stack.pop();
  }

  const handleContentNode = (contentNode) => {
    if (stackHead().current !== contentNode) {
      stack.push({
        current: contentNode,
        index: -1
      })
    }

    const node = stackHead();
    const index = node.index + 1;
    if (index < node.current.content.length) {
      node.index = index
      return handleNextNode(node.current.content[index]);
    }
    stack.pop();
    return handleNextNode(stackHead().current);
  };

  const handleOptionsNode = (optionsNode) => {
    if (stackHead().current !== optionsNode) {
      stack.push({
        current: optionsNode,
        index: -1
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
    return {
      type: 'dialog',
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

  const selectOption = (index) => {
    const node = stackHead();
    if (node.current.type === 'options') {
      const content = getVisibleOptions(node.current);

      if (index >= content.length) {
        throw new Error(`Index ${index} not available.`)
      }

      const id = createOptionIdentifier(node.current, node.current.content[index]);
      setAsAccessed(id);
      stack.push({
        current: content[index].content,
        index: -1
      })
    } else {
      throw new Error('Nothing to select.');
    }
  }

  const stackHead = () => stack[stack.length - 1];

  const createOptionIdentifier = (parent, node) => {
    return `${parent.name}${node.name}${parent.content.length}${node.content.content.length}`;
  };

  const setAsAccessed = (id) => {
    mem.access[id] = true;
  };

  const wasAlreadyAccessed = (id) => {
    return !!mem.access[id];
  }

  const getVisibleOptions = (options) => {
    return options.content.filter((t) => {
      return !(t.mode === 'once' && wasAlreadyAccessed(createOptionIdentifier(options, t)));
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