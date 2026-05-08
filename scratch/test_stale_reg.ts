import { registerRestaurant } from '../src/app/register/actions';
import { tenantContext } from '../src/lib/saas';

async function testRegisterWithStaleCookie() {
  const data = {
    restaurantName: 'Stale Kitchen ' + Date.now(),
    name: 'Stale Owner',
    email: 'stale' + Date.now() + '@example.com',
    password: 'password123'
  };

  // Simulate stale cookies in context
  await tenantContext.run({ 
    restaurantId: 'cmolpziss00004t64vlxmhhnt', // SpiceHub
    branchId: 'stale-branch-id',
    userType: 'OWNER'
  }, async () => {
    try {
      const result = await registerRestaurant(data);
      console.log('Result:', result);
    } catch (err) {
      console.error('Registration failed with stale context:', err);
    }
  });
}

testRegisterWithStaleCookie().catch(console.error);
