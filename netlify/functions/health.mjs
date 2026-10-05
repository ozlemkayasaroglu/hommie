import handler from '../../api/health.js';
import { toNetlifyHandler } from './_adapter.mjs';

export default toNetlifyHandler(handler);
