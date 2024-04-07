const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session')
const { log } = require('console')
const mongodbSession = require('connect-mongodb-session')(session)


const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const isAuth = (req,res,next)=>{
    if(req.session.isLoggedin == true){
        next()
    }else{
        res.redirect('/admin')
    }
}

mongoose.connect('mongodb+srv://sai4502:sai4502@cluster0.qmhmt5z.mongodb.net/').then(()=>{
    console.log('Connected');
})

const store = new mongodbSession({
    uri: "mongodb+srv://todos:sai4502@cluster0.risubea.mongodb.net/?retryWrites=true&w=majority",
    collection: 'session'
})
app.use(session({
    secret: "this is secret key",
    resave: false,
    saveUninitialized: false,
    store: store
}))

const userSchema = new mongoose.Schema({
    username: {type: String},
    password: {type: String},
    role: {type: Number}
})

const Users = mongoose.model('users', userSchema);

const labs = new mongoose.Schema({
    branch: {type: String,unique: true},
    labs: {type: Number},
    lab1: {type: String},
    lab2: {type: String},
    lab3: {type: String},
    lab4: {type: String},
    lab1s: {type: Number},
    lab2s: {type: Number},
    lab3s: {type: Number},
    lab4s: {type: Number}
})
const Labs = mongoose.model('labs',labs);

const issue = new mongoose.Schema({
    branch: {type: String},
    lab: {type: String},
    sysno: {type: Number},
    issue: {type: String},
})

const Issues = mongoose.model('issue', issue);

app.get('/', async(req, res) =>{
    let labs = await Labs.find();
    let issues = await Issues.find();
    res.render('index',{labs: labs,issues: issues});
})

app.get('/labs',(req, res) =>{
    res.render('labs');
})

app.post('/labs',(req, res) =>{
    res.json("hi")
})

app.get('/admin',(req, res) =>{
    res.render('admin');
})

app.post('/admin',async(req, res) =>{
    console.log(req.body.username,req.body.password);
    let user = await Users.findOne({username:req.body.username});
    if(user){
        if(user.password === req.body.password && user.role === 1){
            req.session.isLoggedin = true;
            res.redirect('/Campusync-dashboard');
        }
        else{
            res.redirect('/admin');
        }
    }else{
        res.redirect('/admin');
    }
})

app.get("/Campusync-dashboard",isAuth,async(req, res)=>{
    let labs = await Labs.find();
    let issues = await Issues.find();
    res.render('Campusyncadmin',{labs: labs,issues: issues});
})

app.post("/add-branch",isAuth, async (req, res) => {
    let labFields = ['lab1', 'lab2', 'lab3', 'lab4'];
    let labSFields = ['lab1s', 'lab2s', 'lab3s', 'lab4s'];
    let newBranchData = {
        branch: req.body.branch,
        labs: req.body.labs
    };
    labFields.forEach((field, index) => {
        if (req.body[field] !== "") {
            newBranchData[field] = req.body[field];
            if (req.body[labSFields[index]] !== undefined) {
                newBranchData[labSFields[index]] = req.body[labSFields[index]];
            }
        }
    });

    let newBranch = new Labs(newBranchData);
    await newBranch.save();

    res.redirect('/Campusync-dashboard');
});

app.post("/delete",isAuth,async(req, res) => {
    await Labs.deleteOne({ branch: req.body.delete });
    res.redirect('/Campusync-dashboard');
});

app.post("/fixed",isAuth,async(req, res) => {
    await Issues.deleteOne({ sysno: req.body.fixsysno, lab: req.body.fixlab, branch: req.body.fixbranch });
    res.redirect('/Campusync-dashboard');
})

app.post("/report",async(req,res)=>{
    let branch = req.body.branch;
    let lab = req.body.lab;
    let sysno = req.body.systems[0];
    let issue = req.body.issue;
    let newIssue = {
        branch: branch,
        lab: lab,
        sysno: sysno,
        issue: issue
    }
    let newissue = new Issues(newIssue);
    await newissue.save();
    res.json("sent")
})

app.listen(8000, () => {
    console.log("Server is running at http://localhost:8000");
})