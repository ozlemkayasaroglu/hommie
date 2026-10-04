import handler from '../../api/items.js';
import { toNetlifyHandler } from './_adapter.mjs';

export default toNetlifyHandler(handler);
