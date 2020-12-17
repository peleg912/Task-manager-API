const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const {userOne, userOneId, setUpDB} = require('./fixtures/db');

beforeEach(setUpDB);

test('should sign up a new user', async ()=> {
   const response= await request(app).post('/users').send({
        name: 'Andrew',
        email: 'andrew@example.com',
        password: 'aaaa12345678'
    }).expect(200);

   const user = await User.findById(response.body.user._id);
   expect(user).not.toBeNull();
});

test('should login existing user', async ()=> {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();
    expect(response.body.token).toBe(user.tokens[1].token);
});

test('should not login', async ()=> {
    await request(app).post('/users/login').send({
        email: userOne.email + 'm',
        password: userOne.password + '!'
    }).expect(400);
});

test('should load user profile', async()=> {
  await request(app)
       .get('/users/me')
       .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
       .send()
       .expect(200);
});

test('should not load user profile - no auth', async()=> {
    await request(app)
         .get('/users/me')
         .send()
         .expect(401);
  });

  test('should delete acount', async()=> {
   const response =  await request(app)
         .delete('/users/me')
         .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
         .send()
         .expect(200);

         const user = await User.findById(userOne._id);
         expect(user).toBeNull();
  });

  test('should not delete acount - not auth', async()=> {
    await request(app)
         .delete('/users/me')
         .send()
         .expect(401);
  });

  test('should upload avatar image', async  ()=> {
    await request(app)
          .post('/users/me/avatar')
          .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
          .attach('avatar', 'tests/fixtures/profile-pic.jpg')
          .expect(200)

          const user = await User.findById(userOne._id);
          expect(user.avatar).toEqual(expect.any(Buffer));
  });

  test('should update valid fields', async  ()=> {
    const response = await request(app)
          .patch('/users/me')
          .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
          .send({
              name : 'Peleg Adiv'
          })
          .expect(200)

          expect(response.body.name).toBe('Peleg Adiv');
  });

  test('should not update invalid fields', async  ()=> {
    const response = await request(app)
          .patch('/users/me')
          .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
          .send({
              location : 'Tel-Aviv'
          })
          .expect(400)


  });


  