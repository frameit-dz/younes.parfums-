// بيانات العطور والولايات الافتراضية لمتجر YOUNES PARFUM

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "سوفاج إلكسير - Dior Sauvage Elixir",
    category: "men",
    categoryName: "عطور رجالية",
    price: 18500,
    oldPrice: 22000,
    volume: "100 مل",
    concentration: "Extrait de Parfum",
    badge: "الأكثر مبيعاً 🔥",
    rating: 4.9,
    reviewsCount: 38,
    inStock: true,
    img: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    description: "عطر رجالي أيقوني فائق التركيز يجمع بين انتعاش الجريب فروت مع التوابل النادرة وقلب اللافندر وقاعدة الأخشاب الغنية واللبان.",
    notes: {
      top: "القرفة، جوزة الطيب، الهيل، الجريب فروت",
      heart: "اللافندر الفرنسي الفاخر",
      base: "خشب الصندل، خشب الأرز، العنبر، نجيل الهند"
    }
  },
  {
    id: 2,
    name: "باكارات روج 540 - Baccarat Rouge 540",
    category: "oriental",
    categoryName: "عطور النيش والشرقية",
    price: 28000,
    oldPrice: 32500,
    volume: "70 مل",
    concentration: "Extrait de Parfum",
    badge: "حصري وفخم ✨",
    rating: 5.0,
    reviewsCount: 52,
    inStock: true,
    img: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    description: "تحفة عطرية من توقيع فرانسيس كوركدجيان، إشعاع زهري وعنبري وخشبي يترك أثراً سحرياً لا ينسى ويجسد قمة الترف.",
    notes: {
      top: "الياسمين، الزعفران النادر",
      heart: "خشب العنبر، العنبر الرمادي",
      base: "راتنج التنوب، خشب الأرز الأطلسي"
    }
  },
  {
    id: 3,
    name: "توم فورد عود وود - Tom Ford Oud Wood",
    category: "oriental",
    categoryName: "عطور النيش والشرقية",
    price: 24500,
    oldPrice: 27000,
    volume: "100 مل",
    concentration: "Eau de Parfum",
    badge: "أرستقراطي 👑",
    rating: 4.8,
    reviewsCount: 29,
    inStock: true,
    img: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
    description: "مزيج غامض ودافئ من أندر خامات خشب العود في معابد الشرق مع خشب الورد الصيني وحبوب التونكا والعنبر.",
    notes: {
      top: "العود النادر، خشب الورد، الحبهان",
      heart: "فلفل سيتشوان، خشب الصندل، نجيل الهند",
      base: "حبوب التونكا، الفانيليا، العنبر"
    }
  },
  {
    id: 4,
    name: "كوكو مادموزيل - Chanel Coco Mademoiselle",
    category: "women",
    categoryName: "عطور نسائية",
    price: 19500,
    oldPrice: 23000,
    volume: "100 مل",
    concentration: "Eau de Parfum Intense",
    badge: "أناقة باريسية 🌸",
    rating: 4.9,
    reviewsCount: 44,
    inStock: true,
    img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    description: "جوهر الأنوثة الحرة والآسرة. نفحات برتقالية منعشة وحيوية تكشف عن قلب مضيء من الورد التركي والياسمين وقاعدة الباتشولي.",
    notes: {
      top: "البرتقال الصقلي، البرغموت، المندرين",
      heart: "الورد التركي، الياسمين، الميموزا",
      base: "الباتشولي الإندونيسي، المسك الأبيض، الفانيليا"
    }
  },
  {
    id: 5,
    name: "كريد أفينتوس - Creed Aventus",
    category: "men",
    categoryName: "عطور رجالية",
    price: 29500,
    oldPrice: 34000,
    volume: "100 مل",
    concentration: "Eau de Parfum",
    badge: "ملك العطور الرجالية ⚡",
    rating: 5.0,
    reviewsCount: 61,
    inStock: true,
    img: "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=800&q=80",
    description: "عطر القوة والنجاح والشجاعة. تركيبة دخانية وفاكهية أسطورية من الأناناس والبرغموت الدخاني والباتشولي وطحلب البلوط.",
    notes: {
      top: "الأناناس، الكشمش الأسود، التفاح، البرغموت",
      heart: "خشب البتولا، الباتشولي، الياسمين المغربي، الورد",
      base: "المسك، طحلب البلوط، العنبر، الفانيليا"
    }
  },
  {
    id: 6,
    name: "إيف سان لوران ليبر إنتنس - YSL Libre Intense",
    category: "women",
    categoryName: "عطور نسائية",
    price: 17800,
    oldPrice: 20500,
    volume: "90 مل",
    concentration: "Eau de Parfum",
    badge: "عرض خاص 🎁",
    rating: 4.8,
    reviewsCount: 33,
    inStock: true,
    img: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
    description: "عطر المرأة القوية التي تعيش بحرية مطلقة. توازن ساحر بين زهر البرتقال المغربي وحرارة اللافندر الفرنسي والأوركيد المتوهج.",
    notes: {
      top: "الخزامى، اليوسفي، البرغموت",
      heart: "زهر البرتقال، الأوركيد، ياسمين السامباك",
      base: "فانيليا مدغشقر، حبوب التونكا، نجيل الهند، العنبر"
    }
  },
  {
    id: 7,
    name: "عود أصفهان الفاخر - Royal Oud Ispahan",
    category: "oriental",
    categoryName: "عطور النيش والشرقية",
    price: 21000,
    oldPrice: 25000,
    volume: "100 مل",
    concentration: "Extrait de Parfum",
    badge: "مخلط ملكي 🌿",
    rating: 4.9,
    reviewsCount: 27,
    inStock: true,
    img: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80",
    description: "ترنيمة شرقية تمزج أريج الورد الدمشقي العريق مع حرارة راتنج العود المدخن وأوراق الباتشولي الفاتنة لعشاق الهيبة والفخامة.",
    notes: {
      top: "الزعفران، الورد الدمشقي، اللبان",
      heart: "العود الكمبودي، الباتشولي، القستوس",
      base: "خشب الصندل، خشب الأرز، العنبر الداكن"
    }
  },
  {
    id: 8,
    name: "باقة اكتشاف يونس الفاخرة - Younes Discovery Set",
    category: "sets",
    categoryName: "مجموعات وهدايا",
    price: 14500,
    oldPrice: 18000,
    volume: "5 × 15 مل",
    concentration: "مجموعة عينات نقية",
    badge: "هدية مثالية 🎁",
    rating: 5.0,
    reviewsCount: 40,
    inStock: true,
    img: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80",
    description: "مجموعة فاخرة تحتوي على 5 عطور من أندر وأجمل إبداعات YOUNES PARFUM في زجاجات سياحية أنيقة مع علبة إهداء مخملية.",
    notes: {
      top: "تحتوي على: سوفاج إلكسير، باكارات روج، توم فورد عود، ليبر إنتنس، عود أصفهان",
      heart: "تغليف هدايا ملكي باللون الأسود والذهبي",
      base: "ثبات يتجاوز 24 ساعة لجميع العطور"
    }
  }
];

