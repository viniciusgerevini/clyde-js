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
    } else if (node.type === 'topics') {
      return handleTopicsNode(node);
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

  const handleTopicsNode = (topicsNode) => {
    if (stackHead().current !== topicsNode) {
      stack.push({
        current: topicsNode,
        index: -1
      })
    }
    const topics = getVisibleTopics(topicsNode);
    return { type: 'options', name: topicsNode.name, topics: topics.map((t) => ({label: t.name}))};
  };

  const handleLineNode = (lineNode) => {
    return { type: 'dialog', id: lineNode.id, speaker: lineNode.speaker, text: lineNode.value };
  }

  const selectTopic = (index) => {
    const node = stackHead();
    if (node.current.type === 'topics') {
      const content = getVisibleTopics(node.current);

      if (index >= content.length) {
        throw new Error(`Index ${index} not available.`)
      }

      const id = createTopicIdentifier(node.current, node.current.content[index]);
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

  const createTopicIdentifier = (parent, node) => {
    return `${parent.name}${node.name}${parent.content.length}${node.content.content.length}`;
  };

  const setAsAccessed = (id) => {
    mem.access[id] = true;
  };

  const wasAlreadyAccessed = (id) => {
    return !!mem.access[id];
  }

  const getVisibleTopics = (topics) => {
    return topics.content.filter((t) => {
      return !(t.mode === 'once' && wasAlreadyAccessed(createTopicIdentifier(topics, t)));
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
      return selectTopic(index)
    }
  }
}

module.exports = { Interpreter }
