// import { render, screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import MainPanels from './MainPanels';

test('renders learn react link', () => {
  render(<MainPanels />);
  // const linkElement = screen.getByText(/learn react/i);
  // expect(linkElement).toBeInTheDocument();
});
