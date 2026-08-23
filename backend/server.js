require("dotenv").config();
const express=require("express");
const cors=require("cors");
const path=require("path");
const fs=require("fs");
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const crypto=require("crypto");
const bcrypt=require("bcryptjs");
const {body,validationResult}=require("express-validator");

const app=express();
const PORT=process.env.PORT||5000;
const ROOT=path.join(__dirname,"..");
const FRONTEND=path.join(ROOT,"frontend");
const ADMIN=path.join(ROOT,"admin");
const DATA=path.join(__dirname,"data");
const UPLOADS=path.join(FRONTEND,"assets","images","uploads");

// Local filesystem is used only when MongoDB is not configured (for local development).
if(!process.env.VERCEL){
  fs.mkdirSync(DATA,{recursive:true});
  fs.mkdirSync(UPLOADS,{recursive:true});
}

app.use(cors({origin:true}));
app.use(express.json({limit:"6mb"}));

const ContactSchema=new mongoose.Schema({
  name:{type:String,required:true,maxlength:80},email:{type:String,required:true,maxlength:120},
  subject:{type:String,maxlength:150},message:{type:String,required:true,maxlength:2000},
  status:{type:String,enum:["new","read"],default:"new"}
},{timestamps:true});
const ProjectSchema=new mongoose.Schema({
  title:{type:String,required:true,maxlength:150},category:{type:String,maxlength:80},description:{type:String,maxlength:3000},
  image:{type:String,maxlength:500000},github:{type:String,maxlength:500},demo:{type:String,maxlength:500},
  technologies:[String],published:{type:Boolean,default:true},featured:{type:Boolean,default:false}
},{timestamps:true});
const SkillSchema=new mongoose.Schema({_id:String,name:{type:String,required:true},icon:String,level:Number},{timestamps:true});
const JourneySchema=new mongoose.Schema({_id:String,type:String,period:String,title:{type:String,required:true},place:String,description:String},{timestamps:true});
const SettingsSchema=new mongoose.Schema({_id:{type:String,default:"main"},data:{type:mongoose.Schema.Types.Mixed,required:true}},{timestamps:true});
const ActivitySchema=new mongoose.Schema({_id:String,action:String,detail:String,createdAt:Date});
const ImageSchema=new mongoose.Schema({filename:String,contentType:String,data:Buffer,createdAt:{type:Date,default:Date.now}});
const AdminSchema=new mongoose.Schema({_id:{type:String,default:"main"},email:{type:String,required:true},passwordHash:{type:String,required:true},jwtSecret:{type:String,required:true},sessionVersion:{type:Number,default:1}},{timestamps:true});

const Contact=mongoose.models.Contact||mongoose.model("Contact",ContactSchema);
const Project=mongoose.models.Project||mongoose.model("Project",ProjectSchema);
const Skill=mongoose.models.Skill||mongoose.model("Skill",SkillSchema);
const Journey=mongoose.models.Journey||mongoose.model("Journey",JourneySchema);
const Settings=mongoose.models.Settings||mongoose.model("Settings",SettingsSchema);
const Activity=mongoose.models.Activity||mongoose.model("Activity",ActivitySchema);
const Image=mongoose.models.PortfolioImage||mongoose.model("PortfolioImage",ImageSchema);
const Admin=mongoose.models.PortfolioAdmin||mongoose.model("PortfolioAdmin",AdminSchema);

