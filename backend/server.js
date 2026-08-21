require("dotenv").config();
const express=require("express");
const cors=require("cors");
const path=require("path");
const fs=require("fs");
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const crypto=require("crypto");
const {body,validationResult}=require("express-validator");

const app=express();
const PORT=process.env.PORT||5000;
// Safe starter credentials. Change these later in Vercel Environment Variables.
const DEFAULT_ADMIN_EMAIL="mohdmajid51091@gmail.com";
const DEFAULT_ADMIN_PASSWORD="Majid@51091";
const DEFAULT_JWT_SECRET="mohd-majid-portfolio-change-this-secret";
const ROOT=path.join(__dirname,"..");
const FRONTEND=ROOT;
const ADMIN=path.join(ROOT,"admin");
const IS_VERCEL=!!process.env.VERCEL;
const DATA=IS_VERCEL?path.join("/tmp","portfolio-data"):path.join(__dirname,"data");
const UPLOADS=IS_VERCEL?path.join("/tmp","portfolio-uploads"):path.join(FRONTEND,"assets","images","uploads");
fs.mkdirSync(DATA,{recursive:true});
fs.mkdirSync(UPLOADS,{recursive:true});

app.use(cors({origin:true}));
app.use(express.json({limit:"8mb"}));

const ContactSchema=new mongoose.Schema({
  name:{type:String,required:true,maxlength:80},email:{type:String,required:true,maxlength:120},
  subject:{type:String,maxlength:150},message:{type:String,required:true,maxlength:2000},
  status:{type:String,enum:["new","read"],default:"new"}
},{timestamps:true});
const Contact=mongoose.model("Contact",ContactSchema);

const ProjectSchema=new mongoose.Schema({
  title:{type:String,required:true},category:String,description:String,image:String,github:String,demo:String,
  technologies:[String],published:{type:Boolean,default:true},featured:{type:Boolean,default:false}
},{timestamps:true});
const Project=mongoose.model("Project",ProjectSchema);

