import React from 'react';
import styled from 'styled-components';

const ModalWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalInnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
  min-width: 500px;
  min-height: 300px;
  color: #333;
  padding: 10px;
`;

const ModalHeader = styled.div`
  margin-bottom: 10px;
  padding-bottom: 10px;
  text-align: center;
  border-bottom: 1px solid #ccc;
`;

const ModalFooter = styled.div`
  text-align: right;
`;

const ModalContent = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const ModalAction = styled.button`
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 8px 12px;

  &:focus, &:hover {
    background-color: #f1f1f1;
  }
`;

export default function Modal(props) {
  const {
    title,
    actions,
    children
  } = props;

  return (
    <ModalWrapper>
      <ModalInnerWrapper>
        <ModalHeader>{title}</ModalHeader>
        <ModalContent>{children}</ModalContent>
        <ModalFooter>
          {actions.map((action, key) => {
            return <ModalAction key={key} onClick={action.onClick}>{action.label}</ModalAction>
          })}
        </ModalFooter>
      </ModalInnerWrapper>
    </ModalWrapper>
  );
}
