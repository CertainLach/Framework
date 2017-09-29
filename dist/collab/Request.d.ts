import DoRequest from './requests/Do';
import UndoRequest from './requests/Undo';
import RedoRequest from './requests/Redo';
declare type Request = DoRequest | RedoRequest | UndoRequest;
export default Request;
