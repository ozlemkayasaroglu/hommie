import handler from '../../api/photo-status.js';
import { toNetlifyHandler } from './_adapter.mjs';

export default toNetlifyHandler(handler);