const fallbackFile=path.join(DATA,"local.json");
function defaultData(){return {
  contacts:[],
  projects:defaultProjects(),
  skills:[
    {id:"python",icon:"🐍",name:"Python",level:90},
    {id:"ml",icon:"🧠",name:"Machine Learning",level:80},
    {id:"dl",icon:"◉",name:"Deep Learning",level:75},
    {id:"ai",icon:"✦",name:"Artificial Intelligence",level:85},
    {id:"js",icon:"JS",name:"JavaScript",level:80},
    {id:"html",icon:"HTML",name:"HTML5",level:90},
    {id:"css",icon:"CSS",name:"CSS3",level:90},
    {id:"tw",icon:"TW",name:"Tailwind CSS",level:75},
    {id:"node",icon:"N",name:"Node.js",level:75},
    {id:"express",icon:"EX",name:"Express.js",level:75},
    {id:"mongo",icon:"DB",name:"MongoDB",level:70},
    {id:"git",icon:"G",name:"Git",level:80},
    {id:"github",icon:"GH",name:"GitHub",level:80}
  ],
  experience:[
    {id:"exp1",type:"experience",period:"2024 — Present",title:"AI/ML Developer (Learning)",place:"Personal Projects",description:"Building ML models, deep learning projects and real-world AI solutions."},
    {id:"exp2",type:"education",period:"2022 — Present",title:"B.Tech CSE (AI & ML)",place:"Dr. A.P.J. Abdul Kalam Technical University (AKTU)",description:"Computer Science & Engineering with focus on Artificial Intelligence and Machine Learning."},
    {id:"exp3",type:"experience",period:"2023",title:"Web Developer",place:"Personal Projects",description:"Working on full-stack projects using modern web technologies."},
    {id:"exp4",type:"education",period:"2021",title:"Higher Secondary",place:"School Education",description:"Completed higher secondary education."}
  ],
  settings:{
    title:"Mohd Majid | AI & ML Developer",name:"Mohd Majid",logo:"MM",role:"AI & ML DEVELOPER • FULL STACK ENTHUSIAST",
    eyebrow:"AI & ML Enthusiast",heroDescription:"I build smart, scalable and impactful digital solutions using Artificial Intelligence, Machine Learning and modern web technologies.",
    about:"I'm a B.Tech CSE (AI & ML) student and a passionate developer who enjoys turning ideas into useful real-world applications. I work across machine learning, web development and software projects.",
    location:"Lucknow, India",degree:"B.Tech CSE",focus:"AI & ML",profileImage:"assets/images/profile.png",cvPath:"assets/Mohd-Majid-CV.pdf",
    email:"mohdmajid51091@gmail.com",phone:"",social:{github:"https://github.com/MohdMajid",linkedin:"",instagram:"",x:""},
    theme:{accent:"purple-blue",dark:true},jwtExpiresIn:"8h",sessionVersion:1
  },
  activity:[]
}}
function defaultProjects(){return [
 {title:"Quality Index Prediction",category:"AI / ML",description:"Machine learning project for predicting quality index using ML algorithms.",image:"assets/images/project-1.svg",github:"#",demo:"#",technologies:["Python","Machine Learning"],published:true,featured:true},
 {title:"E-Commerce Web Application",category:"Full Stack",description:"Full-stack e-commerce application with product management, shopping flow and admin functionality.",image:"assets/images/project-2.svg",github:"#",demo:"#",technologies:["HTML","CSS","JavaScript","Node.js"],published:true,featured:false},
 {title:"Weather Forecast App",category:"API / Web",description:"Real-time weather application using weather API integration.",image:"assets/images/project-3.svg",github:"#",demo:"#",technologies:["JavaScript","API"],published:true,featured:false},
 {title:"Personal Portfolio",category:"Web",description:"Modern futuristic personal portfolio website.",image:"/assets/images/portfolio.png",github:"https://github.com/MohdMajid/portfolio",demo:"https://portfolio-alone-f43b.vercel.app/",technologies:["HTML","CSS","JavaScript","Node.js"],published:true,featured:true}
]}
function readLocal(){
  if(!fs.existsSync(fallbackFile))fs.writeFileSync(fallbackFile,JSON.stringify(defaultData(),null,2));
  let d={...defaultData(),...JSON.parse(fs.readFileSync(fallbackFile,"utf8"))};
  for(const k of Object.keys(defaultData())) if(d[k]===undefined)d[k]=defaultData()[k];
  if(!d.settings.social)d.settings.social=defaultData().settings.social;
  if(!d.settings.sessionVersion)d.settings.sessionVersion=1;
  return d;
}
function writeLocal(data){fs.writeFileSync(fallbackFile,JSON.stringify(data,null,2))}
function logActivity(action,detail=""){
  const d=readLocal();d.activity.unshift({id:Date.now(),action,detail,createdAt:new Date().toISOString()});d.activity=d.activity.slice(0,100);writeLocal(d)
}

let dbReady=false;
async function connectDB(){
  if(!process.env.MONGODB_URI){console.log("MongoDB URI not set — using local JSON storage.");return}
  try{await mongoose.connect(process.env.MONGODB_URI);dbReady=true;console.log("MongoDB connected.")}catch(e){console.error("MongoDB connection failed — using local JSON storage.")}
}
connectDB();

function getSettings(){return readLocal().settings}
function auth(req,res,next){
  const token=(req.headers.authorization||"").replace("Bearer ","");
  if(!token)return res.status(401).json({message:"Authentication required."});
  try{
    const decoded=jwt.verify(token,process.env.JWT_SECRET||DEFAULT_JWT_SECRET);
    if(decoded.sessionVersion!==getSettings().sessionVersion)return res.status(401).json({message:"Session revoked. Please sign in again."});
    req.user=decoded;next()
  }catch{return res.status(401).json({message:"Invalid or expired token."})}
}
function writeEnvValue(key,value){
  if(IS_VERCEL) throw new Error("Environment variables must be changed in Vercel Project Settings.");
  const envFile=path.join(__dirname,".env");
  let text=fs.existsSync(envFile)?fs.readFileSync(envFile,"utf8"):"";
  const line=new RegExp(`^${key}=.*$`,`m`);
  if(line.test(text))text=text.replace(line,`${key}=${value}`);else text+=`${text.endsWith("\n")||!text?"":"\n"}${key}=${value}\n`;
  fs.writeFileSync(envFile,text);process.env[key]=value;
}

