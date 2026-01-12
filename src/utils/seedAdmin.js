import User from '../models/User.js';

export async function seedAdmin() {
  const adminEmail = 'admin@example.com';
  const userEmail  = 'user@example.com';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    await User.create({
      username: 'admin',
      email: adminEmail,
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin creado:', adminEmail, '/ admin123');
  } else {
    console.log('Admin ya existe:', adminEmail);
  }
  if (admin) {
  admin.password = 'admin123';
  admin.role = 'admin';
  await admin.save();
  console.log('Admin actualizado:', adminEmail, '/ admin123');
  }
 


  let normal = await User.findOne({ email: userEmail });
  if (!normal) {
    await User.create({
      username: 'user',
      email: userEmail,
      password: 'user123',
      role: 'user'
    });
    console.log('User creado:', userEmail, '/ user123');
  } else {
    console.log('User ya existe:', userEmail);
  }
   if (normal) {
  normal.password = 'user123';
  normal.role = 'user';
  await normal.save(); // aquí se hashea por el pre('save')
  console.log('User actualizado:', userEmail, '/ user123');
  }
  
}