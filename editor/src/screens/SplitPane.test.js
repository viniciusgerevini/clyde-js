import { render } from '@testing-library/react';
import SplitPane from './SplitPane';

describe('SplitPane', () => {
  it('renders child with size configured as 100%', () => {
    const { getByTestId } = render(<SplitPane><div data-testid="child"/></SplitPane>);
    const child = getByTestId('child');
    expect(child.style.flexBasis).toEqual('100%');
  });

  it('calculates size for each children', () => {
    const { getByTestId } = render(<SplitPane>
      <div data-testid="child"/>
      <div data-testid="child2"/>
      <div data-testid="child3"/>
    </SplitPane>);
    const child = getByTestId('child');
    const child2 = getByTestId('child2');
    const child3 = getByTestId('child3');

    expect(child.style.flexBasis).toEqual('calc(33% - 2px)');
    expect(child2.style.flexBasis).toEqual('calc(33% - 2px)');
    expect(child3.style.flexBasis).toEqual('calc(33% - 2px)');
  });

  it('use pre-defined sizes', () => {
    const { getByTestId } = render(<SplitPane defaultSizes={[10, 30, 60]}>
      <div data-testid="child"/>
      <div data-testid="child2"/>
      <div data-testid="child3"/>
    </SplitPane>);
    const child = getByTestId('child');
    const child2 = getByTestId('child2');
    const child3 = getByTestId('child3');

    expect(child.style.flexBasis).toEqual('calc(10% - 2px)');
    expect(child2.style.flexBasis).toEqual('calc(30% - 2px)');
    expect(child3.style.flexBasis).toEqual('calc(60% - 2px)');
  });

  it('use remaining size on last item when missing items', () => {
    const { getByTestId } = render(<SplitPane defaultSizes={[30, 10, 20]}>
      <div data-testid="child"/>
      <div data-testid="child2"/>
    </SplitPane>);
    const child = getByTestId('child');
    const child2 = getByTestId('child2');

    expect(child.style.flexBasis).toEqual('calc(30% - 2px)');
    expect(child2.style.flexBasis).toEqual('calc(70% - 2px)');
  });

  it('do not change last item size when missing items if sum is already 100', () => {
    const { getByTestId } = render(<SplitPane defaultSizes={[30, 80, 20]}>
      {undefined}
      <div data-testid="child"/>
      <div data-testid="child2"/>
    </SplitPane>);
    const child = getByTestId('child');
    const child2 = getByTestId('child2');

    expect(child.style.flexBasis).toEqual('calc(80% - 2px)');
    expect(child2.style.flexBasis).toEqual('calc(20% - 2px)');
  });

  it('set right size even with missing items', () => {
    const { getByTestId } = render(<SplitPane defaultSizes={[30, 10, 20]}>
      { undefined }
      <div data-testid="child"/>
      <div data-testid="child2"/>
    </SplitPane>);
    const child = getByTestId('child');

    expect(child.style.flexBasis).toEqual('calc(10% - 2px)');
  });

  it('works with undefined child', () => {
    const { getByTestId } = render(<SplitPane defaultSizes={[30, 10, 20]}>
      <div data-testid="child"/>
      { false ? 'hey' : undefined }
      <div data-testid="child2"/>
    </SplitPane>);
    const child = getByTestId('child');
    const child2 = getByTestId('child2');

    expect(child.style.flexBasis).toEqual('calc(30% - 2px)');
    expect(child2.style.flexBasis).toEqual('calc(70% - 2px)');
  });

  it('set direction as horizontal', () => {
    const { container } = render(<SplitPane direction={'horizontal'}>
      <div data-testid="child"/>
      <div data-testid="child2"/>
    </SplitPane>);

    expect(window.getComputedStyle(container.firstChild).flexDirection).toEqual('column');
  });

  it('use vertical as default direction', () => {
    const { container } = render(<SplitPane>
      <div data-testid="child"/>
    </SplitPane>);

    expect(window.getComputedStyle(container.firstChild).flexDirection).toEqual('row');
  });

  it('create gutters when multiple items', () => {
    const { container } = render(<SplitPane>
      <div data-testid="child"/>
      <div data-testid="child2"/>
      <div data-testid="child3"/>
    </SplitPane>);

    const children = container.firstChild.childNodes;
    expect(children.length).toBe(5);
    expect(children[0].getAttribute('data-testid')).toEqual('child');
    expect(window.getComputedStyle(children[1]).cursor).toEqual('col-resize');
    expect(children[2].getAttribute('data-testid')).toEqual('child2');
    expect(window.getComputedStyle(children[3]).cursor).toEqual('col-resize');
    expect(children[4].getAttribute('data-testid')).toEqual('child3');
  });

  it('create gutters for horizontal mode when multiple items', () => {
    const { container } = render(<SplitPane direction="horizontal">
      <div data-testid="child"/>
      <div data-testid="child2"/>
      <div data-testid="child3"/>
    </SplitPane>);

    const children = container.firstChild.childNodes;
    expect(children.length).toBe(5);
    expect(children[0].getAttribute('data-testid')).toEqual('child');
    expect(window.getComputedStyle(children[1]).cursor).toEqual('row-resize');
    expect(children[2].getAttribute('data-testid')).toEqual('child2');
    expect(window.getComputedStyle(children[3]).cursor).toEqual('row-resize');
    expect(children[4].getAttribute('data-testid')).toEqual('child3');
  });
});
