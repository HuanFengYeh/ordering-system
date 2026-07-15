import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

// 產生桌位 QR token
function token() {
  return crypto.randomBytes(8).toString('hex');
}

// 客製選項群組樣板（demo）。options 為 [label, priceDelta] 陣列。
// required + max=1 → 單選必填；required=false + max>1 → 可複選加料。
const SPICE = {
  name: '辣度',
  required: true,
  min: 1,
  max: 1,
  options: [
    ['不辣', 0],
    ['小辣', 0],
    ['中辣', 0],
    ['大辣', 0],
  ],
};
// 加購飲料：照菜單原價、無折扣，客人可加點一杯以上
const DRINKS = {
  name: '飲料',
  required: false,
  min: 0,
  max: 4,
  options: [
    ['紅茶', 30],
    ['奶茶', 40],
    ['冬瓜茶', 30],
    ['冬瓜檸檬', 40],
  ],
};
// 加購超值加點：照菜單原價、無折扣
const SNACKS = {
  name: '加點',
  required: false,
  min: 0,
  max: 5,
  options: [
    ['炸雞排', 90],
    ['雞塊', 70],
    ['起司薯球', 80],
    ['手工甜不辣', 80],
    ['蒜香法國麵包+玉米濃湯', 75],
  ],
};
// 火鍋料：四種肉都附火鍋料，客人可選擇維持、換成蔬菜、或不要。
// ⚠️ 選項與加價為預設值，實際請依店家調整（可在後台改）
const HOTPOT = {
  name: '火鍋料',
  required: false,
  min: 0,
  max: 1,
  options: [
    ['換蔬菜', 0],
    ['換肉', 0],
    ['不要火鍋料', 0],
  ],
};
// 依「分類名稱」套用客製群組到該分類的所有品項。
// 飲料/加點＝原價加購，套用到所有主餐（鍋/麵/飯）。
// ⚠️ 辣度為預設示範，實際辣度選項請依店家調整（可在後台改）。
const CATEGORY_MODIFIERS = {
  招牌湯麵: [DRINKS, SNACKS],
  暖胃鍋品: [SPICE, HOTPOT, DRINKS, SNACKS],
  經典炒麵: [SPICE, DRINKS, SNACKS],
  義式風味: [DRINKS, SNACKS],
  經典燴飯: [DRINKS, SNACKS],
  限量蛋包麵: [DRINKS, SNACKS],
  熱銷蛋包飯: [DRINKS, SNACKS],
};

// 麵體讓客人單獨選：意麵/雞絲/河粉/冬粉同價，讚岐烏龍加價
const noodles = (base, tsuru) => [
  ['意麵', base],
  ['雞絲', base],
  ['河粉', base],
  ['冬粉', base],
  ['讚岐烏龍', tsuru],
];

// 菜單資料。每個 item 的 variants 是 [label, price] 陣列。
// 單一價格的菜色 label 用空字串 ''。
const MENU = [
  {
    name: '招牌湯麵',
    note: '麵體可單獨選；讚岐烏龍需加價',
    items: [
      { name: '炸雞排湯麵', variants: noodles(140, 155) },
      { name: '味噌湯麵', variants: noodles(120, 135) },
      { name: '泡菜湯麵', variants: noodles(135, 150) },
      { name: '醬油湯麵', variants: noodles(120, 135) },
      { name: '原味湯麵', variants: noodles(115, 130) },
    ],
  },
  {
    name: '暖胃鍋品',
    note: '豬肉／鯛魚／牛肉／雞排四種肉任選；火鍋料可另選換蔬菜、換肉或不要',
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
  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
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
    const mods = CATEGORY_MODIFIERS[cat.name] ?? [];
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
          modifierGroups: {
            create: mods.map((g, gi) => ({
              name: g.name,
              required: g.required,
              minSelect: g.min,
              maxSelect: g.max,
              sort: gi,
              options: {
                create: g.options.map(([label, priceDelta], oi) => ({
                  label,
                  priceDelta,
                  sort: oi,
                })),
              },
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
