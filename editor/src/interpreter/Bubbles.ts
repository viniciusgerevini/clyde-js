import styled from 'styled-components';

export const InfoBubble = styled.div `
  text-align: center;
  width: auto;
  background-color: #eeeeee;
  margin: 10px 10px;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: default;
`;

export const ErrorBubble = styled.div`
  text-align: center;
  width: auto;
  background-color: #ffeeee;
  margin: 10px 10px;
  padding: 30px 20px;
  border-radius: 5px;
  cursor: default;
  font-weight: 500;
  display: flex;
  justify-content: center;
  white-space: pre-line;
  line-height: 26px;
`;
