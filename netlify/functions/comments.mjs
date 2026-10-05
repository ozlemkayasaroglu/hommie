import handler from '../../api/comments.js';
import { toNetlifyHandler } from './_adapter.mjs';

export default toNetlifyHandler(handler);
