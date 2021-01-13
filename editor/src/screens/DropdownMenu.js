import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Wrapper = styled.div`
  position: absolute;
  display: 'flex';
  flex-direction: column;
  width: auto;
  min-width: 230px;
  z-index: 9999;
  background-color: #fff;
  font-size: 1rem;
  padding: 10px 0px;
  border: 1px solid #eee;
  border-radius: 5px;
`;

const ItemWrapper = styled.div`
  padding: 6px 15px;
  display: flex;
  flex-direction: row;

  &:hover {
    background-color: #eee;
  }

  > svg {
    flex-basis: 30px;
    margin-right: 5px;
  }
`;

export default function DropDownMenu(props) {
  const {
    children,
    onClick,
    style
  } = props;

  return (
    <Wrapper onClick={onClick} style={style}>
      {React.Children.toArray(children)}
    </Wrapper>
  );
};

export function DropDownItem(props) {
  const {
    label,
    icon,
    onClick,
    text
  } = props;

  return (
    <ItemWrapper
      aria-label={label}
      onClick={onClick}
    >
      <FontAwesomeIcon icon={icon}/> {text}
    </ItemWrapper>
  );
}
