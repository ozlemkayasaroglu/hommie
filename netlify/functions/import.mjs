import handler from '../../api/import.js';
import { toNetlifyHandler } from './_adapter.mjs';

export default toNetlifyHandler(handler);
