import handler from '../../api/upload.js';
import { toNetlifyHandler } from './_adapter.mjs';

export default toNetlifyHandler(handler);
