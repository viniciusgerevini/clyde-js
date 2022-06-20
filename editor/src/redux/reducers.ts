import { combineReducers } from 'redux';
import interfaceConfig from './interface';
import editor from './editor';
import interpreter from './interpreter';

export default combineReducers({
  interfaceConfig,
  editor,
  interpreter
});