function defaultProjects(){return [
 {title:"Quality Index Prediction",category:"AI / ML",description:"Machine learning project for predicting quality index using ML algorithms.",image:"assets/images/project-1.svg",github:"#",demo:"#",technologies:["Python","Machine Learning"],published:true,featured:true},
 {title:"E-Commerce Web Application",category:"Full Stack",description:"Full-stack e-commerce application with product management, shopping flow and admin functionality.",image:"assets/images/project-2.svg",github:"#",demo:"#",technologies:["HTML","CSS","JavaScript","Node.js"],published:true,featured:false},
 {title:"Weather Forecast App",category:"API / Web",description:"Real-time weather application using weather API integration.",image:"assets/images/project-3.svg",github:"#",demo:"#",technologies:["JavaScript","API"],published:true,featured:false},
 {title:"Personal Portfolio",category:"Web",description:"Modern futuristic personal portfolio website.",image:"/assets/images/portfolio.png",github:"https://github.com/MohdMajid/portfolio",demo:"https://portfolio-alone-f43b.vercel.app/",technologies:["HTML","CSS","JavaScript","Node.js"],published:true,featured:true}
]}
function defaultSkills(){return [
 {id:"python",icon:"🐍",name:"Python",level:90},{id:"ml",icon:"🧠",name:"Machine Learning",level:80},{id:"dl",icon:"◉",name:"Deep Learning",level:75},{id:"ai",icon:"✦",name:"Artificial Intelligence",level:85},{id:"js",icon:"JS",name:"JavaScript",level:80},{id:"html",icon:"HTML",name:"HTML5",level:90},{id:"css",icon:"CSS",name:"CSS3",level:90},{id:"tw",icon:"TW",name:"Tailwind CSS",level:75},{id:"node",icon:"N",name:"Node.js",level:75},{id:"express",icon:"EX",name:"Express.js",level:75},{id:"mongo",icon:"DB",name:"MongoDB",level:70},{id:"git",icon:"G",name:"Git",level:80},{id:"github",icon:"GH",name:"GitHub",level:80}
]}
function defaultJourney(){return [
 {id:"exp1",type:"experience",period:"2024 — Present",title:"AI/ML Developer (Learning)",place:"Personal Projects",description:"Building ML models, deep learning projects and real-world AI solutions."},
 {id:"exp2",type:"education",period:"2022 — Present",title:"B.Tech CSE (AI & ML)",place:"Dr. A.P.J. Abdul Kalam Technical University (AKTU)",description:"Computer Science & Engineering with focus on Artificial Intelligence and Machine Learning."},
 {id:"exp3",type:"experience",period:"2023",title:"Web Developer",place:"Personal Projects",description:"Working on full-stack projects using modern web technologies."},
 {id:"exp4",type:"education",period:"2021",title:"Higher Secondary",place:"School Education",description:"Completed higher secondary education."}
]}
function defaultSettings(){return {
 title:"Mohd Majid | AI & ML Developer",name:"Mohd Majid",logo:"MM",role:"AI & ML DEVELOPER • FULL STACK ENTHUSIAST",eyebrow:"AI & ML Enthusiast",
 heroDescription:"I build smart, scalable and impactful digital solutions using Artificial Intelligence, Machine Learning and modern web technologies.",
 about:"I'm a B.Tech CSE (AI & ML) student and a passionate developer who enjoys turning ideas into useful real-world applications. I work across machine learning, web development and software projects.",
 location:"Lucknow, India",degree:"B.Tech CSE",focus:"AI & ML",profileImage:"assets/images/profile.png",cvPath:"assets/Mohd-Majid-CV.pdf",
 email:"mohdmajid51091@gmail.com",phone:"",social:{github:"https://github.com/MohdMajid",linkedin:"",instagram:"",x:""},
 theme:{accent:"purple-blue",dark:true},jwtExpiresIn:"8h",sessionVersion:1
}}
function defaultLocal(){return {contacts:[],projects:defaultProjects(),skills:defaultSkills(),experience:defaultJourney(),settings:defaultSettings(),activity:[]}}
const fallbackFile=path.join(DATA,"local.json");
function readLocal(){
  if(!fs.existsSync(fallbackFile))fs.writeFileSync(fallbackFile,JSON.stringify(defaultLocal(),null,2));
  const raw=JSON.parse(fs.readFileSync(fallbackFile,"utf8"));
  const d={...defaultLocal(),...raw};
  d.settings={...defaultSettings(),...(raw.settings||{}),social:{...defaultSettings().social,...(raw.settings?.social||{})},theme:{...defaultSettings().theme,...(raw.settings?.theme||{})}};
  if(!d.settings.sessionVersion)d.settings.sessionVersion=1;
  return d;
}
function writeLocal(data){fs.writeFileSync(fallbackFile,JSON.stringify(data,null,2))}

