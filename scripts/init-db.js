import {createStore} from '../server/store.js';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL first.');
const store=await createStore();await store.close();console.log('Database schema is ready.');
