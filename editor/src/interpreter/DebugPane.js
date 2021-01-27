import React  from "react";
import styled from 'styled-components';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  // faSave,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

const DebugPaneWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  overflow: scroll;
`;

const DebugPaneCloseButton = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  cursor: pointer;
`;

const DebugEntryTable = styled.table`
  width: 90%;
  margin: 10px;

  thead > tr > td {
    font-weight: 500;
    padding-bottom: 5px;
  }

  tbody {
    > tr:nth-child(even) {
      background-color: #f3f3f3;
    }
    td {
      padding: 2px 0px;
    }
  }
`;

export default function DebugPane(properties) {
  const {
    events,
    hideDebugPane,
    ...props
  } = properties;


  const entries = events.reduce((entries, event) => {
    const identifier = `${event.type}${event.data.name}`;
    let record = entries[identifier];
    if (!record) {
      entries[identifier] = {
        type: event.type,
        name: event.data.name,
        value: event.data.value,
        eventTime: event.eventTime,
      }
      return entries;
    }
    record.eventTime = event.eventTime;

    if (event.data.value) {
      record.value = event.data.value;
    }
    return entries;
  }, {});

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.toLocaleTimeString()}`;
  };

  return <DebugPaneWrapper aria-label="Debug pane" {...props}>
    <DebugPaneCloseButton>
      <FontAwesomeIcon icon={faTimes} onClick={hideDebugPane} aria-label="Close debug pane"/>
    </DebugPaneCloseButton>

    <DebugEntryTable>
      <thead>
        <tr>
          <td>Type</td>
          <td>Name</td>
          <td>Value</td>
          <td>Time</td>
        </tr>
      </thead>
      <tbody>
    {Object.keys(entries).map((key) => {
      const entry = entries[key];
      return <tr key={key}><td>{entry.type}</td><td>{entry.name}</td><td>{entry.value !== undefined ? entry.value.toString() : undefined}</td><td>{formatDate(entry.eventTime)}</td></tr>;
    })}
     </tbody>
    </DebugEntryTable>
  </DebugPaneWrapper>;
}