let dbPromise=null;
let dbReady=false;
async function connectDB(){
  if(!process.env.MONGODB_URI)return false;
  if(mongoose.connection.readyState===1){dbReady=true;return true}
  if(!dbPromise){
    dbPromise=mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:8000}).then(async()=>{dbReady=true;await seedMongo();return true}).catch(err=>{dbPromise=null;dbReady=false;console.error("MongoDB connection failed:",err.message);return false});
  }
  return dbPromise;
}
async function seedMongo(){
  // Seed only empty collections. Existing MongoDB data is never overwritten.
  if(await Project.countDocuments()===0)await Project.insertMany(defaultProjects());
  if(await Skill.countDocuments()===0)await Skill.insertMany(defaultSkills().map(x=>({_id:x.id,name:x.name,icon:x.icon,level:x.level})));
  if(await Journey.countDocuments()===0)await Journey.insertMany(defaultJourney().map(x=>({_id:x.id,...x})));
  if(await Settings.countDocuments()===0)await Settings.create({_id:"main",data:defaultSettings()});
  if(await Activity.countDocuments()===0)await Activity.create({_id:crypto.randomUUID(),action:"Database initialized",detail:"Portfolio MongoDB storage is ready.",createdAt:new Date()});
  if(await Admin.countDocuments()===0){
    const email=process.env.ADMIN_EMAIL||"admin@example.com";
    const password=process.env.ADMIN_PASSWORD||"change-this-password";
    const jwtSecret=process.env.JWT_SECRET||crypto.randomBytes(48).toString("hex");
    await Admin.create({_id:"main",email,passwordHash:await bcrypt.hash(password,12),jwtSecret,sessionVersion:1});
  }
}
async function persistent(req,res){
  if(!process.env.MONGODB_URI)return false;
  const ok=await connectDB();
  if(!ok){res.status(503).json({message:"MongoDB is not connected. Add MONGODB_URI in Vercel Environment Variables."});return null}
  return true;
}

async function getSettings(){
  if(process.env.MONGODB_URI){await connectDB();const row=await Settings.findById("main");return row?.data||defaultSettings()}
  return readLocal().settings;
}
async function saveSettings(data){
  if(process.env.MONGODB_URI){await connectDB();await Settings.findByIdAndUpdate("main",{$set:{data}},{upsert:true,new:true});return}
  const d=readLocal();d.settings=data;writeLocal(d);
}
async function logActivity(action,detail=""){
  const item={id:crypto.randomUUID(),action,detail,createdAt:new Date()};
  if(process.env.MONGODB_URI){if(await connectDB())await Activity.create({_id:item.id,action:item.action,detail:item.detail,createdAt:item.createdAt});return}
  const d=readLocal();d.activity.unshift(item);d.activity=d.activity.slice(0,100);writeLocal(d);
}

async function auth(req,res,next){
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!token)return res.status(401).json({message:"Authentication required."});
  try{
    if(process.env.MONGODB_URI){
      const ok=await connectDB();
      if(!ok)return res.status(503).json({message:"MongoDB is not connected."});
      const admin=await Admin.findById("main");
      if(!admin)return res.status(500).json({message:"Admin account is not initialized."});
      const decoded=jwt.verify(token,admin.jwtSecret);
      if(decoded.sessionVersion!==admin.sessionVersion)return res.status(401).json({message:"Session revoked. Please sign in again."});
      req.user=decoded;req.admin=admin;return next();
    }
    const decoded=jwt.verify(token,process.env.JWT_SECRET||"dev-secret-change-me");
    const settings=await getSettings();
    if(decoded.sessionVersion!==settings.sessionVersion)return res.status(401).json({message:"Session revoked. Please sign in again."});
    req.user=decoded;next();
  }catch{return res.status(401).json({message:"Invalid or expired token."})}
}

function writeEnvValue(key,value){
  // This is useful locally. On Vercel, environment variables are immutable at runtime;
  // password/secret changes should be performed in Vercel project settings.
  if(process.env.VERCEL){process.env[key]=value;return}
  const envFile=path.join(__dirname,".env");
  let text=fs.existsSync(envFile)?fs.readFileSync(envFile,"utf8"):"";
  const line=new RegExp(`^${key}=.*$`,`m`);
  if(line.test(text))text=text.replace(line,`${key}=${value}`);else text+=`${text.endsWith("\n")||!text?"":"\n"}${key}=${value}\n`;
  fs.writeFileSync(envFile,text);process.env[key]=value;
}

