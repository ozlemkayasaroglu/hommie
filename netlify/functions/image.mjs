import handler from '../../api/image.js';
import { toNetlifyHandler } from './_adapter.mjs';

export default toNetlifyHandler(handler);
