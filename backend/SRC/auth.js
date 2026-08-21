import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {q} from './db.js';
const secret=process.env.JWT_SECRET||'dev-secret-change-me';
export function sign(user){return jwt.sign({id:user.id,email:user.email,role:user.role},secret,{expiresIn:'7d'})}
export function auth(req,res,next){try{const h=req.headers.authorization||'';if(!h.startsWith('Bearer ')) return res.status(401).json({error:'غير مصرح'});req.user=jwt.verify(h.slice(7),secret);next()}catch{return res.status(401).json({error:'جلسة غير صالحة'})}}
export function adminOnly(req,res,next){return req.user?.role==='admin'?next():res.status(403).json({error:'صلاحيات غير كافية'})}
export async function ensureAdmin(){const email=process.env.ADMIN_EMAIL||'admin@armnaz.local';const password=process.env.ADMIN_PASSWORD||'change-me-now';const r=await q('SELECT id FROM users WHERE email=$1',[email]);if(!r.rowCount){const hash=await bcrypt.hash(password,12);await q('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4)',['مدير أرمناز',email,hash,'admin']);}}
export {bcrypt};