app.get("/api/health",(req,res)=>res.json({ok:true,storage:dbReady?"mongodb":"local-json",version:"2.0.0"}));

app.get("/api/settings",(req,res)=>{const s=getSettings();res.json({...s,adminPasswordConfigured:!!(process.env.ADMIN_PASSWORD||DEFAULT_ADMIN_PASSWORD),jwtSecretConfigured:!!(process.env.JWT_SECRET||DEFAULT_JWT_SECRET)})});
app.put("/api/settings",auth,(req,res)=>{try{const d=readLocal();d.settings={...d.settings,...req.body,social:{...d.settings.social,...(req.body.social||{})},theme:{...d.settings.theme,...(req.body.theme||{})}};writeLocal(d);logActivity("Updated website settings");res.json(d.settings)}catch{res.status(500).json({message:"Could not save settings."})}});

app.get("/api/skills",(req,res)=>res.json(readLocal().skills));
app.post("/api/skills",auth,(req,res)=>{const {name,icon="✦",level=70}=req.body;if(!name)return res.status(400).json({message:"Skill name is required."});const d=readLocal();const item={id:Date.now().toString(),name,icon,level:Math.max(0,Math.min(100,Number(level)||0))};d.skills.push(item);writeLocal(d);logActivity("Added skill",name);res.status(201).json(item)});
app.put("/api/skills/:id",auth,(req,res)=>{const d=readLocal();const i=d.skills.findIndex(x=>String(x.id)===req.params.id);if(i<0)return res.status(404).json({message:"Skill not found."});d.skills[i]={...d.skills[i],...req.body,level:Math.max(0,Math.min(100,Number(req.body.level??d.skills[i].level)||0))};writeLocal(d);logActivity("Updated skill",d.skills[i].name);res.json(d.skills[i])});
app.delete("/api/skills/:id",auth,(req,res)=>{const d=readLocal();const old=d.skills.find(x=>String(x.id)===req.params.id);d.skills=d.skills.filter(x=>String(x.id)!==req.params.id);writeLocal(d);logActivity("Deleted skill",old?.name||req.params.id);res.json({message:"Deleted"})});

app.get("/api/experience",(req,res)=>res.json(readLocal().experience));
app.post("/api/experience",auth,(req,res)=>{if(!req.body.title)return res.status(400).json({message:"Title is required."});const d=readLocal();const item={...req.body,id:Date.now().toString(),type:req.body.type||"experience"};d.experience.unshift(item);writeLocal(d);logActivity("Added journey item",item.title);res.status(201).json(item)});
app.put("/api/experience/:id",auth,(req,res)=>{const d=readLocal();const i=d.experience.findIndex(x=>String(x.id)===req.params.id);if(i<0)return res.status(404).json({message:"Item not found."});d.experience[i]={...d.experience[i],...req.body};writeLocal(d);logActivity("Updated journey item",d.experience[i].title);res.json(d.experience[i])});
app.delete("/api/experience/:id",auth,(req,res)=>{const d=readLocal();const old=d.experience.find(x=>String(x.id)===req.params.id);d.experience=d.experience.filter(x=>String(x.id)!==req.params.id);writeLocal(d);logActivity("Deleted journey item",old?.title||req.params.id);res.json({message:"Deleted"})});