app.get("/api/health",async(req,res)=>{const mongo=process.env.MONGODB_URI?await connectDB():false;res.json({ok:true,storage:mongo?"mongodb":"local-json",persistent:!!mongo,version:"3.0.0"})});

app.get("/api/settings",async(req,res)=>{try{const s=await getSettings();res.json({...s,adminPasswordConfigured:!!process.env.ADMIN_PASSWORD,jwtSecretConfigured:!!process.env.JWT_SECRET,mongodbConfigured:!!process.env.MONGODB_URI})}catch{res.status(500).json({message:"Could not load settings."})}});
app.put("/api/settings",auth,async(req,res)=>{try{const current=await getSettings();const next={...current,...req.body,social:{...current.social,...(req.body.social||{})},theme:{...current.theme,...(req.body.theme||{})}};await saveSettings(next);await logActivity("Updated website settings");res.json(next)}catch(e){res.status(500).json({message:"Could not save settings."})}});

app.get("/api/skills",async(req,res)=>{try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;return res.json((await Skill.find().sort({createdAt:1})).map(x=>({id:x._id,name:x.name,icon:x.icon,level:x.level})))}res.json(readLocal().skills)}catch{res.status(500).json({message:"Could not load skills."})}});
app.post("/api/skills",auth,async(req,res)=>{try{if(!req.body.name)return res.status(400).json({message:"Skill name is required."});const item={id:crypto.randomUUID(),name:req.body.name,icon:req.body.icon||"✦",level:Math.max(0,Math.min(100,Number(req.body.level)||0))};if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;await Skill.create({_id:item.id,...item});}else{const d=readLocal();d.skills.push(item);writeLocal(d)}await logActivity("Added skill",item.name);res.status(201).json(item)}catch{res.status(500).json({message:"Could not create skill."})}});
app.put("/api/skills/:id",auth,async(req,res)=>{try{const level=Math.max(0,Math.min(100,Number(req.body.level)||0));if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const x=await Skill.findByIdAndUpdate(req.params.id,{name:req.body.name,icon:req.body.icon,level},{new:true});if(!x)return res.status(404).json({message:"Skill not found."});const item={id:x._id,name:x.name,icon:x.icon,level:x.level};await logActivity("Updated skill",item.name);return res.json(item)}const d=readLocal();const i=d.skills.findIndex(x=>String(x.id)===req.params.id);if(i<0)return res.status(404).json({message:"Skill not found."});d.skills[i]={...d.skills[i],...req.body,level};writeLocal(d);await logActivity("Updated skill",d.skills[i].name);res.json(d.skills[i])}catch{res.status(500).json({message:"Could not update skill."})}});
app.delete("/api/skills/:id",auth,async(req,res)=>{try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const x=await Skill.findByIdAndDelete(req.params.id);if(x)await logActivity("Deleted skill",x.name);return res.json({message:"Deleted"})}const d=readLocal();const old=d.skills.find(x=>String(x.id)===req.params.id);d.skills=d.skills.filter(x=>String(x.id)!==req.params.id);writeLocal(d);await logActivity("Deleted skill",old?.name||req.params.id);res.json({message:"Deleted"})}catch{res.status(500).json({message:"Could not delete skill."})}});

