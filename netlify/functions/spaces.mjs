import handler from '../../api/spaces.js';
import { toNetlifyHandler } from './_adapter.mjs';

export default toNetlifyHandler(handler);
