import { registerRestaurant } from '../src/app/register/actions';

async function testRegister() {
  const data = {
    restaurantName: 'Test Kitchen ' + Date.now(),
    name: 'Test Owner',
    email: 'test' + Date.now() + '@example.com',
    password: 'password123'
  };

  try {
    const result = await registerRestaurant(data);
    console.log('Result:', result);
  } catch (err) {
    console.error('Registration failed:', err);
  }
}

testRegister().catch(console.error);
