import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function verifyLogin() {
  const email = 'admin@spicehub.com';
  const password = 'password123';

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  const isValid = await bcrypt.compare(password, user.hashedPassword!);
  console.log('Is valid:', isValid);
}

verifyLogin().catch(console.error);
