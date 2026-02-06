const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const nichos = ['academia', 'eletronicos', 'moda'];
  console.log('🌱 Populando nichos no Neon (v6)...');

  for (const nome of nichos) {
    await prisma.niche.upsert({
      where: { name: nome },
      update: {},
      create: { name: nome },
    });
  }
  console.log('✅ Nichos prontos!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });