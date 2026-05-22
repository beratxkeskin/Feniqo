# 🎯 MoneyMate | Modern Personal Finance Tracker & Analysis Platform

[English](#english) | [Türkçe](#türkçe)

---

<a name="english"></a>
## 🇬🇧 English

MoneyMate is a **SaaS-quality** responsive personal finance management web application that allows users to track their incomes, expenses, budgets, and spending habits through a modern, clean, and highly aesthetic dashboard.

### 🚀 Live Demo
👉 **[Live Demo Link (Vercel) - Launching Soon!]**
*(To test the application immediately without needing a database or account creation, it is equipped with a **LocalStorage-based "Demo Mode"**. You can explore it instantly using the "Try Without Login" button on the login screen!)*

### ✨ Key Features
*   **🔒 Dual-Layer Authentication:** Secure membership and login system using email and password. Also supports a passwordless **Demo Login** for portfolio visitors.
*   **📊 Rich Analytical Dashboard:**
    *   Monthly total income, expense, net balance, and savings rate indicators.
    *   Budget limit exceeded notifications (instant alerts).
    *   Income/Expense comparison bar chart and category-based expense distribution donut chart.
    *   Quick transaction addition and summary of the last 5 transactions.
*   **💸 Advanced Income-Expense Transactions (CRUD):**
    *   Management of amount, transaction type (income/expense), category, date, description, and payment method (Cash, Credit/Debit Card, Transfer, etc.).
    *   Smart sorting of transactions from newest to oldest.
    *   Positive amount validation and SaaS-standard confirmation modal before deletion.
    *   **Smart Currency Converter:** Automatically converts foreign currency expenses (USD, EUR, GBP) to your base currency using live exchange rates.
*   **🔍 Powerful Search & Filtering:** Instant filtering by date range, income/expense type, category, payment method, amount range (min/max), and description keyword search.
*   **🎨 Dynamic Category Management:** Alongside default categories, create, edit, and delete your own custom categories choosing from a custom color palette and 20+ modern icons.
*   **🐷 Smart Budget and Limit System:**
    *   Assign category-based monthly budget limits.
    *   Smart progress bar indicating a **yellow warning** at 80% usage and a **red critical alarm** when exceeding 100%.
*   **📈 Deep Analysis Reports:** Daily spending trends and cumulative balance progression analysis over the last 6 months with custom date filters.
*   **⚙️ Advanced Settings:** Theme preference (Light, Dark, System), default currency (₺, $, €), and data reset panel.
*   **🧠 AI Finance Coach:** An AI-based rule engine that analyzes your financial status, spending habits, and savings rate to produce personalized financial advice.
*   **📥 CSV Report Export:** Download all filtered transactions with a single click as an Excel-compatible CSV.

### 🛠️ Technologies Used
*   **Frontend Framework:** React + Vite + TypeScript (Type safety and super-fast HMR)
*   **Styling & Design:** Tailwind CSS (Modern, Responsive, dynamic dark mode compatible, glassmorphism styles)
*   **Charts:** Recharts (Custom Tooltips and SVG area animated charts)
*   **Database & Auth:** Supabase (Cloud-based PostgreSQL and authentication services)
*   **Icons:** Lucide React (Clean, vector modern icons)
*   **Deployment:** Vercel (Production ready infrastructure)

---

### 📂 Project Folder Structure

```text
MoneyMate/
├── src/
│   ├── assets/           # SVG Icons and images
│   ├── components/       # Modular UI components
│   │   ├── layout/       # Sidebar, Navbar, and Layout wrapper
│   │   ├── common/       # StatCard, ConfirmModal, Spinner, EmptyState, ThemeToggle
│   │   ├── forms/        # TransactionForm, CategoryForm
│   │   ├── budgets/      # BudgetCard, BudgetProgress
│   │   └── charts/       # ChartCard containing Donut, Bar, Area charts
│   ├── context/          # Auth and Data Bridge state management
│   ├── db/               # Supabase Client, Demo seed data and TypeScript types
│   ├── pages/            # Dashboard, Transactions, Budgets, Categories, Reports, Settings, Login
│   ├── utils/            # Date/Currency formatters and savings rate calculators
│   ├── App.tsx           # Router and theme initialization manager
│   └── index.css         # Tailwind directives and global CSS variables
├── supabase_schema.sql   # Supabase SQL table schemas, triggers, and RLS rules
├── .env.example          # Example environment variables
├── tailwind.config.js    # Tailwind theme and color configuration
└── tsconfig.json         # TypeScript configuration
```

---

### 🛢️ Supabase SQL Table Structure

The PostgreSQL schema and Row Level Security (RLS) rules required for the application to run are provided in the `supabase_schema.sql` file. Summary data model structure:

**1. `profiles` (User Preferences)**
| Field Name | Data Type | Properties |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, linked to `auth.users` |
| `email` | TEXT | Required |
| `currency` | TEXT | Default: `'TRY'` |
| `theme` | TEXT | Default: `'system'` |

**2. `categories` (Expense/Income Categories)**
| Field Name | Data Type | Properties |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, Auto-generated |
| `user_id` | UUID | Nullable (If Null, it's a system default visible to everyone) |
| `name` | TEXT | Required |
| `type` | TEXT | `'income'` or `'expense'` |
| `color` | TEXT | Hex code |
| `icon` | TEXT | Lucide icon name |

**3. `transactions` (Income-Expense Transactions)**
| Field Name | Data Type | Properties |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Required, User who made the transaction |
| `amount` | NUMERIC | Required, Greater than zero |
| `type` | TEXT | `'income'` or `'expense'` |
| `category_id` | UUID | Foreign Key -> `categories.id` |
| `payment_method` | TEXT | Cash, Credit Card, Debit Card, Transfer/EFT, Other |
| `transaction_date`| DATE | Transaction date |

**4. `budgets` (Budget Limits)**
| Field Name | Data Type | Properties |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Required |
| `category_id` | UUID | Foreign Key -> `categories.id` |
| `month` | TEXT | Budget Period (Format: `'YYYY-MM'`) |
| `limit_amount` | NUMERIC | Required, Monthly Limit Amount |

---

### 🔒 Row Level Security (RLS) Rules

Fully protected RLS policies are active on all tables to prevent user data from mixing:
1.  **Profile Security:** A user can only read and update the profile row matching their own UUID.
2.  **Category Security:** Default categories (`is_default = true OR user_id IS NULL`) can be read by everyone. A user can only insert, update, and delete their own custom categories.
3.  **Transaction Security:** A user can only access their own financial transaction rows.
4.  **Budget Security:** Users can only manage their own budget limits.

---

### 💻 Local Installation

To run the project locally, follow these steps:

**1. Clone the Repository**
```bash
git clone https://github.com/beratxkeskin/MoneyMate.git
cd MoneyMate
```

**2. Install Dependencies**
```bash
npm install
```

**3. Define Environment Variables**
Create a `.env` file in the root directory and fill in the fields from `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
*(Note: To test locally without a cloud database, you can leave these fields blank. The application will automatically switch to LocalStorage Demo Mode!)*

**4. Start the Development Server**
```bash
npm run dev
```

### 🔮 Future Improvements
*   [ ] **Recurring Transactions:** Automatic addition of monthly recurring payments like rent, salary, and subscriptions.
*   [ ] **Spending Goals:** Setting savings goals (e.g., Vacation, Car) and tracking savings progress.
*   [ ] **PWA Support:** Progressive Web App support to be installable on mobile devices.
*   [ ] **True AI Integration:** Realistic AI advisor analyzing spending charts via API integration.

---

<a name="türkçe"></a>
## 🇹🇷 Türkçe

MoneyMate, kullanıcıların gelirlerini, giderlerini, bütçelerini ve harcama alışkanlıklarını modern, sade ve son derece şık bir dashboard üzerinden takip etmelerini sağlayan, **SaaS kalitesinde** responsive bir kişisel finans yönetimi web uygulamasıdır.

### 🚀 Canlı Demo (Live Demo)
👉 **[Canlı Demo Bağlantısı (Vercel) - Yakında Başlatın!]**
*(Uygulama, veritabanı veya üyelik oluşturmadan hemen test edilebilmesi için **LocalStorage tabanlı "Demo Modu"** ile donatılmıştır. Giriş ekranındaki "Giriş Yapmadan Dene" butonuyla anında keşfedebilirsiniz!)*

### ✨ Öne Çıkan Özellikler
*   **🔒 Çift Katmanlı Yetkilendirme (Auth):** E-posta ve şifre ile güvenli üyelik ve giriş sistemi. Alternatif olarak portfolyo ziyaretçileri için şifresiz **Demo Giriş** desteği.
*   **📊 Zengin Analitik Gösterge Paneli (Dashboard):**
    *   Aylık toplam gelir, gider, net bakiye ve birikim oranı göstergesi.
    *   Bütçe limit aşımı bildirimleri (Aşım durumlarında anlık uyarılar).
    *   Gelir/Gider karşılaştırma sütun grafiği ve kategori bazlı gider dağılım donut grafiği.
    *   Hızlı işlem ekleme ve son 5 işlemin hızlı özeti.
*   **💸 Gelişmiş Gelir-Gider İşlemleri (CRUD):**
    *   Miktar, işlem türü (gelir/gider), kategori, tarih, açıklama ve ödeme yöntemi yönetimi.
    *   İşlemleri tarihe göre yeniden eskiye akıllı sıralama.
    *   **Akıllı Döviz Çevirici:** Yabancı para birimleriyle (USD, EUR, GBP) yapılan işlemleri anlık kur üzerinden otomatik olarak ana para biriminize çevirerek kaydetme.
*   **🔍 Güçlü Arama ve Filtreleme:** Tarih, işlem türü, kategori, miktar ve kelime araması ile anında süzme.
*   **🎨 Dinamik Kategori Yönetimi:** Varsayılan kategorilerin yanı sıra, özel renk paleti ve modern ikonlarla kendi kategorilerini oluşturma, düzenleme ve silme.
*   **🐷 Akıllı Bütçe ve Limit Sistemi:**
    *   Kategori bazlı aylık bütçe limitleri atama.
    *   Harcamalarınız limitin **%80'ine** ulaştığında **sarı uyarı**, **%100'ü** aştığında ise **kırmızı alarm** veren akıllı progress bar.
*   **📈 Derin Analiz Raporları:** Dönemsel filtreler ile günlük harcama trendleri ve son 6 aylık kümülatif bakiye gelişim analizleri.
*   **⚙️ Gelişmiş Ayarlar:** Tema tercihi, varsayılan para birimi ve veri sıfırlama paneli.
*   **🧠 Yapay Zeka Finans Koçu (AI Coach):** Finansal durumunuzu analiz edip size özel kararlar üreten yapay zeka tabanlı kural motoru.
*   **📥 CSV Rapor Export:** Tüm işlemleri Excel uyumlu CSV olarak indirme.

### 🛠️ Kullanılan Teknolojiler
*   **Frontend Framework:** React + Vite + TypeScript (Tip güvenliği ve süper hızlı HMR)
*   **Stil ve Tasarım:** Tailwind CSS (Modern, Responsive, dynamic koyu mod uyumlu ve glassmorphism stiller)
*   **Grafikler:** Recharts (Kişiselleştirilmiş Tooltip ve SVG alan animasyonlu grafikler)
*   **Veritabanı ve Auth:** Supabase (Bulut tabanlı PostgreSQL veritabanı ve hazır kimlik doğrulama servisleri)
*   **İkon Kütüphanesi:** Lucide React (Sade, temiz ve vektörel modern ikonlar)
*   **Dağıtım (Deployment):** Vercel (Production hazır altyapı)

---

### 📂 Proje Klasör Yapısı

```text
MoneyMate/
├── src/
│   ├── assets/           # SVG İkonlar ve görseller
│   ├── components/       # Modüler UI bileşenleri
│   │   ├── layout/       # Sidebar, Navbar ve Layout sarmalı
│   │   ├── common/       # StatCard, ConfirmModal, Spinner, EmptyState, ThemeToggle
│   │   ├── forms/        # TransactionForm, CategoryForm
│   │   ├── budgets/      # BudgetCard, BudgetProgress
│   │   └── charts/       # Donut, Bar, Area grafiklerini içeren ChartCard
│   ├── context/          # Auth ve Veri Bridge state yönetimi
│   ├── db/               # Supabase İstemcisi, Demo seed verileri ve TypeScript tipleri
│   ├── pages/            # Dashboard, Transactions, Budgets, Categories, Reports, Settings, Login
│   ├── utils/            # Tarih/Para formatlama ve birikim oranı hesaplayıcıları
│   ├── App.tsx           # Router ve tema başlatma yöneticisi
│   └── index.css         # Tailwind yönergeleri ve global CSS değişkenleri
├── supabase_schema.sql   # Supabase SQL tablo şemaları, tetikleyiciler ve RLS kuralları
├── .env.example          # Örnek çevre değişkenleri
├── tailwind.config.js    # Tailwind tema ve renk yapılandırması
└── tsconfig.json         # TypeScript konfigürasyonu
```

---

### 🛢️ Supabase SQL Tablo Yapısı

Uygulamanın çalışması için gerekli PostgreSQL şeması ve Row Level Security (RLS) güvenlik kuralları `supabase_schema.sql` dosyasında sunulmuştur. Özet veri modeli yapısı:

**1. `profiles` (Kullanıcı Tercihleri)**
| Alan Adı | Veri Tipi | Özellikler |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, `auth.users` ile ilişkili |
| `email` | TEXT | Zorunlu |
| `currency` | TEXT | Varsayılan: `'TRY'` |
| `theme` | TEXT | Varsayılan: `'system'` |

**2. `categories` (Harcama/Gelir Kategorileri)**
| Alan Adı | Veri Tipi | Özellikler |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, Otomatik oluşturulur |
| `user_id` | UUID | Nullable (Null ise herkesin görebileceği sistem varsayılanıdır) |
| `name` | TEXT | Zorunlu |
| `type` | TEXT | `'income'` veya `'expense'` |
| `color` | TEXT | Renk Hex kodu |
| `icon` | TEXT | Lucide ikon adı |

**3. `transactions` (Gelir-Gider İşlemleri)**
| Alan Adı | Veri Tipi | Özellikler |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Zorunlu, İşlemi yapan kullanıcı |
| `amount` | NUMERIC | Zorunlu, Sıfırdan büyük |
| `type` | TEXT | `'income'` veya `'expense'` |
| `category_id` | UUID | Foreign Key -> `categories.id` |
| `payment_method` | TEXT | Nakit, Kredi Kartı, Banka Kartı, Havale/EFT, Diğer |
| `transaction_date`| DATE | İşlem tarihi |

**4. `budgets` (Bütçe Limitleri)**
| Alan Adı | Veri Tipi | Özellikler |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Zorunlu |
| `category_id` | UUID | Foreign Key -> `categories.id` |
| `month` | TEXT | Bütçe Dönemi (Format: `'YYYY-MM'`) |
| `limit_amount` | NUMERIC | Zorunlu, Aylık Limit Tutarı |

---

### 🔒 Row Level Security (RLS) Güvenlik Kuralları

Uygulamada tüm tablolar üzerinde verilerin birbirine karışmasını önlemek amacıyla tam korumalı RLS politikaları etkindir:
1.  **Profil Güvenliği:** Bir kullanıcı sadece kendi UUID'si ile eşleşen profil satırını okuyabilir ve güncelleyebilir.
2.  **Kategori Güvenliği:** Varsayılan kategoriler (`is_default = true OR user_id IS NULL`) herkes tarafından okunabilir. Kullanıcı sadece kendi oluşturduğu özel kategorileri ekleyebilir, güncelleyebilir ve silebilir.
3.  **İşlem (Transaction) Güvenliği:** Kullanıcı sadece kendi oluşturduğu finansal işlem satırlarına erişebilir.
4.  **Bütçe Güvenliği:** Kullanıcılar sadece kendilerine ait bütçe limitlerini yönetebilir.

---

### 💻 Yerel Kurulum Adımları

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları takip edebilirsiniz:

**1. Depoyu Klonlayın**
```bash
git clone https://github.com/beratxkeskin/MoneyMate.git
cd MoneyMate
```

**2. Bağımlılıkları Yükleyin**
```bash
npm install
```

**3. Çevre Değişkenlerini Tanımlayın**
Kök dizinde `.env` dosyası oluşturun ve `.env.example` içindeki alanları doldurun:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
*(Not: Bulut veritabanı olmadan yerel test etmek için bu alanları boş bırakabilirsiniz. Uygulama otomatik olarak LocalStorage Demo Moduna geçiş yapacaktır!)*

**4. Geliştirme Sunucusunu Başlatın**
```bash
npm run dev
```

### 🔮 Gelecek Geliştirmeler
*   [ ] **Tekrarlayan İşlemler:** Kira, maaş ve abonelik gibi ödemelerin otomatik eklenmesi.
*   [ ] **Harcama Hedefleri:** Tasarruf hedefleri belirleyip birikim gelişimini izleme.
*   [ ] **PWA Desteği:** Mobil cihazlara uygulama olarak kurulabilme desteği.
*   [ ] **Gerçek Yapay Zeka Entegrasyonu:** API entegrasyonu ile harcamaları analiz eden gerçekçi bir AI danışman.