app.get("/api/experience",async(req,res)=>{try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;return res.json((await Journey.find().sort({createdAt:-1})).map(x=>({id:x._id,type:x.type,period:x.period,title:x.title,place:x.place,description:x.description})))}res.json(readLocal().experience)}catch{res.status(500).json({message:"Could not load experience."})}});
app.post("/api/experience",auth,async(req,res)=>{try{if(!req.body.title)return res.status(400).json({message:"Title is required."});const item={id:crypto.randomUUID(),type:req.body.type||"experience",period:req.body.period||"",title:req.body.title,place:req.body.place||"",description:req.body.description||""};if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;await Journey.create({_id:item.id,...item})}else{const d=readLocal();d.experience.unshift(item);writeLocal(d)}await logActivity("Added journey item",item.title);res.status(201).json(item)}catch{res.status(500).json({message:"Could not create journey item."})}});
app.put("/api/experience/:id",auth,async(req,res)=>{try{const payload={type:req.body.type,period:req.body.period,title:req.body.title,place:req.body.place,description:req.body.description};if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const x=await Journey.findByIdAndUpdate(req.params.id,payload,{new:true});if(!x)return res.status(404).json({message:"Item not found."});const item={id:x._id,...x.toObject()};delete item._id;await logActivity("Updated journey item",item.title);return res.json(item)}const d=readLocal();const i=d.experience.findIndex(x=>String(x.id)===req.params.id);if(i<0)return res.status(404).json({message:"Item not found."});d.experience[i]={...d.experience[i],...payload};writeLocal(d);await logActivity("Updated journey item",d.experience[i].title);res.json(d.experience[i])}catch{res.status(500).json({message:"Could not update journey item."})}});
app.delete("/api/experience/:id",auth,async(req,res)=>{try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const x=await Journey.findByIdAndDelete(req.params.id);if(x)await logActivity("Deleted journey item",x.title);return res.json({message:"Deleted"})}const d=readLocal();const old=d.experience.find(x=>String(x.id)===req.params.id);d.experience=d.experience.filter(x=>String(x.id)!==req.params.id);writeLocal(d);await logActivity("Deleted journey item",old?.title||req.params.id);res.json({message:"Deleted"})}catch{res.status(500).json({message:"Could not delete journey item."})}});

app.post("/api/upload",auth,async(req,res)=>{
  try{
    const {filename,data}=req.body||{};
    if(!filename||!data||!String(data).startsWith("data:image/"))return res.status(400).json({message:"Please select a valid image."});
    if(String(data).length>3*1024*1024)return res.status(413).json({message:"Image is too large. Maximum 2 MB."});
    const m=String(data).match(/^data:(image\/(?:png|jpeg|jpg|webp|gif|svg\+xml));base64,(.+)$/);
    if(!m)return res.status(400).json({message:"Unsupported image format."});
    const contentType=m[1]==="image/jpg"?"image/jpeg":m[1];
    const buffer=Buffer.from(m[2],"base64");
    if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const image=await Image.create({filename:path.basename(filename),contentType,data:buffer});const url=`/api/uploads/${image._id}`;await logActivity("Uploaded image",filename);return res.status(201).json({path:url,url})}
    fs.mkdirSync(UPLOADS,{recursive:true});const ext=contentType.split("/")[1].replace("+xml","svg");const safe=path.basename(filename).replace(/[^a-zA-Z0-9._-]/g,"-").replace(/\.[^.]+$/,"" );const final=`${Date.now()}-${safe}.${ext}`;fs.writeFileSync(path.join(UPLOADS,final),buffer);await logActivity("Uploaded image",final);res.status(201).json({path:`assets/images/uploads/${final}`,url:`/assets/images/uploads/${final}`})
  }catch(e){console.error(e);res.status(500).json({message:"Could not upload image."})}
});
app.get("/api/uploads/:id",async(req,res)=>{try{if(!process.env.MONGODB_URI)return res.status(404).end();const ok=await connectDB();if(!ok)return res.status(503).end();const image=await Image.findById(req.params.id);if(!image)return res.status(404).end();res.set("Content-Type",image.contentType);res.set("Cache-Control","public, max-age=31536000, immutable");res.end(image.data)}catch{res.status(404).end()}});

app.post("/api/contact",body("name").trim().isLength({min:2,max:80}).withMessage("Name is required."),body("email").trim().isEmail().withMessage("Valid email is required."),body("subject").optional().trim().isLength({max:150}),body("message").trim().isLength({min:5,max:2000}).withMessage("Message is required."),async(req,res)=>{const errors=validationResult(req);if(!errors.isEmpty())return res.status(400).json({message:errors.array()[0].msg});const payload={name:req.body.name,email:req.body.email,subject:req.body.subject||"",message:req.body.message};try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const c=await Contact.create(payload);return res.status(201).json({message:"Message received successfully.",id:c._id})}const d=readLocal();d.contacts.unshift({...payload,id:Date.now(),status:"new",createdAt:new Date().toISOString()});writeLocal(d);res.status(201).json({message:"Message received successfully."})}catch{res.status(500).json({message:"Could not save message."})}});

