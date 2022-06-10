import { render, fireEvent } from '@testing-library/react';

import EditorSettingsModal, {EditorSettingsModalParams} from './EditorSettingsModal';

describe('EditorSettingsModal component', () => {
  let updatePreferenceStub: jest.Mock;
  let onCloseClickStub: jest.Mock;
  let preferences: {[key: string]: any };
  let fakePreferences: EditorSettingsModalParams;

  beforeEach(() => {
    updatePreferenceStub = jest.fn();
    onCloseClickStub = jest.fn();
    preferences = {};

    fakePreferences = {
      onCloseClick: onCloseClickStub,
      updatePreference: updatePreferenceStub,
      preferences,
    }
  });

  it('renders editor and interpreter by default', () => {
    const { getByText } = render(<EditorSettingsModal {...fakePreferences}/>);

    expect(getByText(/Editor preferences/i)).toBeInTheDocument();
  });

  test.each([ 'highlightActiveLine', 'lineWrap', 'useSoftTabs', 'showInvisibles', 'scrollPastEnd', 'vimMode' ])('update %s property', (property) => {
    const { container } = render(<EditorSettingsModal {...fakePreferences}/>);
    const item = container.querySelector(`input[name="${property}"]`)!;

    fireEvent.click(item);

    expect(updatePreferenceStub).toHaveBeenCalledWith(property, true);
  });

  test.each([ 'fontSize', 'tabSize' ])('update %s number property', (property) => {
    const { container } = render(<EditorSettingsModal {...fakePreferences}/>);
    const item = container.querySelector(`input[name="${property}"]`)!;

    fireEvent.change(item, { target: { name: property, value: '2' } });

    expect(updatePreferenceStub).toHaveBeenCalledWith(property, 2);
  });

  it('update theme property', () => {
    const property = 'theme';
    const { container } = render(<EditorSettingsModal {...fakePreferences}/>);
    const item = container.querySelector(`select[name="${property}"]`)!;

    fireEvent.change(item, { target: { name: property, value: 'tomorrow' } });

    expect(updatePreferenceStub).toHaveBeenCalledWith(property, 'tomorrow');
  });

  it('trigger close callback when clicking close button', () => {
    const { getByText } = render(<EditorSettingsModal {...fakePreferences}/>);

    fireEvent.click(getByText('Close'));

    expect(onCloseClickStub).toHaveBeenCalled();
  });
});
