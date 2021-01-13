import { render, fireEvent } from '@testing-library/react';
import Interpreter from './Interpreter';



describe('Interpreter component', () => {
  it('shows nothing when content is empty', () => {
    const { getByText } = render(<Interpreter/>);
    expect(getByText('Nothing to show.')).toBeInTheDocument();
  });

  it('renders all dialogue lines', () => {
    const content = 'Hello!\nHi\n';
    const timeline = [
      { type: 'dialogue', speaker: 'test', text: 'Hello!' },
      { type: 'INTERPRETER_INFO', text: 'Memory cleared' },
      { type: 'dialogue', text: 'Hi!' },
    ];
    const { getByText } = render(<Interpreter content={content} timeline={timeline}/>);

    expect(getByText('Hello!')).toBeInTheDocument();
    expect(getByText('Hi!')).toBeInTheDocument();
  });

  it('shows start message', () => {
    const content = 'Hello!\nHi\n';
    const timeline = [];
    const { getByText } = render(<Interpreter content={content} timeline={timeline}/>);

    expect(getByText('Dialogue not started.')).toBeInTheDocument();
  });

  it('get dialogue line when clicked on interpreter', () => {
    const addDialogueLineStub = jest.fn();
    const content = 'Hello!\nHi\n';
    const timeline = [];
    const { getByLabelText } = render(
      <Interpreter content={content} timeline={timeline} addDialogueLine={addDialogueLineStub}/>
    );
    fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));
    expect(addDialogueLineStub).toHaveBeenCalledWith({ type: 'dialogue', text: 'Hello!' });
  });

  it('shows end message when dialogue has ended', () => {
    const addDialogueLineStub = jest.fn();
    const content = 'Hello!\n';
    const timeline = [undefined];
    const { getByText, getByLabelText } = render(
      <Interpreter content={content} timeline={timeline} addDialogueLine={addDialogueLineStub}/>
    );
    fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));
    fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));

    expect(getByText('DIALOGUE ENDED')).toBeInTheDocument();
  });

  it('shows only last message when single dialogue bubble mode', () => {
    const content = 'Hello!\nHi\n';
    const timeline = [
      { type: 'dialogue', text: 'Hello!' },
      { type: 'dialogue', text: 'Hi!' },
    ];
    const { getByText, queryByText } = render(<Interpreter content={content} timeline={timeline} singleBubblePresentation={true}/>);

    expect(queryByText('Hello!')).not.toBeInTheDocument();
    expect(getByText('Hi!')).toBeInTheDocument();
  });

  it('selects option', () => {
    let timeline = [];
    const addDialogueLineStub = jest.fn().mockImplementation((line) => {
      timeline.push(line);
    });

    const chooseOptionStub = jest.fn();

    const content = `
>> what do you think?
  * yes
    nice!
  * no
    ok!
<<
`;

    const { rerender, getByText, getByLabelText } = render(
      <Interpreter
          content={content}
          timeline={timeline}
          chooseOption={chooseOptionStub}
          addDialogueLine={addDialogueLineStub}/>
    );

    fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));

    rerender(
      <Interpreter
          content={content}
          timeline={timeline}
          chooseOption={chooseOptionStub}
          addDialogueLine={addDialogueLineStub}/>
    );

    fireEvent.click(getByText(/yes/i));

    expect(chooseOptionStub).toHaveBeenCalledWith(0);
  });

  it('does not select option more than once', () => {
    let timeline = [];
    const addDialogueLineStub = jest.fn().mockImplementation((line) => {
      timeline.push(line);
    });

    const chooseOptionStub = jest.fn().mockImplementation((option) => {
      timeline[timeline.length - 1].selected = option;
    });

    const content = `
>> speaker: what do you think?
  * yes
    nice!
  * no
    ok!
<<
`;

    const { rerender, getByText, getByLabelText } = render(
      <Interpreter
          content={content}
          timeline={timeline}
          chooseOption={chooseOptionStub}
          addDialogueLine={addDialogueLineStub}/>
    );

    fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));

    rerender(
      <Interpreter
          content={content}
          timeline={timeline}
          chooseOption={chooseOptionStub}
          addDialogueLine={addDialogueLineStub}/>
    );

    fireEvent.click(getByText(/yes/i));

    rerender(
      <Interpreter
          content={content}
          timeline={timeline}
          chooseOption={chooseOptionStub}
          addDialogueLine={addDialogueLineStub}/>
    );

    fireEvent.click(getByText(/yes/i));

    expect(chooseOptionStub).toHaveBeenCalledWith(0);
    expect(chooseOptionStub).toHaveBeenCalledTimes(1);
  });

  it('does not return next item if option not selected', () => {
    let timeline = [];
    const addDialogueLineStub = jest.fn().mockImplementation((line) => {
      timeline.push(line);
    });

    const chooseOptionStub = jest.fn();

    const content = `
>> what do you think?
  * yes
    nice!
  * no
    ok!
<<
`;

    const { rerender, getByText, getByLabelText } = render(
      <Interpreter
          content={content}
          timeline={timeline}
          chooseOption={chooseOptionStub}
          addDialogueLine={addDialogueLineStub}/>
    );

    fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));

    rerender(
      <Interpreter
          content={content}
          timeline={timeline}
          chooseOption={chooseOptionStub}
          addDialogueLine={addDialogueLineStub}/>
    );

    fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));

    expect(getByText(/what do you think?/i)).toBeInTheDocument();
    expect(addDialogueLineStub).toHaveBeenCalledTimes(1);
  });

  it('renders debug panel', () => {
    const { getByLabelText } = render(
      <Interpreter
        content={'Hello!\nHi\n'}
        shouldShowDebugPane={true}
        timeline={[]}/>
    );
    expect(getByLabelText(/Debug pane/i)).toBeInTheDocument();
  });

  it('starts with selected block', () => {
    const addDialogueLineStub = jest.fn();
    const setBlockStub = jest.fn();
    const content = `
not this one
== block_one
this one
== block_two
neither this one
`;
    const { getByLabelText } = render(
      <Interpreter
        content={content}
        currentBlock="block_one"
        addDialogueLine={addDialogueLineStub}
        setBlock={setBlockStub}
        timeline={[]}/>
    );

    fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));

    expect(addDialogueLineStub).toHaveBeenCalledWith({ type: 'dialogue', text: 'this one'});
    expect(setBlockStub).toHaveBeenCalledWith('block_one');
  });

  describe('toolbar commands', () => {
    it('restart clears timeline', () => {
      const clearTimelineStub = jest.fn();
      const content = 'Hello!\nHi\n';
      const timeline = [
        { type: 'dialogue', text: 'Hello!' },
        { type: 'dialogue', text: 'Hi!' },
      ];
      const { getByLabelText } = render(
        <Interpreter
          content={content}
          clearTimeline={clearTimelineStub}
          timeline={timeline}/>
      );

      fireEvent.click(getByLabelText(/Restart dialogue/i));

      expect(clearTimelineStub).toHaveBeenCalled();
    });

    it('triggers show debug pane when pane is hidden', () => {
      const showDebugPaneStub = jest.fn();
      const hideDebugPaneStub = jest.fn();
      const { getByLabelText, getByText } = render(
        <Interpreter
          content={'Hello!\nHi\n'}
          hideDebugPane={hideDebugPaneStub}
          showDebugPane={showDebugPaneStub}
          timeline={[]}/>
      );

      fireEvent.click(getByLabelText(/Interpreter options/i));
      fireEvent.click(getByText(/Show debug pane/i));

      expect(showDebugPaneStub).toHaveBeenCalled();
      expect(hideDebugPaneStub).not.toHaveBeenCalled();
    });

    it('triggers hide debug pane when pane is visible', () => {
      const showDebugPaneStub = jest.fn();
      const hideDebugPaneStub = jest.fn();
      const { getByLabelText, getByText } = render(
        <Interpreter
          content={'Hello!\nHi\n'}
          hideDebugPane={hideDebugPaneStub}
          showDebugPane={showDebugPaneStub}
          shouldShowDebugPane={true}
          timeline={[]}/>
      );

      fireEvent.click(getByLabelText(/Interpreter options/i));
      fireEvent.click(getByText(/Hide debug pane/i));

      expect(hideDebugPaneStub).toHaveBeenCalled();
      expect(showDebugPaneStub).not.toHaveBeenCalled();
    });

    it('toggles debug pane to horizontal when vertical', () => {
      const showDebugPaneStub = jest.fn();
      const setDebugPaneDirectionStub = jest.fn();
      const { getByLabelText, getByText } = render(
        <Interpreter
          content={'Hello!\nHi\n'}
          setDebugPaneDirection={setDebugPaneDirectionStub}
          showDebugPane={showDebugPaneStub}
          debugPaneDirection="vertical"
          timeline={[]}/>
      );

      fireEvent.click(getByLabelText(/Interpreter options/i));
      fireEvent.click(getByText(/Debug pane split: horizontal/i));

      expect(setDebugPaneDirectionStub).toHaveBeenCalledWith('horizontal');
      expect(showDebugPaneStub).toHaveBeenCalled();
    });

    it('toggles debug pane to vertical when horizontal', () => {
      const showDebugPaneStub = jest.fn();
      const setDebugPaneDirectionStub = jest.fn();
      const { getByLabelText, getByText } = render(
        <Interpreter
          content={'Hello!\nHi\n'}
          setDebugPaneDirection={setDebugPaneDirectionStub}
          showDebugPane={showDebugPaneStub}
          debugPaneDirection="horizontal"
          timeline={[]}/>
      );

      fireEvent.click(getByLabelText(/Interpreter options/i));
      fireEvent.click(getByText(/Debug pane split: vertical/i));

      expect(setDebugPaneDirectionStub).toHaveBeenCalledWith('vertical');
      expect(showDebugPaneStub).toHaveBeenCalled();

      fireEvent.click(getByLabelText(/Interpreter options/i));
    });

    it('triggers show extra metadata', () => {
      const showExtraMetadataStub = jest.fn();
      const hideExtraMetadataStub = jest.fn();
      const { getByLabelText, getByText } = render(
        <Interpreter
          content={'Hello!\nHi\n'}
          hideExtraMetadata={hideExtraMetadataStub}
          showExtraMetadata={showExtraMetadataStub}
          timeline={[]}/>
      );

      fireEvent.click(getByLabelText(/Interpreter options/i));
      fireEvent.click(getByText(/Show metadata/i));

      expect(showExtraMetadataStub).toHaveBeenCalled();
      expect(hideExtraMetadataStub).not.toHaveBeenCalled();
    });

    it('triggers hide extra metadata when it is already visible', () => {
      const showExtraMetadataStub = jest.fn();
      const hideExtraMetadataStub = jest.fn();
      const { getByLabelText, getByText } = render(
        <Interpreter
          content={'Hello!\nHi\n'}
          hideExtraMetadata={hideExtraMetadataStub}
          showExtraMetadata={showExtraMetadataStub}
          shouldShowExtraMetadata
          timeline={[]}/>
      );
      fireEvent.click(getByLabelText(/Interpreter options/i));
      fireEvent.click(getByText(/Hide metadata/i));

      expect(hideExtraMetadataStub).toHaveBeenCalled();
      expect(showExtraMetadataStub).not.toHaveBeenCalled();
    });

    it('triggers enable single bubble dialogue', () => {
      const enableSingleBubbleDialogueStub = jest.fn();
      const disableSingleBubbleDialogueStub = jest.fn();
      const { getByLabelText} = render(
        <Interpreter
          content={'Hello!\nHi\n'}
          disableSingleBubbleDialogue={disableSingleBubbleDialogueStub}
          enableSingleBubbleDialogue={enableSingleBubbleDialogueStub}
          singleBubblePresentation={false}
          timeline={[]}/>
      );

      fireEvent.click(getByLabelText(/Interpreter options/i));
      fireEvent.click(getByLabelText(/Set single bubble dialogue/i));

      expect(enableSingleBubbleDialogueStub).toHaveBeenCalled();
      expect(disableSingleBubbleDialogueStub).not.toHaveBeenCalled();
    });

    it('triggers disable single bubble dialogue', () => {
      const enableSingleBubbleDialogueStub = jest.fn();
      const disableSingleBubbleDialogueStub = jest.fn();
      const { getByLabelText} = render(
        <Interpreter
          content={'Hello!\nHi\n'}
          disableSingleBubbleDialogue={disableSingleBubbleDialogueStub}
          enableSingleBubbleDialogue={enableSingleBubbleDialogueStub}
          singleBubblePresentation={true}
          timeline={[]}/>
      );

      fireEvent.click(getByLabelText(/Interpreter options/i));
      fireEvent.click(getByLabelText(/Set multi bubble dialogue/i));

      expect(disableSingleBubbleDialogueStub).toHaveBeenCalled();
      expect(enableSingleBubbleDialogueStub).not.toHaveBeenCalled();
    });

    it('renders block list', () => {
      const setBlockStub = jest.fn();
      const content = `
something
something else
== block_one
hello
== block_two
hi
`;
      const { getByLabelText } = render(
        <Interpreter
          content={content}
          setBlock={setBlockStub}
          timeline={[]}/>
      );

      const blocks = getByLabelText('Block selector');

      expect(blocks.children[0].value).toEqual('default');
      expect(blocks.children[1].value).toEqual('block_one');
      expect(blocks.children[2].value).toEqual('block_two');
    });

    it('changes starting block', () => {
      const setBlockStub = jest.fn();
      const clearTimelineStub = jest.fn();
      const content = `
something
something else
== block_one
hello
== block_two
hi
`;
      const { getByLabelText } = render(
        <Interpreter
          content={content}
          setBlock={setBlockStub}
          clearTimeline={clearTimelineStub}
          timeline={[]}/>
      );

      const blocks = getByLabelText('Block selector');

      fireEvent.change(blocks, { target:{ value: 'block_one' }});

      expect(setBlockStub).toHaveBeenCalledWith('block_one');
      expect(clearTimelineStub).toHaveBeenCalled();
    });

    it('changes to default starting block', () => {
      const setBlockStub = jest.fn();
      const clearTimelineStub = jest.fn();
      const content = `something\n`;
      const { getByLabelText } = render(
        <Interpreter
          content={content}
          setBlock={setBlockStub}
          clearTimeline={clearTimelineStub}
          timeline={[]}/>
      );

      const blocks = getByLabelText('Block selector');
      fireEvent.change(blocks, { target:{ value: 'default' }});

      expect(setBlockStub).toHaveBeenCalledWith(undefined);
      expect(clearTimelineStub).toHaveBeenCalled();
    });

    it('fast forward to next option', () => {
      let timeline = [];
      const addDialogueLineStub = jest.fn().mockImplementation((line) => {
        timeline.push(line);
      });

      const chooseOptionStub = jest.fn();

      const content = `
first line
second line
third line
>>
  * yes
    nice!
<<
`;

      const { getByLabelText } = render(
        <Interpreter
            content={content}
            timeline={timeline}
            chooseOption={chooseOptionStub}
            addDialogueLine={addDialogueLineStub}/>
      );

      fireEvent.click(getByLabelText(/Forward untill next choice/i));

      expect(addDialogueLineStub).toHaveBeenCalledTimes(4);
      expect(addDialogueLineStub).toHaveBeenLastCalledWith({ type: 'options', options: [{ label: 'yes' }]});
    });

    it('stops in the end when no option found', () => {
      let timeline = [];
      const addDialogueLineStub = jest.fn().mockImplementation((line) => {
        timeline.push(line);
      });

      const chooseOptionStub = jest.fn();

      const content = `
first line
second line
third line
`;

      const { getByLabelText } = render(
        <Interpreter
            content={content}
            timeline={timeline}
            chooseOption={chooseOptionStub}
            addDialogueLine={addDialogueLineStub}/>
      );

      fireEvent.click(getByLabelText(/Forward untill next choice/i));

      expect(addDialogueLineStub).toHaveBeenCalledTimes(4);
      expect(addDialogueLineStub).toHaveBeenLastCalledWith(undefined);
    });

    it('run poltergeist mode: choose all options', () => {
      let timeline = [];
      const addDialogueLineStub = jest.fn().mockImplementation((line) => {
        timeline.push(line);
      });
      const chooseOptionStub = jest.fn();

      const content = `
first line
>> hello
  * hi
    hi!
<<
second line
>> hello
  * hi
    hi!
<<
third line
>> hello
  * hi
    hi!
<<
this is the end
`;

      const { getByLabelText } = render(
        <Interpreter
            content={content}
            timeline={timeline}
            chooseOption={chooseOptionStub}
            addDialogueLine={addDialogueLineStub}/>
      );

      fireEvent.click(getByLabelText(/Execute Poltergeist mode \(auto anwser\)/i));

      expect(addDialogueLineStub).toHaveBeenCalledTimes(11);
      expect(addDialogueLineStub).toHaveBeenLastCalledWith(undefined);
      expect(chooseOptionStub).toHaveBeenCalledTimes(3);
      expect(timeline[timeline.length - 2]).toEqual({ type: 'dialogue', text: 'this is the end'});
    });

    it('cleans memory', () => {
      let timeline = [];
      const content = '\nvalue %a%\n{ set a = 1 }\nagain %a%\n';
      const addDialogueLineStub = jest.fn().mockImplementation((line) => {
        timeline.push(line);
      });
      const { getByLabelText } = render(
        <Interpreter content={content} timeline={timeline} addDialogueLine={addDialogueLineStub}/>
      );
      fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));
      fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));
      fireEvent.click(getByLabelText(/Clear memory/i));
      fireEvent.click(getByLabelText(/Interpreter Dialogue Timeline/i));

      expect(timeline[0]).toEqual({ type: 'dialogue', text: 'value ' });
      expect(timeline[1]).toEqual({ type: 'dialogue', text: 'again 1' });
      expect(timeline[2]).toEqual({ type: 'INTERPRETER_INFO', text: 'Memory cleared' });
      expect(timeline[3]).toEqual({ type: 'dialogue', text: 'value ' });
    });
  });
});