app.get("/api/projects",async(req,res)=>{try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;let q=Project.find();if(req.query.admin!=="1")q=q.where("published").equals(true);const p=await q.sort({createdAt:-1});return res.json(p)}const d=readLocal();res.json(req.query.admin==="1"?d.projects:d.projects.filter(x=>x.published!==false))}catch(e){console.error(e);res.status(500).json({message:"Could not load projects."})}});
app.post("/api/projects",auth,async(req,res)=>{try{const p={...req.body,technologies:Array.isArray(req.body.technologies)?req.body.technologies:String(req.body.technologies||"").split(",").map(x=>x.trim()).filter(Boolean),published:req.body.published!==false,featured:!!req.body.featured};if(!p.title)return res.status(400).json({message:"Title is required."});if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const item=await Project.create(p);await logActivity("Added project",item.title);return res.status(201).json(item)}const d=readLocal();const item={...p,id:crypto.randomUUID(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};d.projects.unshift(item);writeLocal(d);await logActivity("Added project",item.title);res.status(201).json(item)}catch(e){console.error(e);res.status(500).json({message:"Could not create project."})}});
app.put("/api/projects/:id",auth,async(req,res)=>{try{const payload={...req.body};if(payload.technologies&&!Array.isArray(payload.technologies))payload.technologies=String(payload.technologies).split(",").map(x=>x.trim()).filter(Boolean);if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const p=await Project.findByIdAndUpdate(req.params.id,payload,{new:true,runValidators:true});if(!p)return res.status(404).json({message:"Project not found."});await logActivity("Updated project",p.title);return res.json(p)}const d=readLocal();const i=d.projects.findIndex(x=>String(x.id)===req.params.id);if(i<0)return res.status(404).json({message:"Project not found."});d.projects[i]={...d.projects[i],...payload,updatedAt:new Date().toISOString()};writeLocal(d);await logActivity("Updated project",d.projects[i].title);res.json(d.projects[i])}catch(e){console.error(e);res.status(500).json({message:"Could not update project."})}});
app.delete("/api/projects/:id",auth,async(req,res)=>{try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const p=await Project.findByIdAndDelete(req.params.id);if(p)await logActivity("Deleted project",p.title);return res.json({message:"Deleted"})}const d=readLocal();const old=d.projects.find(x=>String(x.id)===req.params.id);d.projects=d.projects.filter(x=>String(x.id)!==req.params.id);writeLocal(d);await logActivity("Deleted project",old?.title||req.params.id);res.json({message:"Deleted"})}catch{res.status(500).json({message:"Could not delete project."})}});

app.get("/api/contact",auth,async(req,res)=>{try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;return res.json(await Contact.find().sort({createdAt:-1}))}res.json(readLocal().contacts)}catch{res.status(500).json({message:"Could not load messages."})}});
app.put("/api/contact/:id/status",auth,async(req,res)=>{const status=req.body.status==="read"?"read":"new";try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const c=await Contact.findByIdAndUpdate(req.params.id,{status},{new:true});if(!c)return res.status(404).json({message:"Message not found."});return res.json(c)}const d=readLocal();const i=d.contacts.findIndex(x=>String(x.id)===req.params.id);if(i<0)return res.status(404).json({message:"Message not found."});d.contacts[i].status=status;writeLocal(d);res.json(d.contacts[i])}catch{res.status(500).json({message:"Could not update message."})}});
app.delete("/api/contact/:id",auth,async(req,res)=>{try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;await Contact.findByIdAndDelete(req.params.id);return res.json({message:"Deleted"})}const d=readLocal();d.contacts=d.contacts.filter(x=>String(x.id)!==req.params.id);writeLocal(d);res.json({message:"Deleted"})}catch{res.status(500).json({message:"Could not delete message."})}});

app.get("/api/activity",auth,async(req,res)=>{try{if(process.env.MONGODB_URI){const ok=await persistent(req,res);if(ok===null)return;const rows=await Activity.find().sort({createdAt:-1}).limit(100);return res.json(rows.map(x=>({id:x._id,action:x.action,detail:x.detail,createdAt:x.createdAt})))}res.json(readLocal().activity)}catch{res.status(500).json({message:"Could not load activity."})}});

