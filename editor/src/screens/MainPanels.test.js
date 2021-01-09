import { render, fireEvent } from '@testing-library/react';
import MainPanels from './MainPanels';

describe('MainPanels component', () => {
  it('renders editor and interpreter by default', () => {
    const { getByLabelText } = render(<MainPanels />);

    expect(getByLabelText(/Text editor/i)).toBeInTheDocument();
    expect(getByLabelText(/Clyde interpreter/i)).toBeInTheDocument();
  });

  it('does not render editor when isEditorEnabled property is false', () => {
    const { queryByLabelText } = render(<MainPanels isEditorEnabled={false} />);

    expect(queryByLabelText(/Text editor/i)).not.toBeInTheDocument();
    expect(queryByLabelText(/Clyde interpreter/i)).toBeInTheDocument();
  });

  it('does not render interpreter when isInterpreterEnabled property is false', () => {
    const { queryByLabelText } = render(<MainPanels isInterpreterEnabled={false} />);

    expect(queryByLabelText(/Text editor/i)).toBeInTheDocument();
    expect(queryByLabelText(/Clyde interpreter/i)).not.toBeInTheDocument();
  });

  it('triggers toggle editor', () => {
    const stubToggleEditor = jest.fn();
    const { getByLabelText } = render(<MainPanels toggleEditor={stubToggleEditor} />);

    fireEvent.click(getByLabelText(/Toggle editor/i));

    expect(stubToggleEditor).toHaveBeenCalledWith(false);
  });

  it('triggers toggle interpreter', () => {
    const stubToggleInterpreter = jest.fn();
    const { getByLabelText } = render(<MainPanels isInterpreterEnabled={false} toggleInterpreter={stubToggleInterpreter} />);

    fireEvent.click(getByLabelText(/Toggle interpreter/i));

    expect(stubToggleInterpreter).toHaveBeenCalledWith(true);
  });

  it('defaults split direction to vertical', () => {
    const { container } = render(<MainPanels/>);
    const panel = container.querySelector('div[direction="vertical"]');

    expect(panel).toBeInTheDocument();
  });

  it('configures split direction as horizontal', () => {
    const { container } = render(<MainPanels interpreterSplitDirection="horizontal" />);
    const panel = container.querySelector('div[direction="horizontal"]');

    expect(panel).toBeInTheDocument();
  });

  it('sets split direction as horizontal', () => {
    const stubDirectionChange = jest.fn();
    const { getByLabelText } = render(<MainPanels changeInterpreterSplitDirection={stubDirectionChange} />);

    fireEvent.click(getByLabelText(/Set as horizontal/i));

    expect(stubDirectionChange).toHaveBeenCalledWith('horizontal');
  });

  it('sets split direction as vertical', () => {
    const stubDirectionChange = jest.fn();
    const { getByLabelText } = render(<MainPanels changeInterpreterSplitDirection={stubDirectionChange} />);

    fireEvent.click(getByLabelText(/Set as vertical/i));

    expect(stubDirectionChange).toHaveBeenCalledWith('vertical');
  });
});
