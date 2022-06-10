import { render, fireEvent } from '@testing-library/react';
import MainPanels, { MainPanelsParams} from './MainPanels';

describe('MainPanels component', () => {
  const fakeParams = {} as MainPanelsParams;

  it('renders editor and interpreter by default', () => {
    const { getByLabelText } = render(<MainPanels {...fakeParams} />);

    expect(getByLabelText(/Text editor/i)).toBeInTheDocument();
    expect(getByLabelText(/Clyde interpreter/i)).toBeInTheDocument();
  });

  it('does not render editor when isEditorEnabled property is false', () => {
    const { queryByLabelText } = render(<MainPanels {...fakeParams} isEditorEnabled={false} />);

    expect(queryByLabelText(/Text editor/i)).not.toBeInTheDocument();
    expect(queryByLabelText(/Clyde interpreter/i)).toBeInTheDocument();
  });

  it('does not render interpreter when isInterpreterEnabled property is false', () => {
    const { queryByLabelText } = render(<MainPanels {...fakeParams} isInterpreterEnabled={false} />);

    expect(queryByLabelText(/Text editor/i)).toBeInTheDocument();
    expect(queryByLabelText(/Clyde interpreter/i)).not.toBeInTheDocument();
  });

  it('triggers toggle editor', () => {
    const stubToggleEditor = jest.fn();
    const { getByLabelText } = render(<MainPanels {...fakeParams} toggleEditor={stubToggleEditor} />);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Toggle editor/i));

    expect(stubToggleEditor).toHaveBeenCalledWith(false);
  });

  it('triggers toggle interpreter', () => {
    const stubToggleInterpreter = jest.fn();
    const { getByLabelText } = render(<MainPanels {...fakeParams} isInterpreterEnabled={false} toggleInterpreter={stubToggleInterpreter} />);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Toggle interpreter/i));

    expect(stubToggleInterpreter).toHaveBeenCalledWith(true);
  });

  it('configures split direction as horizontal', () => {
    const { container } = render(<MainPanels {...fakeParams} interpreterSplitDirection="horizontal" />);
    const panel = container.querySelector('div[direction="horizontal"]');

    expect(panel).toBeInTheDocument();
  });

  it('sets split direction as horizontal', () => {
    const stubDirectionChange = jest.fn();
    const { getByLabelText } = render(<MainPanels {...fakeParams} interpreterSplitDirection="vertical" changeInterpreterSplitDirection={stubDirectionChange} />);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Change split direction/i));

    expect(stubDirectionChange).toHaveBeenCalledWith('horizontal');
  });

  it('sets split direction as vertical', () => {
    const stubDirectionChange = jest.fn();
    const { getByLabelText } = render(<MainPanels {...fakeParams} interpreterSplitDirection="horizontal" changeInterpreterSplitDirection={stubDirectionChange} />);

    fireEvent.click(getByLabelText(/Toggle settings menu/i));
    fireEvent.click(getByLabelText(/Change split direction/i));

    expect(stubDirectionChange).toHaveBeenCalledWith('vertical');
  });
});
