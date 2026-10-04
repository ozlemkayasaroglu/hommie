import handler from '../../api/ai.js';
import { toNetlifyHandler } from './_adapter.mjs';

export default toNetlifyHandler(handler);
