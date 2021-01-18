import { render, fireEvent, act } from '@testing-library/react';

import EditorSettingsModal from './EditorSettingsModal';

describe('EditorSettingsModal component', () => {
  it('renders editor and interpreter by default', () => {
    const preferences = {};
    const { getByText } = render(<EditorSettingsModal preferences={preferences}/>);

    expect(getByText(/Editor preferences/i)).toBeInTheDocument();
  });

  test.each([ 'highlightActiveLine', 'lineWrap', 'useSoftTabs', 'showInvisibles', 'scrollPastEnd' ])('update %s property', (property) => {
    const updatePreferenceStub =jest.fn();
    const preferences = {};
    const { container } = render(<EditorSettingsModal preferences={preferences} updatePreference={updatePreferenceStub}/>);
    const item = container.querySelector(`input[name="${property}"]`);

    fireEvent.click(item);

    expect(updatePreferenceStub).toHaveBeenCalledWith(property, true);
  });

  test.each([ 'fontSize', 'tabSize' ])('update %s number property', (property) => {
    const updatePreferenceStub =jest.fn();
    const preferences = {};
    const { container } = render(<EditorSettingsModal preferences={preferences} updatePreference={updatePreferenceStub}/>);
    const item = container.querySelector(`input[name="${property}"]`);

    fireEvent.change(item, { target: { name: property, value: '2' } });

    expect(updatePreferenceStub).toHaveBeenCalledWith(property, 2);
  });

  it('update theme property', () => {
    const property = 'theme';
    const updatePreferenceStub =jest.fn();
    const preferences = {};
    const { container } = render(<EditorSettingsModal preferences={preferences} updatePreference={updatePreferenceStub}/>);
    const item = container.querySelector(`select[name="${property}"]`);

    fireEvent.change(item, { target: { name: property, value: 'tomorrow' } });

    expect(updatePreferenceStub).toHaveBeenCalledWith(property, 'tomorrow');
  });

  it('trigger close callback when clicking close button', () => {
    const onCloseClickStub =jest.fn();
    const preferences = {};
    const { getByText } = render(<EditorSettingsModal preferences={preferences} onCloseClick={onCloseClickStub}/>);

    fireEvent.click(getByText('Close'));

    expect(onCloseClickStub).toHaveBeenCalled();
  });
});
