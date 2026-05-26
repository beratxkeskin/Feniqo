# 🎯 feniqo | Modern Personal Finance Tracker, Workspace Split & Wealth Analysis Platform


[English](#english) | [Türkçe](#türkçe)

---

<a name="english"></a>
## 🇬🇧 English

**feniqo** is a **SaaS-quality** responsive personal finance management and collaborative budgeting web application. It allows users to track their incomes, expenses, budgets, and savings goals in a peaceful, balanced digital environment. Designed with state-of-the-art web aesthetics (glassmorphism, interactive SVG charts, fluid micro-animations, and responsive dark mode), feniqo is built for individuals, couples, and shared households to manage wealth together.

### 🚀 Live Demo
👉 **[Live Demo Link (Vercel) - Launching Soon!]**
*(To test the application immediately without needing a database or account creation, it is equipped with a **LocalStorage-based "Demo Mode"**. You can explore it instantly using the "Try Without Login" button on the login screen, pre-seeded with mock collaborative workspaces, transaction records, and banking balances!)*

---

### ✨ Key Features

*   **👥 Collaborative Workspaces & Joint Budgeting (Workspace Split):**
    *   Create dedicated shared workspaces (e.g., Household, Vacation, Partners) to manage mutual budgets.
    *   Automatically calculates split balances and shows who owes what.
    *   Simulates partner activity and shows live transactions of workspace members (e.g., `sifa@feniqo.com`).
*   **🏦 Open Banking Simulation & Live Sync:**
    *   Connect virtual bank accounts and credit cards securely using simulated OAuth consent flows (`OAuthConsentModal`).
    *   Track account balances and credit card limits in real-time.
    *   Receive simulated live bank notifications for new transactions and sync them to your dashboard instantly.
*   **💼 Net Worth & Asset Portfolio Tracking:**
    *   Track diverse assets including Cash, Real Estate, Vehicles, Precious Metals, Cryptocurrencies, and Stocks.
    *   **Real-time Live Sync (Metals & Crypto):** Automatically fetch and sync live market prices for gold, silver, other metals, and major cryptocurrencies (BTC, ETH, etc.) without page reloads.
    *   **High-Precision Manual Stocks:** Manage stock portfolios manually for pristine performance and bypass CORS proxy limits, allowing full manual control.
    *   Multi-currency support and total net worth aggregation in your default currency.
*   **📱 Progressive Web App (PWA) & Offline-First:**
    *   Fully installable on iOS (Safari), Android, and Desktop as a native application.
    *   Built-in **Safari/iOS PWA Installation Wizard** (`InstallationGuideModal`) to guide Apple users step-by-step.
    *   Optimized local state caches and state preservation to provide a fast offline-first experience.
*   **🎨 Premium Brand Identity & Visual Assets:**
    *   Rebranded under the high-end **feniqo** identity (representing rebirth, financial transformation, and upward growth).
    *   Modern abstract visual designs including geometric shard compositions, monogram marks, and premium neon branding options (saved in the `feniqo-branding/` workspace folder).
*   **🔒 Dual-Layer Authentication:** Secure membership and login system using Supabase email and password. Also supports a passwordless, instant **Demo Login** for quick portfolio evaluation.
*   **📊 Rich Analytical Dashboard:**
    *   Monthly total income, expense, net balance, and savings rate indicators.
    *   Interactive Money Score circular gauge (`MoneyScoreGauge`) evaluating overall financial wellness.
    *   Dynamic bütçe limit exceeded notifications (instant UI banners and toasts).
    *   Income/Expense comparison bar charts and category-based donut charts powered by Recharts.
*   **💸 Advanced Income-Expense Transactions (CRUD) & Converter:**
    *   Manage amount, transaction type (income/expense), category, date, description, and payment method (Cash, Credit Card, Debit Card, Transfer, etc.).
    *   **Smart Currency Converter:** Automatically converts foreign currency expenses (USD, EUR, GBP) to your base portfolio currency (e.g., TRY) using live exchange rates.
    *   Positive amount validation, clean empty states, and standard confirmation modals.
*   **📥 Smart CSV Statement Import Wizard:**
    *   Import bank statements easily with a multi-step CSV parsing wizard (`ImportWizardModal`).
    *   **Auto Column Mapping & Preview:** Automatically maps columns for Transaction Date, Amount, Description, and Category with a live preview before committing.
    *   **100% Client-Side Privacy:** All statement parsing happens locally inside your browser memory; sensitive files and IBANs are never sent to a server.
*   **🧾 AI OCR Invoice Scanner & Description Cleanser:**
    *   Simulate receipt/invoice scanning to automatically populate transaction amounts and categories.
    *   **Smart Description Cleanser (`descriptionCleanser`):** Strips raw POS codes, merchant IDs, dates, and useless characters to present beautifully formatted transaction logs.
*   **🔍 Powerful Search & Filtering:** Instant sorting and filtering by date range, income/expense type, category, payment method, amount range (min/max), and free-text keyword search.
*   **🎨 Dynamic Category Management:** Alongside system defaults, create, edit, and delete custom categories choosing from a tailored color palette and 20+ modern Lucide icons.
*   **🐷 Smart Budget and Limit System:**
    *   Assign category-based monthly budget limits.
    *   Progress bars showing **yellow warning** at 80% usage and **red critical alarm** when exceeding 100%.
*   **📈 Deep Analysis Reports:** Cumulative balance progression over the last 6 months, categories analysis, and daily spending trends with date range selectors.
*   **⚙️ Advanced Settings & Portability:**
    *   Custom theme preference (Light, Dark, System-matching) and color scheme options.
    *   Data portability: Export transaction logs as Excel-compatible CSVs. Download or upload complete system backups in JSON format to guarantee full data ownership.

---

### 🛠️ Technologies Used
*   **Frontend Framework:** React + Vite + TypeScript (100% type-safe, super-fast Hot Module Replacement)
*   **Styling & Design:** Tailwind CSS & Vanilla CSS (HSL-tailored colors, custom glassmorphism, responsive components)
*   **Charts:** Recharts (Custom SVG containers, animated lines/bars, custom tooltip overlays)
*   **Database & Auth:** Supabase (Cloud-based PostgreSQL engine and secure JWT authentication)
*   **Icons:** Lucide React (Sleek vector icon set)
*   **Testing Suite:** Vitest + React Testing Library (Fast assertion runners, mock context testing)
*   **Deployment:** Vercel (Production-ready infrastructure)

---

### 📂 Project Folder Structure

```text
feniqo/
├── src/
│   ├── assets/           # SVG Icons and brand images
│   ├── components/       # Modular UI components
│   │   ├── layout/       # Sidebar, Navbar, and WorkspaceSelector
│   │   ├── common/       # StatCard, ConfirmModal, Spinner, EmptyState, InstallationGuideModal
│   │   ├── forms/        # TransactionForm, CategoryForm, DebtForm
│   │   ├── budgets/      # BudgetCard, BudgetProgress
│   │   ├── banking/      # OAuthConsentModal, OpenBankingPanel
│   │   ├── dashboard/    # MoneyScoreGauge and quick stats
│   │   └── charts/       # ChartCard containing Donut, Bar, Area charts
│   ├── context/          # State management (AuthContext, DataContext, OpenBankingContext)
│   ├── db/               # Supabase Client, Demo seed data and TypeScript types
│   ├── pages/            # View Pages (Dashboard, Workspace, Reports, Settings, Auth, etc.)
│   ├── utils/            # Timezone-proof Date/Currency formatters, scoreCalculators, descriptionCleanser
│   ├── App.tsx           # Router and theme initialization manager
│   └── index.css         # Custom CSS tokens and global CSS variables
├── supabase_schema.sql   # Supabase SQL table schemas, triggers, and RLS rules
├── .env.example          # Example environment variables
├── tailwind.config.js    # Tailwind theme, color variables and layout configuration
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
git clone https://github.com/beratxkeskin/feniqo.git
cd feniqo
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

---

### 🧪 Testing & Quality Control
The project includes a robust testing infrastructure using **Vitest** and **React Testing Library**. Timezone-independent unit tests are written for critical calculation logic, financial formulas, tags, description cleansing, and personal scores to ensure financial accuracy.

To run the tests:
```bash
# Run all tests in the terminal
npm run test

# Run tests with the Vitest UI dashboard
npm run test:ui

# Verify static typing and code format rules
npm run lint
```

---

### 🔮 Future Roadmap
*   [ ] **Automated Recurring Transactions:** Automatically add monthly recurring payments like rent, salary, and active subscriptions.
*   [ ] **Multi-user Real-time WebSockets:** Implement live PostgreSQL channels in Supabase to sync joint workspace activity instantly across devices without page reloads.
*   [ ] **Real-world AI API Integration:** Connect to OpenAI/Gemini models via secure Edge functions to analyze charts and provide rich, realistic financial feedback.

---

<a name="türkçe"></a>
## 🇹🇷 Türkçe

**feniqo**, kullanıcıların gelirlerini, giderlerini, bütçelerini ve harcama alışkanlıklarını modern, sade ve huzurlu bir dijital ortamda yönetmelerini sağlayan, **SaaS kalitesinde** responsive bir kişisel finans ve ortak bütçe takip platformudur. Üst düzey web estetiği (cam morfolojisi - glassmorphism, SVG grafikler, akıcı mikro animasyonlar ve duyarlı koyu mod) ile donatılan feniqo; bireyler, çiftler ve ortak bütçe yöneten haneler için özel olarak tasarlanmıştır.

### 🚀 Canlı Demo (Live Demo)
👉 **[Canlı Demo Bağlantısı (Vercel) - Yakında!]**
*(Uygulamanın, veritabanı veya üyelik oluşturmadan anında test edilebilmesi için **LocalStorage tabanlı "Demo Modu"** mevcuttur. Giriş ekranındaki "Giriş Yapmadan Dene" butonuyla; sahte ortak çalışma alanlarını, işlem geçmişlerini ve banka bakiyelerini saniyeler içinde keşfedebilirsiniz!)*

---

### ✨ Öne Çıkan Özellikler

*   **👥 Ortak Çalışma Alanları ve Bölüşüm (Workspace Split):**
    *   Ev arkadaşınız, eşiniz veya iş ortaklarınızla harcamaları yönetmek için ortak bütçe alanları oluşturun.
    *   Borç dağılımlarını, kimin kime ne kadar borçlu olduğunu otomatik hesaplayın.
    *   Ortak bütçe üyelerinin (örneğin `sifa@feniqo.com`) harcama hareketlerini ve aktivitelerini simüle edin.
*   **🏦 Açık Bankacılık (Open Banking) Simülasyonu ve Canlı Senkronizasyon:**
    *   Güvenli banka bağlantılarını OAuth onay ekranları (`OAuthConsentModal`) ile simüle edin.
    *   Hesap bakiyelerinizi ve kredi kartı limitlerinizi gerçek zamanlı olarak izleyin.
    *   Yeni işlemler için simüle edilmiş canlı banka bildirimleri alın ve bunları anında gösterge panelinize senkronize edin.
*   **💼 Varlık Portföyü ve Net Değer Takibi (Net Worth):**
    *   Nakit, Gayrimenkul, Araç, Değerli Madenler, Kripto Paralar ve Hisse Senetleri gibi farklı varlık türlerini tek ekrandan yönetin.
    *   **Canlı Fiyat Entegrasyonu (Maden & Kripto):** Altın (Gram, Çeyrek vb.), Gümüş gibi değerli madenleri ve popüler kripto paraları (BTC, ETH) canlı piyasa verileriyle anlık ve otomatik senkronize edin.
    *   **Yüksek Kararlılıklı Hisse Senedi Yönetimi:** CORS engellemelerine ve API sınırlarına takılmadan, hisse senedi portföylerini elle hassas bir şekilde yönetebilme.
    *   Tüm varlıklarınızı tek bir ana para birimi (TRY vb.) üzerinden kümülatif net değer olarak izleme.
*   **📱 PWA Desteği ve Çevrimdışı (Offline-First):**
    *   iOS (Safari), Android ve Masaüstü cihazlara yerel bir mobil uygulama gibi kurulabilme.
    *   Apple kullanıcılarına adım adım rehberlik eden gelişmiş **Safari/iOS PWA Kurulum Sihirbazı** (`InstallationGuideModal`).
    *   Yerel önbellekler sayesinde internet bağlantısı koptuğunda dahi kesintisiz, hızlı ve çevrimdışı çalışma yeteneği.
*   **🎨 Premium Kurumsal Kimlik & Görsel Varlıklar:**
    *   Küllerinden yeniden doğuşu ve yükselişi simgeleyen üst düzey **feniqo** kimliği altında tamamen yenilenen marka algısı.
    *   Masaüstünüzde yer alan `feniqo-branding/` klasöründe barındırılan geometrik kırılımlar, monogram logolar ve premium neon renk paletleriyle donatılmış soyut marka sembolleri.
*   **🔒 Çift Katmanlı Yetkilendirme (Auth):** Supabase e-posta ve şifre altyapısı ile güvenli üyelik ve giriş sistemi. Portfolyo ziyaretçileri için şifresiz, tek tıkla **Demo Giriş** desteği.
*   **📊 Zengin Analitik Gösterge Paneli (Dashboard):**
    *   Aylık toplam gelir, gider, net bakiye ve birikim oranı göstergeleri.
    *   Genel finansal sağlığınızı değerlendiren animasyonlu finansal skor göstergesi (`MoneyScoreGauge`).
    *   Bütçe limit aşımı durumlarında anlık görsel bannerlar ve bildirim pencereleri.
    *   Recharts ile oluşturulmuş hareketli gelir/gider karşılaştırma sütun grafikleri ve kategori donut grafikleri.
*   **💸 Gelişmiş Gelir-Gider İşlemleri (CRUD) ve Döviz Çevirici:**
    *   Miktar, işlem türü, kategori, tarih, açıklama ve ödeme yöntemi (Nakit, Kredi Kartı, Banka Kartı, Havale vb.) yönetimi.
    *   **Akıllı Döviz Çevirici:** Yabancı para birimleriyle (USD, EUR, GBP) yapılan işlemleri canlı kurlar üzerinden otomatik olarak ana para biriminize (örn. TRY) dönüştürerek kaydeder.
    *   Sıfırdan büyük miktar doğrulamaları, temiz boş durum ekranları ve silme onay modalları.
*   **📥 Akıllı CSV Banka Ekstresi İçe Aktarım Sihirbazı:**
    *   Banka ekstrelerinizi sisteme saniyeler içinde yüklemek için çok adımlı, esnek CSV ayrıştırma sihirbazı (`ImportWizardModal`).
    *   **Otomatik Sütun Eşleştirme & Önizleme:** İşlem tarihi, miktar, açıklama ve kategori sütunlarını akıllıca eşleştirir; verileri kaydetmeden önce canlı tablo önizlemesi sunar.
    *   **100% Yerel Gizlilik:** Tüm ekstre okuma işlemleri tarayıcı hafızasında yerel olarak gerçekleşir; hassas verileriniz, adınız veya IBAN numaranız asla harici bir sunucuya gönderilmez.
*   **🧾 AI OCR Fatura Tarayıcı ve Açıklama Sadeleştirici:**
    *   Fatura fotoğraflarından miktarları ve kategorileri okuyan simülasyon.
    *   **Akıllı Açıklama Sadeleştirici (`descriptionCleanser`):** Karmaşık POS kodlarını, üye işyeri ID'lerini, tarihleri ve gereksiz karakterleri temizleyerek işlem açıklamalarını kusursuz hale getirir.
*   **🔍 Güçlü Arama ve Filtreleme:** Tarih aralığı, işlem türü, kategori, ödeme yöntemi, miktar aralığı (min/max) ve serbest metin kelime araması ile anında süzme.
*   **🎨 Dinamik Kategori Yönetimi:** Varsayılan kategorilerin yanı sıra, özel renk paleti ve 20'den fazla Lucide ikonu ile kendi kategorilerinizi oluşturma, düzenleme ve silme.
*   **🐷 Akıllı Bütçe ve Limit Sistemi:**
    *   Kategori bazlı aylık bütçe limitleri atama.
    *   Harcamalarınız bütçenin **%80**'ine ulaştığında **sarı uyarı**, **%100**'ü aştığında ise **kırmızı alarm** veren akıllı göstergeler.
*   **📈 Derin Raporlama ve Analizler:** Kategori analizleri, tarih aralığı filtreli günlük harcama trendleri ve son 6 aylık kümülatif bakiye gelişim grafikleri.
*   **⚙️ Gelişmiş Ayarlar ve Veri Taşınabilirliği:**
    *   Karanlık mod (Dark mode), Aydınlık mod veya Sistem teması tercihi ile özel renk temaları.
    *   Veri Özgürlüğü: Tüm işlemlerinizi Excel uyumlu CSV dosyası olarak dışa aktarın. Sistem verilerinizi JSON formatında yedekleyin veya geri yükleyin.

---

### 🛠️ Kullanılan Teknolojiler
*   **Frontend Framework:** React + Vite + TypeScript (Tip güvenliği ve süper hızlı Hot Module Replacement)
*   **Tasarım Sistemi:** Vanilla CSS & Tailwind CSS (Özel HSL tema sistemi, glassmorphism, responsive esnek düzenler)
*   **Grafikler:** Recharts (SVG animasyonlu dönemsel grafikler ve kişiselleştirilmiş tooltip pencereleri)
*   **Veritabanı ve Auth:** Supabase (Bulut tabanlı PostgreSQL, Row-Level Security, güvenli kimlik doğrulama)
*   **İkon Seti:** Lucide React (Sade, temiz ve vektörel modern ikonlar)
*   **Test Altyapısı:** Vitest + React Testing Library (Zaman diliminden bağımsız birim test altyapısı)
*   **Deployment:** Vercel (Production-ready bulut dağıtım altyapısı)

---

### 📂 Proje Klasör Yapısı

```text
feniqo/
├── src/
│   ├── assets/           # SVG İkonlar ve marka görselleri
│   ├── components/       # Modüler UI bileşenleri
│   │   ├── layout/       # Sol menü, üst menü ve ortak bütçe seçici
│   │   ├── common/       # Durum kartları, modallar, kurulum sihirbazları
│   │   ├── forms/        # İşlem ekleme formu, kategori tasarımı, borç kapama
│   │   ├── budgets/      # Bütçe ilerleme barları ve dairesel göstergeler
│   │   ├── banking/      # Banka OAuth onay ekranları ve senkronizasyon paneli
│   │   ├── dashboard/    # Finansal sağlık göstergesi ve hızlı durum kartları
│   │   └── charts/       # Donut, Bar, Area grafiklerini içeren ChartCard
│   ├── context/          # Global State Yönetimi (Giriş/Çıkış, Bankacılık ve Veri akışları)
│   ├── db/               # Supabase istemcisi, sahte veri seed şablonları ve tipler
│   ├── pages/            # Sayfa görünümleri (Gösterge Paneli, Ortak Alan, Raporlar, Ayarlar)
│   ├── utils/            # Tarih formatlayıcıları, skor hesaplayıcılar ve fatura sadeleştiriciler
│   ├── App.tsx           # Sayfa yönlendirici ve ana düzen yöneticisi
│   └── index.css         # Custom CSS tokenları ve global CSS değişkenleri
├── supabase_schema.sql   # PostgreSQL tabloları, tetikleyiciler ve Row Level Security kuralları
├── .env.example          # Örnek çevre değişkenleri konfigürasyonu
├── tailwind.config.js    # Tasarım değişkenleri, renk temaları ve gölge yapılandırmaları
└── tsconfig.json         # TypeScript derleme ayarları
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
git clone https://github.com/beratxkeskin/feniqo.git
cd feniqo
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

---

### 🧪 Testler ve Kalite Standartları
Proje, finansal hesaplamaların ve veri formatlarının doğruluğunu garanti altına almak için **Vitest** ve **React Testing Library** kullanılarak yazılmış kapsamlı birim (unit) test altyapısına sahiptir. Zaman diliminden bağımsız olarak kurgulanan bu testler, işe alım süreçlerindeki kod kalitesi standartlarına tam uyum sağlamaktadır.

Testleri çalıştırmak için:
```bash
# Tüm testleri terminalde çalıştırır
npm run test

# Testleri görsel bir arayüz (UI dashboard) üzerinden yönetmek için
npm run test:ui

# Statik kod analizi ve biçimlendirme denetimini çalıştırır
npm run lint
```

---

### 🔮 Gelecek Yol Haritası
*   [ ] **Otomatik Düzenli Ödemeler:** Kira, maaş, abonelik gibi harcama/gelir kalemlerinin her ay otomatik olarak eklenmesi.
*   [ ] **Gerçek Zamanlı WebSocket Kanalları:** Supabase'in anlık PostgreSQL dinleme özelliğini entegre ederek, ortak çalışma alanlarındaki harcamaların sayfayı yenilemeye gerek kalmadan diğer cihazlarda anında görünmesi.
*   [ ] **Gelişmiş AI Entegrasyonu:** Edge Functions üzerinden güvenli API entegrasyonu sağlayarak OpenAI/Gemini modelleriyle doğrudan harcama analizleri ve detaylı finansal tavsiyeler üreten gerçekçi AI danışman.
