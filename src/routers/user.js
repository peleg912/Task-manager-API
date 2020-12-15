const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require ('multer');
const sharp = require('sharp');
const {sendWelcomeEmail} = require('../emails/account');
const {sendCancelationEmail} = require('../emails/account')


router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try{
        await user.save();
        sendWelcomeEmail(user.name, user.email);
        const token = await user.generateToken();
        res.send({user, token});
    } catch (e){
        res.status(500).send(e);
    }

});

router.post('/users/login', async (req, res) => {
    try{
    const user = await User.findByCredentials(req.body.email, req.body.password);
    const token = await user.generateToken();
    res.send({user, token});
    } catch (e){
        res.status(400).send({Error: e});
    }
});

router.post('/users/logout', auth, async (req, res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send("You are logged out.");
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res)=> {
     try {
         req.user.tokens = [];
        await req.user.save();
         res.send("You are logged out from all sessions.");
         
     } catch (error) {
         res.status(500).send();
     }
});

router.get('/users/me', auth, async (req, res)=> {
   res.send(req.user);
});


router.delete('/users/me', auth, async (req, res) => {
    try{
       await req.user.remove();
       sendCancelationEmail(req.user.name, req.user.email);
       res.send(req.user);
    } catch(e){
        res.status(500).send(e);
    }
});

router.patch('/users/me',auth, async (req, res)=>{
    const updates = Object.keys(req.body);
    const validUpdates = ['name', 'email','password', 'age'];

    const isValid = updates.every((update) => validUpdates.includes(update));

    if (!isValid){
      return res.status(400).send({error: "Update not legal!"});
    }

    try{
       updates.forEach((update) => {req.user[update] = req.body[update]});
       await req.user.save();
       res.send(req.user);
    } catch(e){
        res.status(400).send(e);
    }
});

const uploade = multer({
    // dest: 'avatars',
    limits: {
       fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (! (file.originalname.match(/\.(jpg| jpeg | png)$/))){
            return cb(new Error("Please provide jpg/jpeg/png files only."));
        }
        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, uploade.single('avatar'), async (req, res)=> {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send("Profile pic uploaded!");
}, (error, req, res, next)=> {
    res.status(400).send({Error: error.message});
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send("Profile pic removed.");
});


router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (! user || ! user.avatar){
            throw new Error('Not found!')
        }
        
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
})

module.exports= router;