app.post("/api/upload",auth,(req,res)=>{
  try{
    const {filename,data}=req.body||{};
    if(!filename||!data||!String(data).startsWith("data:image/"))return res.status(400).json({message:"Please select a valid image."});
    if(String(data).length>7*1024*1024)return res.status(413).json({message:"Image is too large. Maximum 5 MB."});
    const m=String(data).match(/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,(.+)$/);
    if(!m)return res.status(400).json({message:"Unsupported image format."});
    const ext=m[1]==="jpeg"||m[1]==="jpg"?"jpg":m[1]==="svg+xml"?"svg":m[1];
    const safe=path.basename(filename).replace(/[^a-zA-Z0-9._-]/g,"-").replace(/\.[^.]+$/,"" );
    const final=`${Date.now()}-${safe}.${ext}`;fs.writeFileSync(path.join(UPLOADS,final),Buffer.from(m[2],"base64"));
    logActivity("Uploaded image",final);res.status(201).json({path:`assets/images/uploads/${final}`,url:`/assets/images/uploads/${final}`})
  }catch{res.status(500).json({message:"Could not upload image."})}
});

app.post("/api/contact",
  body("name").trim().isLength({min:2,max:80}).withMessage("Name is required."),
  body("email").trim().isEmail().withMessage("Valid email is required."),
  body("subject").optional().trim().isLength({max:150}),
  body("message").trim().isLength({min:5,max:2000}).withMessage("Message is required."),
  async(req,res)=>{const errors=validationResult(req);if(!errors.isEmpty())return res.status(400).json({message:errors.array()[0].msg});const payload={name:req.body.name,email:req.body.email,subject:req.body.subject||"",message:req.body.message};try{if(dbReady){await Contact.create(payload)}else{const d=readLocal();d.contacts.unshift({...payload,id:Date.now(),status:"new",createdAt:new Date().toISOString()});writeLocal(d)}res.status(201).json({message:"Message received successfully."})}catch{res.status(500).json({message:"Could not save message."})}});

app.get("/api/projects",async(req,res)=>{try{if(dbReady){let q=Project.find();if(req.query.admin!=="1")q=q.where("published").equals(true);const p=await q.sort({createdAt:-1});return res.json(req.query.admin==="1"?p:(p.length?p:defaultProjects().filter(x=>x.published!==false)))}const d=readLocal();res.json(req.query.admin==="1"?d.projects:d.projects.filter(x=>x.published!==false))}catch{res.status(500).json({message:"Could not load projects."})}});
app.post("/api/projects",auth,async(req,res)=>{const p={...req.body,technologies:Array.isArray(req.body.technologies)?req.body.technologies:String(req.body.technologies||"").split(",").map(x=>x.trim()).filter(Boolean),published:req.body.published!==false,featured:!!req.body.featured};if(!p.title)return res.status(400).json({message:"Title is required."});try{if(dbReady){const item=await Project.create(p);logActivity("Added project",item.title);return res.status(201).json(item)}const d=readLocal();const item={...p,id:Date.now()};d.projects.unshift(item);writeLocal(d);logActivity("Added project",item.title);res.status(201).json(item)}catch{res.status(500).json({message:"Could not create project."})}});
app.put("/api/projects/:id",auth,async(req,res)=>{try{const payload={...req.body};if(payload.technologies&&!Array.isArray(payload.technologies))payload.technologies=String(payload.technologies).split(",").map(x=>x.trim()).filter(Boolean);if(dbReady){const p=await Project.findByIdAndUpdate(req.params.id,payload,{new:true});if(!p)return res.status(404).json({message:"Project not found."});logActivity("Updated project",p.title);return res.json(p)}const d=readLocal();const i=d.projects.findIndex(x=>String(x.id)===req.params.id);if(i<0)return res.status(404).json({message:"Project not found."});d.projects[i]={...d.projects[i],...payload};writeLocal(d);logActivity("Updated project",d.projects[i].title);res.json(d.projects[i])}catch{res.status(500).json({message:"Could not update project."})}});
app.delete("/api/projects/:id",auth,async(req,res)=>{try{if(dbReady){const p=await Project.findByIdAndDelete(req.params.id);if(p)logActivity("Deleted project",p.title);return res.json({message:"Deleted"})}const d=readLocal();const old=d.projects.find(x=>String(x.id)===req.params.id);d.projects=d.projects.filter(x=>String(x.id)!==req.params.id);writeLocal(d);logActivity("Deleted project",old?.title||req.params.id);res.json({message:"Deleted"})}catch{res.status(500).json({message:"Could not delete project."})}});