// الـ 58 ولاية جزائرية مع تسعيرة الشحن التقديرية بالدينار الجزائري (دج)
const ALGERIA_WILAYAS = [
  { code: 1, name: "01 - أدرار", fee: 900 },
  { code: 2, name: "02 - الشلف", fee: 550 },
  { code: 3, name: "03 - الأغواط", fee: 700 },
  { code: 4, name: "04 - أم البواقي", fee: 650 },
  { code: 5, name: "05 - باتنة", fee: 650 },
  { code: 6, name: "06 - بجاية", fee: 600 },
  { code: 7, name: "07 - بسكرة", fee: 750 },
  { code: 8, name: "08 - بشار", fee: 950 },
  { code: 9, name: "09 - البليدة", fee: 400 },
  { code: 10, name: "10 - البويرة", fee: 500 },
  { code: 11, name: "11 - تمنراست", fee: 1200 },
  { code: 12, name: "12 - تبسة", fee: 700 },
  { code: 13, name: "13 - تلمسان", fee: 650 },
  { code: 14, name: "14 - تيارت", fee: 650 },
  { code: 15, name: "15 - تيزي وزو", fee: 500 },
  { code: 16, name: "16 - الجزائر (العاصمة)", fee: 350 },
  { code: 17, name: "17 - الجلفة", fee: 650 },
  { code: 18, name: "18 - جيجل", fee: 650 },
  { code: 19, name: "19 - سطيف", fee: 600 },
  { code: 20, name: "20 - سعيدة", fee: 650 },
  { code: 21, name: "21 - سكيكدة", fee: 650 },
  { code: 22, name: "22 - سيدي بلعباس", fee: 650 },
  { code: 23, name: "23 - عنابة", fee: 650 },
  { code: 24, name: "24 - قالمة", fee: 650 },
  { code: 25, name: "25 - قسنطينة", fee: 600 },
  { code: 26, name: "26 - المدية", fee: 450 },
  { code: 27, name: "27 - مستغانم", fee: 600 },
  { code: 28, name: "28 - المسيلة", fee: 650 },
  { code: 29, name: "29 - معسكر", fee: 650 },
  { code: 30, name: "30 - ورقلة", fee: 850 },
  { code: 31, name: "31 - وهران", fee: 600 },
  { code: 32, name: "32 - البيض", fee: 800 },
  { code: 33, name: "33 - إليزي", fee: 1200 },
  { code: 34, name: "34 - برج بوعريريج", fee: 550 },
  { code: 35, name: "35 - بومرداس", fee: 400 },
  { code: 36, name: "36 - الطارف", fee: 700 },
  { code: 37, name: "37 - تندوف", fee: 1200 },
  { code: 38, name: "38 - تيسمسيلت", fee: 600 },
  { code: 39, name: "39 - الوادي", fee: 800 },
  { code: 40, name: "40 - خنشلة", fee: 700 },
  { code: 41, name: "41 - سوق أهراس", fee: 700 },
  { code: 42, name: "42 - تيبازة", fee: 450 },
  { code: 43, name: "43 - ميلة", fee: 600 },
  { code: 44, name: "44 - عين الدفلى", fee: 500 },
  { code: 45, name: "45 - النعامة", fee: 850 },
  { code: 46, name: "46 - عين تموشنت", fee: 650 },
  { code: 47, name: "47 - غرداية", fee: 800 },
  { code: 48, name: "48 - غليزان", fee: 600 },
  { code: 49, name: "49 - تيميمون", fee: 950 },
  { code: 50, name: "50 - برج باجي مختار", fee: 1300 },
  { code: 51, name: "51 - أولاد جلال", fee: 750 },
  { code: 52, name: "52 - بني عباس", fee: 950 },
  { code: 53, name: "53 - عين صالح", fee: 1050 },
  { code: 54, name: "54 - عين قزام", fee: 1300 },
  { code: 55, name: "55 - تقرت", fee: 850 },
  { code: 56, name: "56 - جانت", fee: 1300 },
  { code: 57, name: "57 - المغير", fee: 800 },
  { code: 58, name: "58 - المنيعة", fee: 850 }
];

