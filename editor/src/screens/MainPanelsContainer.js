import { connect } from 'react-redux';

import MainPanels from './MainPanels';

import {
  toggleEditor,
  toggleInterpreter,
  changeInterpreterSplitDirection
} from '../redux/interface';

const mapStateToProps = (state, props) => ({
  ...state.interfaceConfig,
  editorDefaultValue: state.editor.currentValue,
  ...props
});

const mapDispatchToProps = dispatch => ({
  toggleEditor: (state) => {
    dispatch(toggleEditor({state}));
  },
  toggleInterpreter: (state) => {
    dispatch(toggleInterpreter({state}));
  },
  changeInterpreterSplitDirection: (direction) => {
    dispatch(changeInterpreterSplitDirection({direction}));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MainPanels);

