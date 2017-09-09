import DoRequest from './requests/Do';
import UndoRequest from './requests/Undo';
import RedoRequest from './requests/Redo';

type Request=DoRequest|RedoRequest|UndoRequest;

export default Request;