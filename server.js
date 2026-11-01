import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
dotenv.config();
const app=express();
app.use(cors({origin:'http://localhost:5173'}));
app.use(express.json());
const uploadDir=path.resolve('uploads');
fs.mkdirSync(uploadDir,{recursive:true});
const storage=multer.diskStorage({destination:(_,__,cb)=>cb(null,uploadDir),filename:(_,file,cb)=>{const safe=Date.now()+'-'+file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_');cb(null,safe)}});
const upload=multer({storage,limits:{fileSize:15*1024*1024},fileFilter:(_,file,cb)=>file.mimetype==='application/pdf'||file.originalname.toLowerCase().endsWith('.pdf')?cb(null,true):cb(new Error('Only PDF files are allowed'))});
app.use('/uploads',express.static(uploadDir));
const User=mongoose.model('User',new mongoose.Schema({name:{type:String,required:true},email:{type:String,required:true,unique:true,lowercase:true},passwordHash:{type:String,required:true},role:{type:String,enum:['student','faculty','library','admin'],default:'student'}}));
const Notice=mongoose.model('Notice',new mongoose.Schema({title:{type:String,required:true},body:{type:String,required:true},category:{type:String,default:'Academics'},createdAt:{type:Date,default:Date.now}}));
const Resource=mongoose.model('Resource',new mongoose.Schema({title:{type:String,required:true},subject:{type:String,required:true},kind:{type:String,default:'Subject Notes'},fileName:{type:String,required:true},fileUrl:{type:String,required:true},uploadedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},uploaderRole:String,createdAt:{type:Date,default:Date.now}}));
function authenticate(req,res,next){try{const token=(req.headers.authorization||'').replace(/^Bearer\\s+/i,'');const p=jwt.verify(token,process.env.JWT_SECRET);User.findById(p.id).then(u=>{if(!u)return res.status(401).json({message:'Account not found'});req.user=u;next()}).catch(()=>res.status(401).json({message:'Invalid session'}))}catch{return res.status(401).json({message:'Please sign in'})}}
function allow(...roles){return(req,res,next)=>authenticate(req,res,()=>roles.includes(req.user.role)?next():res.status(403).json({message:'Your account cannot perform this action'}))}
app.get('/api/health',(_,res)=>res.json({status:'ok',app:'Campus Connect Pro API'}));
app.post('/api/auth/register',async(req,res)=>{try{const{name,email,password,role='student'}=req.body;if(!name||!email||!password||password.length<8)return res.status(400).json({message:'Name, email and password (8+ characters) are required'});if(role!=='student')return res.status(403).json({message:'Only student self-registration is enabled; staff accounts should be created by an administrator'});if(await User.findOne({email:email.toLowerCase()}))return res.status(409).json({message:'Email already registered'});const u=await User.create({name,email,passwordHash:await bcrypt.hash(password,12),role});const token=jwt.sign({id:u._id},process.env.JWT_SECRET,{expiresIn:'8h'});res.status(201).json({token,user:{id:u._id,name:u.name,email:u.email,role:u.role}})}catch{res.status(500).json({message:'Registration failed'})}});
app.post('/api/auth/login',async(req,res)=>{try{const u=await User.findOne({email:(req.body.email||'').toLowerCase()});if(!u||!await bcrypt.compare(req.body.password||'',u.passwordHash))return res.status(401).json({message:'Invalid email or password'});const token=jwt.sign({id:u._id},process.env.JWT_SECRET,{expiresIn:'8h'});res.json({token,user:{id:u._id,name:u.name,email:u.email,role:u.role}})}catch{res.status(500).json({message:'Login failed'})}});
app.get('/api/notices',async(_,res)=>{try{res.json(await Notice.find().sort({createdAt:-1}).limit(100))}catch{res.status(500).json({message:'Could not load notices'})}});
app.post('/api/notices',allow('faculty','admin'),async(req,res)=>{try{if(!req.body.title?.trim()||!req.body.body?.trim())return res.status(400).json({message:'Title and message are required'});res.status(201).json(await Notice.create({title:req.body.title,body:req.body.body,category:req.body.category||'Academics'}))}catch{res.status(500).json({message:'Could not publish notice'})}});
app.get('/api/resources',async(_,res)=>{try{res.json(await Resource.find().sort({createdAt:-1}).limit(200))}catch{res.status(500).json({message:'Could not load resources'})}});
app.post('/api/resources',allow('faculty','library','admin'),upload.single('pdf'),async(req,res)=>{try{if(!req.file)return res.status(400).json({message:'A PDF file is required'});const{title,subject,kind='Subject Notes'}=req.body;if(!title||!subject){fs.unlinkSync(req.file.path);return res.status(400).json({message:'Title and subject are required'})}const r=await Resource.create({title,subject,kind,fileName:req.file.originalname,fileUrl:'/uploads/'+req.file.filename,uploadedBy:req.user._id,uploaderRole:req.user.role});res.status(201).json(r)}catch(e){res.status(500).json({message:e.message||'Upload failed'})}});
app.get('/api/attendance/demo',authenticate,(_,res)=>res.json({notice:'Demonstration endpoint only. Connect actual attendance records before production use.',subjects:[{subject:'Machine Learning',attended:24,total:28},{subject:'Database Management Systems',attended:22,total:26},{subject:'Operating Systems',attended:18,total:25},{subject:'Computer Networks',attended:21,total:24}]}));
app.get('/api/results/demo',authenticate,(_,res)=>res.json({notice:'Demonstration endpoint only. Connect actual marks and authorization before production use.',results:[{subject:'Machine Learning',exam:'Mid-1',marks:'24 / 30'},{subject:'Database Management Systems',exam:'Mid-1',marks:'26 / 30'}]}));
app.use((err,req,res,next)=>{if(err instanceof multer.MulterError)return res.status(400).json({message:err.message});if(err)return res.status(400).json({message:err.message||'Request failed'});next()});
const port=process.env.PORT||5000;
if(!process.env.JWT_SECRET){console.error('Set JWT_SECRET in server/.env');process.exit(1)}
try{if(!process.env.MONGODB_URI)throw new Error('Set MONGODB_URI in server/.env');await mongoose.connect(process.env.MONGODB_URI);console.log('MongoDB connected');app.listen(port,()=>console.log('Campus Connect Pro API on http://localhost:'+port))}catch(e){console.error('Server startup failed:',e.message);process.exit(1)}