app.post("/api/admin/change-password",auth,async(req,res)=>{
  const {currentPassword,newPassword}=req.body;
  if(!currentPassword||!newPassword||newPassword.length<6)return res.status(400).json({message:"New password must be at least 6 characters."});
  try{
    if(process.env.MONGODB_URI){
      const admin=await Admin.findById("main");
      if(!admin||!(await bcrypt.compare(currentPassword,admin.passwordHash)))return res.status(401).json({message:"Current password is incorrect."});
      admin.passwordHash=await bcrypt.hash(newPassword,12);admin.sessionVersion+=1;await admin.save();
      await logActivity("Changed admin password");
      return res.json({message:"Password changed successfully. Please sign in again."});
    }
    if(currentPassword!==(process.env.ADMIN_PASSWORD||"change-this-password"))return res.status(401).json({message:"Current password is incorrect."});
    writeEnvValue("ADMIN_PASSWORD",newPassword);const s=await getSettings();s.sessionVersion=(s.sessionVersion||1)+1;await saveSettings(s);await logActivity("Changed admin password");res.json({message:"Password changed. Please sign in again."});
  }catch{res.status(500).json({message:"Could not change password."})}
});
app.post("/api/admin/logout-all",auth,async(req,res)=>{try{if(process.env.MONGODB_URI){const admin=await Admin.findById("main");admin.sessionVersion+=1;await admin.save();}else{const s=await getSettings();s.sessionVersion=(s.sessionVersion||1)+1;await saveSettings(s)}await logActivity("Revoked all admin sessions");res.json({message:"All admin sessions have been revoked."})}catch{res.status(500).json({message:"Could not revoke sessions."})}});
app.post("/api/admin/regenerate-secret",auth,async(req,res)=>{try{const secret=crypto.randomBytes(48).toString("hex");if(process.env.MONGODB_URI){const admin=await Admin.findById("main");admin.jwtSecret=secret;admin.sessionVersion+=1;await admin.save();}else{writeEnvValue("JWT_SECRET",secret);const s=await getSettings();s.sessionVersion=(s.sessionVersion||1)+1;await saveSettings(s)}await logActivity("Regenerated JWT secret");res.json({message:"JWT secret regenerated. All sessions were revoked."})}catch{res.status(500).json({message:"Could not regenerate JWT secret."})}});

app.post("/api/admin/login",body("email").isEmail(),body("password").isLength({min:6}),async(req,res)=>{
  const errors=validationResult(req);if(!errors.isEmpty())return res.status(400).json({message:"Invalid login details."});
  try{
    if(process.env.MONGODB_URI){
      const ok=await connectDB();if(!ok)return res.status(503).json({message:"MongoDB is not connected."});
      const admin=await Admin.findById("main");if(!admin)return res.status(500).json({message:"Admin account is not initialized."});
      if(req.body.email!==admin.email||!(await bcrypt.compare(req.body.password,admin.passwordHash)))return res.status(401).json({message:"Invalid credentials."});
      const settings=await getSettings();const token=jwt.sign({role:"admin",email:admin.email,sessionVersion:admin.sessionVersion},admin.jwtSecret,{expiresIn:settings.jwtExpiresIn||"8h"});
      await logActivity("Admin login",admin.email);return res.json({token});
    }
    const email=process.env.ADMIN_EMAIL||"admin@example.com";const password=process.env.ADMIN_PASSWORD||"change-this-password";
    if(req.body.email!==email||req.body.password!==password)return res.status(401).json({message:"Invalid credentials."});
    const settings=await getSettings();const token=jwt.sign({role:"admin",email,sessionVersion:settings.sessionVersion},process.env.JWT_SECRET||"dev-secret-change-me",{expiresIn:settings.jwtExpiresIn||"8h"});
    await logActivity("Admin login",email);res.json({token});
  }catch(e){console.error(e);res.status(500).json({message:"Could not sign in."})}
});

// Static files and SPA fallback. On Vercel this Express app is exported through api/index.js.
app.use(express.static(FRONTEND));
app.use("/admin",express.static(ADMIN));
app.use((req,res)=>res.sendFile(path.join(FRONTEND,"index.html")));

if(require.main===module){app.listen(PORT,()=>console.log(`Portfolio running at http://localhost:${PORT}`))}
module.exports=app;
