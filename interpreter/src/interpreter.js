function Interpreter(doc) {
  const mem = {
    access: {}
  };
  const stack = [{
    current: doc,
    index: -1
  }];

  const getNextNode = (node) => {
    if (node.type === 'document') {
      return handleDocumentNode();
    } else if (node.type === 'content') {
      return handleContentNode(node);
    } else if (node.type === 'options') {
      return handleOptionsNode(node);
    } else if (node.type === 'line') {
      return handleLineNode(node);
    }
  };

  const handleDocumentNode = () => {
    const node = stackHead();
    const index = node.index + 1;
    if (index < node.current.content.length) {
      node.index = index
      return getNextNode(node.current.content[index]);
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
      return getNextNode( node.current.content[index]);
    }
    stack.pop();
    return getNextNode(stackHead().current);
  };

  const handleOptionsNode = (optionsNode) => {
    if (stackHead().current !== optionsNode) {
      stack.push({
        current: optionsNode,
        index: -1
      })
    }
    const options = getVisibleOptions(optionsNode);
    return { type: 'options', name: optionsNode.name, options: options.map((t) => ({label: t.name}))};
  };

  const handleLineNode = (lineNode) => {
    return { type: 'dialog', id: lineNode.id, speaker: lineNode.speaker, text: lineNode.value };
  }

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

  return {
    getContent() {
      const head = stackHead();
      if (head) {
        return getNextNode(head.current)
      }
    },
    choose(index) {
      return selectOption(index)
    }
  }
}

module.exports = { Interpreter }
