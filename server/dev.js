import http from 'node:http';
import { createServer } from 'vite';
import handler from './api.js';
const vite=await createServer({server:{middlewareMode:true},appType:'spa'});
http.createServer((req,res)=>req.url.startsWith('/api/')?handler(req,res):vite.middlewares(req,res)).listen(5180,'127.0.0.1',()=>console.log('ATLAS World Quest: http://127.0.0.1:5180'));