app.get("/api/contact",auth,async(req,res)=>{try{if(dbReady)return res.json(await Contact.find().sort({createdAt:-1}));res.json(readLocal().contacts)}catch{res.status(500).json({message:"Could not load messages."})}});
app.put("/api/contact/:id/status",auth,async(req,res)=>{const status=req.body.status==="read"?"read":"new";try{if(dbReady){const c=await Contact.findByIdAndUpdate(req.params.id,{status},{new:true});if(!c)return res.status(404).json({message:"Message not found."});return res.json(c)}const d=readLocal();const i=d.contacts.findIndex(x=>String(x.id)===req.params.id);if(i<0)return res.status(404).json({message:"Message not found."});d.contacts[i].status=status;writeLocal(d);res.json(d.contacts[i])}catch{res.status(500).json({message:"Could not update message."})}});
app.delete("/api/contact/:id",auth,async(req,res)=>{try{if(dbReady){await Contact.findByIdAndDelete(req.params.id);return res.json({message:"Deleted"})}const d=readLocal();d.contacts=d.contacts.filter(x=>String(x.id)!==req.params.id);writeLocal(d);res.json({message:"Deleted"})}catch{res.status(500).json({message:"Could not delete message."})}});

app.get("/api/activity",auth,(req,res)=>res.json(readLocal().activity));

app.post("/api/admin/change-password",auth,(req,res)=>{const {currentPassword,newPassword}=req.body;if(!currentPassword||!newPassword||newPassword.length<6)return res.status(400).json({message:"New password must be at least 6 characters."});if(currentPassword!==(process.env.ADMIN_PASSWORD||DEFAULT_ADMIN_PASSWORD))return res.status(401).json({message:"Current password is incorrect."});writeEnvValue("ADMIN_PASSWORD",newPassword);const d=readLocal();d.settings.sessionVersion++;writeLocal(d);logActivity("Changed admin password");res.json({message:"Password changed. Please sign in again."})});
app.post("/api/admin/logout-all",auth,(req,res)=>{const d=readLocal();d.settings.sessionVersion++;writeLocal(d);logActivity("Revoked all admin sessions");res.json({message:"All admin sessions have been revoked."})});
app.post("/api/admin/regenerate-secret",auth,(req,res)=>{const secret=crypto.randomBytes(48).toString("hex");writeEnvValue("JWT_SECRET",secret);const d=readLocal();d.settings.sessionVersion++;writeLocal(d);logActivity("Regenerated JWT secret");res.json({message:"JWT secret regenerated. All sessions were revoked."})});

app.post("/api/admin/login",
  body("email").isEmail(),body("password").isLength({min:6}),
  async(req,res)=>{const errors=validationResult(req);if(!errors.isEmpty())return res.status(400).json({message:"Invalid login details."});const email=process.env.ADMIN_EMAIL||DEFAULT_ADMIN_EMAIL;const password=process.env.ADMIN_PASSWORD||DEFAULT_ADMIN_PASSWORD;if(req.body.email!==email||req.body.password!==password)return res.status(401).json({message:"Invalid credentials."});const settings=getSettings();const token=jwt.sign({role:"admin",email,sessionVersion:settings.sessionVersion},process.env.JWT_SECRET||DEFAULT_JWT_SECRET,{expiresIn:settings.jwtExpiresIn||"8h"});logActivity("Admin login",email);res.json({token})});

if(!IS_VERCEL){
  app.use(express.static(FRONTEND));
  app.use("/admin",express.static(ADMIN));
  app.use((req,res)=>res.sendFile(path.join(FRONTEND,"index.html")));
  app.listen(PORT,()=>console.log(`Portfolio running at http://localhost:${PORT}`));
}

app.get("/",(req,res)=>res.json({
  ok:true,
  service:"Mohd Majid Portfolio API",
  health:"/api/health"
}));

module.exports=app;