// طلبات تجريبية أولية للبدء فورا في لوحة التحكم
const DEFAULT_ORDERS = [
  {
    id: 1709123401,
    orderNumber: "YP-1001",
    customerName: "سفيان بن علي",
    phone: "0550123456",
    wilaya: "16 - الجزائر (العاصمة)",
    baladiya: "باب الزوار",
    address: "حي 5 جويلية عمارة 12",
    items: [
      { id: 1, name: "سوفاج إلكسير - Dior Sauvage Elixir", price: 18500, qty: 1 }
    ],
    totalProducts: 18500,
    shippingFee: 350,
    total: 18850,
    status: "pending", // pending, confirmed, shipping, completed, cancelled
    notes: "يرجى الاتصال قبل الوصول بنصف ساعة",
    createdAt: "2026-11-08T17:30:00.000Z"
  },
  {
    id: 1709123402,
    orderNumber: "YP-1002",
    customerName: "أمينة بوقرة",
    phone: "0771987654",
    wilaya: "31 - وهران",
    baladiya: "بير الجير",
    address: "إقامة النخيل، وهران",
    items: [
      { id: 4, name: "كوكو مادموزيل - Chanel Coco Mademoiselle", price: 19500, qty: 1 }
    ],
    totalProducts: 19500,
    shippingFee: 600,
    total: 20100,
    status: "confirmed",
    notes: "تغليف هدية لو سمحتم",
    createdAt: "2026-11-08T15:10:00.000Z"
  },
  {
    id: 1709123403,
    orderNumber: "YP-1003",
    customerName: "محمد لمين قرفي",
    phone: "0662334455",
    wilaya: "25 - قسنطينة",
    baladiya: "الخروب",
    address: "قرب مسجد النور",
    items: [
      { id: 2, name: "باكارات روج 540 - Baccarat Rouge 540", price: 28000, qty: 1 },
      { id: 8, name: "باقة اكتشاف يونس الفاخرة - Younes Discovery Set", price: 14500, qty: 1 }
    ],
    totalProducts: 42500,
    shippingFee: 600,
    total: 43100,
    status: "shipping",
    notes: "",
    createdAt: "2026-11-08T11:45:00.000Z"
  }
];

// إعدادات المتجر الافتراضية
const DEFAULT_SETTINGS = {
  storeName: "YOUNES PARFUM",
  storeSubtitle: "يونس للعطور الفاخرة والروائح الأصلية",
  contactPhone: "0550000000",
  whatsappNumber: "213550000000",
  adminPin: "2999", // كلمة السر المحددة من المستخدم
  freeShippingThreshold: 50000,
  announcementText: "✨ توصيل سريع ومضمون لـ 58 ولاية جزائرية • الدفع عند الاستلام • عطور أصلية 100% ✨",
  soundEnabled: true
};
