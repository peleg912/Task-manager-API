const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const {userOne, userOneId, setUpDB, userTwo, taskOne} = require('./fixtures/db');


beforeEach( setUpDB);

test('should creat task for user', async()=> {
  const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'from my test'
        })
        .expect(200)

        const task = await Task.findById(response.body._id);
        expect(task).not.toBeNull();
        expect(task.completed).toEqual(false);
});


test('should load all tasks by user', async ()=> {
      const response = await request(app)
       .get('/tasks')
       .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
       .expect(200);

       const tasks = await Task.find({owner : userOne._id});
       expect(tasks.length).toEqual(2);
       expect(response.body.length).toEqual(2);

});

test('should fail delete task- not belong to user', async()=> {
    await request(app)
          .delete('/tasks/' + taskOne._id)
          .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
          .send()
          .expect(404)

          const task = await Task.findById(taskOne._id);
          expect(task).not.toBeNull();
  });