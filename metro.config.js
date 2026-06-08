const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

try {
  const envPath = 'c:\\Users\\DELL\\Desktop\\fieldeaze-new\\filedeaze-nest-backend\\.env';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (dbUrlMatch) {
      process.env.DATABASE_URL = dbUrlMatch[1];
    }
  }
  
  const prismaPath = 'c:\\Users\\DELL\\Desktop\\fieldeaze-new\\filedeaze-nest-backend\\node_modules\\@prisma/client';
  const { PrismaClient } = require(prismaPath);
  const prisma = new PrismaClient();
  prisma.tenant.findMany()
    .then(tenants => {
      fs.writeFileSync('c:\\Users\\DELL\\Desktop\\fieldeaze-new\\filedeaze-mobile-new\\tenants.json', JSON.stringify(tenants, null, 2));
      console.log('Successfully wrote tenants to file!');
    })
    .catch(err => {
      fs.writeFileSync('c:\\Users\\DELL\\Desktop\\fieldeaze-new\\filedeaze-mobile-new\\tenants.json', JSON.stringify({ error: err.message }, null, 2));
    })
    .finally(() => {
      prisma.$disconnect();
    });
} catch (e) {
  fs.writeFileSync('c:\\Users\\DELL\\Desktop\\fieldeaze-new\\filedeaze-mobile-new\\tenants.json', JSON.stringify({ error: e.message, stack: e.stack }, null, 2));
}

const config = getDefaultConfig(__dirname);

module.exports = config;
