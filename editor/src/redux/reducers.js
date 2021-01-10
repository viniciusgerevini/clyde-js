import { combineReducers } from 'redux';
import interfaceConfig from './interface';
import editor from './editor';

export default combineReducers({
  interfaceConfig,
  editor
});
