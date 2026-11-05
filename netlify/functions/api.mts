// §3.1, §7.7: the one Netlify function, serving /api/*.
import { handler } from '../../server/adapters/netlify.ts';

export default handler;
export const config = { path: '/api/*' };
