import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const GUTTER_SIZE = 4;

interface WrapperProps {
  direction: string;
  style: string;
}

const Wrapper = styled.div<WrapperProps>`
  display: flex;
  align-items: stretch;
  flex-grow: 1;
  height: auto;
  flex-direction: ${(props: any) => props.direction === 'horizontal' ? 'column' : 'row' };
  max-height: 100%;
`;

interface GutterProps {
  direction: string;
}

const Gutter = styled.div<GutterProps>`
  background-color: #eee;
  background-repeat: no-repeat;
  background-position: 50%;
  flex-basis: ${GUTTER_SIZE}px;
  cursor: ${(props: any) => props.direction === 'horizontal' ? 'row-resize' : 'col-resize' };
`;
// TODO
// - gutter drag resize
// - make sure sizes are kept when items disappear

export interface SplitPaneParams {
  direction?: 'vertical' | 'horizontal';
  defaultSizes?: number[];
  style?: any;
  children: any;
}

export default function SplitPane(props: SplitPaneParams) {
  const {
    direction = 'vertical',
    defaultSizes = undefined,
    style = {}
  } = props;

  const children = Array.isArray(props.children) ? props.children : [props.children];

  const visibleChildren = children.filter(item => item && item !== '');

  const calculateSizes = () => {
    if (visibleChildren.length === 1) {
      return ['100%'];
    }

    if (defaultSizes) {
      let sizes = defaultSizes.map(s => `calc(${s}% - 2px)`);
      if (defaultSizes.length === visibleChildren.length) {
        return sizes;
      }

      const spaceUsed = visibleChildren.reduce((acc, item) => {
        const index = children.indexOf(item);
        return acc + defaultSizes[index];
      }, 0);

      if (spaceUsed < 100) {
        const lastIndex = children.indexOf(visibleChildren[visibleChildren.length - 1]);
        sizes[lastIndex] = `calc(${defaultSizes[lastIndex] + (100 - spaceUsed)}% - 2px)`
      }

      return sizes;
    }

    const size = Math.floor(100 / visibleChildren.length);
    return Array(children.length).fill(`calc(${size}% - 2px)`);
  };

  const sizes = calculateSizes();

  const panes = children.reduce((acc, item, index) => {
    // console.log(item);
    if (!item) {
      return acc;
    }

    const visibleIndex = visibleChildren.indexOf(item);

    if (visibleIndex > 0 && visibleIndex < (visibleChildren.length)) {
      acc.push(<Gutter direction={direction}/>);
    }

    acc.push(React.cloneElement(item, {key: index, style: { flexBasis: sizes[index], flexGrow: 1}}));

    return acc;
  }, []);

  return (
    <Wrapper direction={direction} style={style}>
      {panes.map((item: any, key: any) => React.cloneElement(item, {key}))}
    </Wrapper>
  );
};

SplitPane.propTypes = {
  direction: PropTypes.string,
  defaultSizes: PropTypes.array
};
