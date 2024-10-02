import App from './App';

import styled from 'styled-components';

const Wrapper = styled.div`
  height: 100%;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 10px 5px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2em;
  font-weight: 500;
`;

const AboutBlock = styled.div`
  font-family: 'Lato', sans-serif;
  margin: 10px 40px;
  p {
    margin-bottom: 10px;
  }

  a {
    margin: 5px 10px;
  }
`;

const AboutContent = styled.div`
  margin-top: 30px;
`;

export default function WebsiteApp() {
  return (
    <Wrapper>
      <AboutBlock>
        <Title>Clyde Dialogue Language</Title>
        <AboutContent>
          <p>
            Clyde is a language for writing dialogues.
            <a href="https://github.com/viniciusgerevini/clyde-js">Github</a>
            <a href="https://github.com/viniciusgerevini/clyde/blob/main/LANGUAGE.md">Language Docs</a>
            <a href="https://github.com/viniciusgerevini/clyde-js/tree/master/cli">CLI</a>
            <a href="https://github.com/viniciusgerevini/godot-clyde-dialogue">Godot Plugin</a>
          </p>
        </AboutContent>

      </AboutBlock>
        <App/>
    </Wrapper>
  );
}

