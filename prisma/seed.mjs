import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

// 產生桌位 QR token
function token() {
  return crypto.randomBytes(8).toString('hex');
}

// 菜單資料。每個 item 的 variants 是 [label, price] 陣列。
// 單一價格的菜色 label 用空字串 ''。
const MENU = [
  {
    name: '招牌湯麵',
    note: '意麵、雞絲、河粉、冬粉四款麵體同價；讚岐烏龍需加價',
    items: [
      { name: '炸雞排湯麵', variants: [['意麵/雞絲/河粉/冬粉', 140], ['讚岐烏龍', 155]] },
      { name: '味噌湯麵', variants: [['意麵/雞絲/河粉/冬粉', 120], ['讚岐烏龍', 135]] },
      { name: '泡菜湯麵', variants: [['意麵/雞絲/河粉/冬粉', 135], ['讚岐烏龍', 150]] },
      { name: '醬油湯麵', variants: [['意麵/雞絲/河粉/冬粉', 120], ['讚岐烏龍', 135]] },
      { name: '原味湯麵', variants: [['意麵/雞絲/河粉/冬粉', 115], ['讚岐烏龍', 130]] },
    ],
  },
  {
    name: '暖胃鍋品',
    note: '「雞排」品項為不加火鍋料、直接換肉',
    items: [
      { name: '壽喜燒火鍋', variants: [['豬肉', 190], ['鯛魚', 200], ['牛肉', 210], ['雞排', 235]] },
      { name: '原味小火鍋', variants: [['豬肉', 190], ['鯛魚', 200], ['牛肉', 210], ['雞排', 235]] },
      { name: '味噌小火鍋', variants: [['豬肉', 190], ['鯛魚', 200], ['牛肉', 210], ['雞排', 235]] },
      { name: '起司小火鍋', variants: [['豬肉', 220], ['鯛魚', 230], ['牛肉', 240], ['雞排', 265]] },
      { name: '泡菜小火鍋', variants: [['豬肉', 220], ['鯛魚', 230], ['牛肉', 240], ['雞排', 265]] },
      { name: '椒麻小火鍋', variants: [['豬肉', 220], ['鯛魚', 230], ['牛肉', 240], ['雞排', 265]] },
      { name: '秘製咖哩火鍋', description: '含牛', variants: [['豬肉', 260], ['鯛魚', 270], ['牛肉', 280], ['雞排', 300]] },
    ],
  },
  {
    name: '經典炒麵',
    items: [
      { name: '招牌炒麵', variants: [['意麵', 120], ['意麵+科學麵', 135], ['讚岐烏龍', 140]] },
      { name: '沙茶炒麵', variants: [['意麵', 125], ['意麵+科學麵', 140], ['讚岐烏龍', 145]] },
      { name: '咖哩起司炒麵', variants: [['意麵', 155], ['意麵+科學麵', 170], ['讚岐烏龍', 175]] },
    ],
  },
  {
    name: '義式風味',
    note: '可選義大利麵或飯，同價',
    items: [
      { name: '肉醬香腸起司', variants: [['義大利麵', 160], ['飯', 160]] },
      { name: '青醬蛤蜊起司', variants: [['義大利麵', 190], ['飯', 190]] },
      { name: '黃醬奶油起司', variants: [['義大利麵', 190], ['飯', 190]] },
      { name: '白醬培根起司', variants: [['義大利麵', 190], ['飯', 190]] },
      { name: '牛肉咖哩', variants: [['義大利麵', 225], ['飯', 225]] },
      { name: '蒜香牛肉', variants: [['義大利麵', 200], ['飯', 200]] },
      { name: '松露白醬', variants: [['義大利麵', 210], ['飯', 210]] },
      { name: '白醬蛋黃', variants: [['義大利麵', 195], ['飯', 195]] },
    ],
  },
  {
    name: '經典燴飯',
    items: [
      { name: '雞排燴飯', variants: [['', 150]] },
      { name: '豬肉燴飯', variants: [['', 130]] },
      { name: '牛肉燴飯', variants: [['', 140]] },
      { name: '咖哩雞塊燴飯', variants: [['', 150]] },
    ],
  },
  {
    name: '限量蛋包麵',
    note: '附薯條，限搭配通心麵',
    items: [
      { name: '奶油白醬蛋包麵', variants: [['', 210]] },
      { name: '義大利肉醬蛋包麵', variants: [['', 190]] },
      { name: '青醬蛋包麵', variants: [['', 210]] },
      { name: '起司奶油黃醬蛋包麵', variants: [['', 210]] },
      { name: '秘製咖哩醬蛋包麵', description: '含牛', variants: [['', 220]] },
    ],
  },
  {
    name: '熱銷蛋包飯',
    note: '附薯條',
    items: [
      { name: '茄汁蛋包飯', variants: [['', 130]] },
      { name: '咖哩蛋包飯', variants: [['', 140]] },
      { name: '茄汁三重起司蛋包飯', variants: [['', 170]] },
      { name: '咖哩三重起司蛋包飯', variants: [['', 180]] },
      { name: '香酥黃芥末醬蛋包飯', variants: [['', 180]] },
      { name: '咖哩原牛蛋包飯', description: '含牛', variants: [['', 190]] },
      { name: '奶油白醬蛋包飯', variants: [['', 190]] },
      { name: '沙茶豬肉蛋包飯', variants: [['', 175]] },
      { name: '義大利肉醬蛋包飯', variants: [['', 175]] },
      { name: '青醬蛤蜊蛋包飯', variants: [['', 195]] },
      { name: '松露白醬蛋包飯', variants: [['', 195]] },
      { name: '起司奶油黃醬蛋包飯', variants: [['', 195]] },
      { name: '秘製咖哩醬蛋包飯', description: '含牛', variants: [['', 230]] },
    ],
  },
  {
    name: '飲品湯品',
    items: [
      { name: '紅茶', variants: [['', 30]] },
      { name: '奶茶', variants: [['', 40]] },
      { name: '冬瓜茶', variants: [['', 30]] },
      { name: '冬瓜檸檬', variants: [['', 40]] },
      { name: '濃湯', variants: [['', 40]] },
    ],
  },
  {
    name: '超值加點',
    items: [
      { name: '炸雞排', variants: [['', 90]] },
      { name: '雞塊', variants: [['', 70]] },
      { name: '起司薯球', variants: [['', 80]] },
      { name: '手工甜不辣', variants: [['', 80]] },
      { name: '蒜香法國麵包+玉米濃湯', description: '套餐加購', variants: [['', 75]] },
    ],
  },
];

async function main() {
  // 清空（保持可重複執行）
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();

  // 桌位：建立 8 桌
  for (let n = 1; n <= 8; n++) {
    await prisma.table.create({ data: { number: n, token: token() } });
  }

  // 菜單
  let catSort = 0;
  for (const cat of MENU) {
    const category = await prisma.category.create({
      data: { name: cat.name, note: cat.note ?? null, sort: catSort++ },
    });
    let itemSort = 0;
    for (const item of cat.items) {
      await prisma.menuItem.create({
        data: {
          name: item.name,
          description: item.description ?? null,
          categoryId: category.id,
          sort: itemSort++,
          variants: {
            create: item.variants.map(([label, price], i) => ({
              label,
              price,
              sort: i,
            })),
          },
        },
      });
    }
  }

  const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
  console.log('種子資料建立完成。桌位與 QR token：');
  for (const t of tables) {
    console.log(`  桌 ${t.number}: /order/${t.token}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
