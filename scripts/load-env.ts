import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local before anything else
dotenv.config({ path: resolve(__dirname, '../.env.local') });
