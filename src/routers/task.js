const express= require('express');
const { update } = require('../models/task');
const router = new express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

router.post('/tasks', auth, async (req, res)=>{
    const task = new Task({
        ...req.body,
        owner: req.user._id
    }); 

    try {
        await task.save();
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.get('/tasks', auth, async (req, res)=>{
    try{
    const match = {};
    const sort= {};

    if (req.query.completed){
        match.completed = req.query.completed === 'true';
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1; 
    }

    await req.user.populate({
        path: 'tasks',
        match,
        options: {
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
            sort
        }
    }).execPopulate();
    res.send(req.user.tasks);
    }catch (e){
        res.status(500).send();
    }
});

router.get('/tasks/:id', auth, async (req,res)=>{
    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, owner: req.user._id});

        if (! task){
          return  res.status(404).send();
        }

        res.send(task);
    } catch (e) {
        res.status(500).send();
    }
});

router.patch('/tasks/:id', auth, async (req, res)=> {
  const updates = Object.keys(req.body);
  const validUpdates = ['description', 'completed'];
  const isValid = updates.every((update) => validUpdates.includes(update));

  if (!isValid){
    return res.status(400).send({error: "Invalid update!"});
  }

  try{
      const task = await Task.findOne({ _id: req.params.id, owner: req.user._id});
      
      if (! task){
          return res.status(404).send({error: "Task not found."});
        }
        
        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        res.send(task);
    }catch(e){
    res.status(500).send();
  }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    try{
        const task = await Task.findOneAndDelete({ _id:req.params.id, owner: req.user._id });
        if (! task){
            return res.status(404).send({error: "Task not found."});
        }

        res.send('task '+ "'"+ task.description + "'"+ ' deleted.');

    } catch(e){
        res.status(500).send();
    }
})


module.exports= router;