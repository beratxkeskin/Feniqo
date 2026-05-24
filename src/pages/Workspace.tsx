import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Plus, 
  Coins, 
  Copy, 
  Check, 
  LogOut, 
  Wallet, 
  Shuffle, 
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatters';
import { WorkspaceSelector } from '../components/layout/WorkspaceSelector';

export const Workspace: React.FC = () => {
  const { user, isDemo } = useAuth();
  const { 
    workspaces, 
    activeWorkspace, 
    workspaceMembers, 
    createWorkspace, 
    joinWorkspace, 
    leaveWorkspace, 
    setActiveWorkspace,
    transactions,
    addTransaction,
    categories
  } = useData();

  const isEn = user?.lang === 'en';
  
  // Local state for forms
  const [wsName, setWsName] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!user) return null;

  // Language dictionary
  const t = {
    title: isEn ? 'Shared Budget & Split' : 'Ortak Bütçe & Bölüşüm',
    subtitle: isEn 
      ? 'Collaborate with your family/partner in a shared workspace and manage expenses together.' 
      : 'Eşinizle veya ailenizle ortak bir bütçe havuzunda çalışın, harcamaları bölüşün.',
    personalSpace: isEn ? 'Personal Workspace' : 'Kişisel Bütçe Alanı',
    personalSpaceDesc: isEn 
      ? 'Currently viewing your private financial data. No one else has access.' 
      : 'Şu anda sadece size özel, gizli finansal verilerinizi görüntülüyorsunuz.',
    activeWorkspaceLbl: isEn ? 'Active Shared Workspace' : 'Aktif Ortak Bütçe',
    switchToPersonal: isEn ? 'Switch to Personal Workspace' : 'Kişisel Bütçeye Geç',
    inviteCodeLbl: isEn ? 'Invite Code' : 'Ortak Bütçe Davet Kodu',
    inviteCodeDesc: isEn 
      ? 'Share this code with your partner/family so they can join this budget pool.' 
      : 'Bu kodu eşiniz veya aile bireylerinizle paylaşarak ortak bütçeye katılmalarını sağlayın.',
    copyCode: isEn ? 'Copy Code' : 'Kodu Kopyala',
    codeCopied: isEn ? 'Copied!' : 'Kopyalandı!',
    leaveWorkspaceBtn: isEn ? 'Leave Shared Workspace' : 'Ortak Bütçeden Ayrıl',
    createTitle: isEn ? 'Create Shared Workspace' : 'Yeni Ortak Bütçe Havuzu Kur',
    createPlaceholder: isEn ? 'e.g. Our Home Budget' : 'Örn: Ev Bütçemiz 🏡',
    createBtn: isEn ? 'Create Workspace' : 'Yeni Ortak Havuz Oluştur',
    joinTitle: isEn ? 'Join a Shared Workspace' : 'Bir Ortak Bütçeye Katıl',
    joinPlaceholder: isEn ? 'Enter 8-digit invite code' : '8 haneli davet kodunu girin',
    joinBtn: isEn ? 'Join Workspace' : 'Ortak Bütçeye Katıl',
    membersTitle: isEn ? 'Workspace Members' : 'Bütçe Üyeleri',
    spentSoFar: isEn ? 'Spent So Far' : 'Toplam Harcaması',
    noMembers: isEn ? 'No other members yet.' : 'Henüz başka üye yok.',
    splitTitle: isEn ? 'Equal Split Calculator' : '⚖️ Eşit Bölüşüm Hesabı',
    splitSubtitle: isEn 
      ? 'Calculates total expenses and determines the net settlement between members.' 
      : 'Ortak harcamaları analiz ederek kimin kime ne kadar ödemesi gerektiğini hesaplar.',
    totalExpenses: isEn ? 'Total Joint Expenses' : 'Ortak Toplam Gider',
    sharePerPerson: isEn ? 'Share Per Person' : 'Kişi Başına Düşen Pay',
    settled: isEn ? 'You are all settled up!' : 'Tebrikler, tamamen ödeştiniz!',
    settledDesc: isEn 
      ? 'Hassle-free budgeting! Total expenses are divided equally.' 
      : 'Harcamalarınız tamamen dengede, kimsenin kimseye borcu bulunmuyor.',
    owesUser: isEn ? '{partner} owes you {amount}' : '{partner} size {amount} ödemeli',
    userOwes: isEn ? 'You owe {partner} {amount}' : '{partner} kullanıcısına {amount} borcunuz var',
    settleBtn: isEn ? 'Settle Balance / Settle Debt' : 'Dengele / Borcu Kapat',
    settleSuccess: isEn ? 'Balances settled successfully!' : 'Ödeşme kaydı başarıyla oluşturuldu!',
    settleTxDesc: isEn ? 'Workspace Settlement Payment' : 'Ortak Bütçe Ödeşme Kapatması',
    demoNotice: isEn 
      ? 'Demo Mode active. Seeding mock partner "buse@moneymate.com" to demonstrate split.'
      : 'Demo Modu aktif. Bölüşümü göstermek için sahte partner "buse@moneymate.com" harcamaları eklendi.'
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await createWorkspace(wsName);
    setActionLoading(false);

    if (res.success) {
      setSuccessMsg(isEn ? 'Workspace created successfully!' : 'Ortak bütçe başarıyla oluşturuldu!');
      setWsName('');
    } else {
      setErrorMsg(res.error || 'Bir hata oluştu.');
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await joinWorkspace(inviteCodeInput);
    setActionLoading(false);

    if (res.success) {
      setSuccessMsg(isEn ? 'Joined workspace successfully!' : 'Ortak bütçeye başarıyla katıldınız!');
      setInviteCodeInput('');
    } else {
      setErrorMsg(res.error || 'Bir hata oluştu. Davet kodunu kontrol edin.');
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!activeWorkspace) return;
    
    setActionLoading(true);
    setErrorMsg('');
    
    const res = await leaveWorkspace(activeWorkspace.id);
    setActionLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Ortak bütçeden ayrılırken bir hata oluştu.');
    }
  };

  // --- CALCULATION LOGIC FOR SPLIT EXPENSES ---
  const memberExpenses = React.useMemo(() => {
    // 1. Filter only expenses in this workspace
    const workspaceExpenses = transactions.filter(t => t.type === 'expense');
    
    // 2. Sum amounts grouped by user_id
    const spentMap: Record<string, number> = {};
    
    // Initialize all members with 0 spent
    workspaceMembers.forEach(m => {
      spentMap[m.id] = 0;
    });
    
    // Always include current user
    spentMap[user.id] = 0;

    workspaceExpenses.forEach(t => {
      spentMap[t.user_id] = (spentMap[t.user_id] || 0) + Number(t.amount);
    });

    return spentMap;
  }, [transactions, workspaceMembers, user.id]);

  const splitMetrics = React.useMemo(() => {
    // Total expenses of the workspace
    const totalSpent = Object.values(memberExpenses).reduce((sum, amt) => sum + amt, 0);
    
    // Number of active members (at least 1, usually 2 or more)
    const memberCount = Math.max(1, workspaceMembers.length > 0 ? workspaceMembers.length : 1);
    
    const share = totalSpent / memberCount;

    // Calculate balances for each member
    // balance = amount_spent - share
    // positive balance: member paid more than their share (needs to receive money)
    // negative balance: member paid less than their share (needs to pay money)
    const balances = Object.entries(memberExpenses).map(([uid, spent]) => {
      const member = workspaceMembers.find(m => m.id === uid) || (uid === user.id ? user : null);
      return {
        userId: uid,
        email: member?.email || 'Bilinmeyen Kullanıcı',
        spent,
        balance: spent - share
      };
    });

    // For a 2-user layout (most common family/couple bütçesi)
    // We can show a clear partner-to-user owes calculation
    let debtText = '';
    let owesAmount = 0;
    let debtorId = '';
    let creditorId = '';
    let partnerEmail = '';

    if (workspaceMembers.length === 2) {
      const partner = workspaceMembers.find(m => m.id !== user.id);
      if (partner) {
        partnerEmail = partner.email;
        const mySpent = memberExpenses[user.id] || 0;
        const partnerSpent = memberExpenses[partner.id] || 0;

        if (mySpent > partnerSpent) {
          // Partner owes me
          owesAmount = (mySpent - partnerSpent) / 2;
          debtorId = partner.id;
          creditorId = user.id;
          debtText = t.owesUser
            .replace('{partner}', partner.email.split('@')[0])
            .replace('{amount}', formatCurrency(owesAmount, user.currency));
        } else if (partnerSpent > mySpent) {
          // I owe partner
          owesAmount = (partnerSpent - mySpent) / 2;
          debtorId = user.id;
          creditorId = partner.id;
          debtText = t.userOwes
            .replace('{partner}', partner.email.split('@')[0])
            .replace('{amount}', formatCurrency(owesAmount, user.currency));
        }
      }
    } else if (workspaceMembers.length > 2) {
      // General settlement solver (greedy matching)
      // For simplified display, we can show who has positive balance and who has negative
      const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
      const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

      if (creditors.length > 0 && debtors.length > 0) {
        const topCreditor = creditors[0];
        const topDebtor = debtors[0];
        owesAmount = Math.min(topCreditor.balance, Math.abs(topDebtor.balance));
        debtorId = topDebtor.userId;
        creditorId = topCreditor.userId;

        if (debtorId === user.id) {
          debtText = t.userOwes
            .replace('{partner}', topCreditor.email.split('@')[0])
            .replace('{amount}', formatCurrency(owesAmount, user.currency));
        } else if (creditorId === user.id) {
          debtText = t.owesUser
            .replace('{partner}', topDebtor.email.split('@')[0])
            .replace('{amount}', formatCurrency(owesAmount, user.currency));
        } else {
          debtText = `${topDebtor.email.split('@')[0]} -> ${topCreditor.email.split('@')[0]}: ${formatCurrency(owesAmount, user.currency)}`;
        }
      }
    }

    return {
      totalSpent,
      share,
      balances,
      debtText,
      owesAmount,
      debtorId,
      creditorId,
      partnerEmail
    };
  }, [memberExpenses, workspaceMembers, user.currency, user.id]);

  const handleSettleDebt = async () => {
    if (splitMetrics.owesAmount <= 0) return;

    setActionLoading(true);
    
    // Create balancing transaction
    // The debtor creates an expense of owesAmount, paid to the workspace, category: 'Diğer Gider'
    const cat = categories.find(c => c.name.toLowerCase().includes('diğer') || c.name.toLowerCase().includes('other')) || categories[0];

    const res = await addTransaction({
      amount: splitMetrics.owesAmount,
      type: 'expense',
      category_id: cat?.id || '',
      description: `${t.settleTxDesc} (${splitMetrics.debtText.split(':')[0]})`,
      payment_method: 'Banka Kartı',
      transaction_date: new Date().toISOString().split('T')[0],
      user_id: splitMetrics.debtorId // Recorded as paid by the debtor!
    });

    setActionLoading(false);

    if (res.success) {
      setSuccessMsg(t.settleSuccess);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(res.error || 'Ödeşme yapılırken hata oluştu.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Users className="text-brand-500 shrink-0" size={24} />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t.subtitle}
          </p>
        </div>

        {/* Workspace Quick Selector in Header */}
        {workspaces.length > 0 && (
          <div className="flex items-center space-x-2.5 shrink-0 w-48 sm:w-56">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              {isEn ? 'Workspace:' : 'Aktif Havuz:'}
            </span>
            <WorkspaceSelector
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              setActiveWorkspace={setActiveWorkspace}
              isEn={isEn}
            />
          </div>
        )}
      </div>

      {isDemo && activeWorkspace?.id === 'demo-workspace-family' && (
        <div className="p-3 bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs rounded-2xl flex items-center gap-2.5 leading-relaxed font-semibold">
          <span>💡</span>
          <p>{t.demoNotice}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs rounded-2xl font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
          {errorMsg}
        </div>
      )}

      {/* WORKSPACE DETAILED VIEWS */}
      {!activeWorkspace ? (
        
        // --- VIEW A: PERSONAL SPACE (Invite / Create Form) ---
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Status info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-full text-slate-400">
                <Wallet size={36} className="text-brand-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {t.personalSpace}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed font-medium">
                  {t.personalSpaceDesc}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">
                {isEn 
                  ? 'To share expenses, create a joint budget pool below or enter an invite code sent by your partner.' 
                  : 'Giderlerinizi bölüşmek ve birlikte bütçe planlamak için aşağıdan yeni bir havuz kurun ya da ortağınızın gönderdiği davet kodunu girin.'}
              </p>
            </div>
            
            {/* Create Form */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center space-x-2">
                <Plus size={16} className="text-brand-500" />
                <span>{t.createTitle}</span>
              </h3>
              <form onSubmit={handleCreateWorkspace} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder={t.createPlaceholder}
                  className="premium-input flex-1 text-sm py-2.5"
                />
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="premium-btn-primary py-2.5 px-6 shadow-md shadow-brand-500/10 shrink-0 font-semibold cursor-pointer text-xs"
                >
                  {t.createBtn}
                </button>
              </form>
            </div>
          </div>

          {/* Join Form (Right Column) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center space-x-2">
              <UserPlus size={16} className="text-brand-500" />
              <span>{t.joinTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
              {isEn 
                ? 'Join an existing shared space by providing the invite code generated by the owner.' 
                : 'Diğer kullanıcının oluşturduğu ortak bütçeye, onun ürettiği davet koduyla anında katılın.'}
            </p>
            
            <form onSubmit={handleJoinWorkspace} className="space-y-3 pt-2">
              <input
                type="text"
                required
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder={t.joinPlaceholder}
                className="premium-input text-center text-sm py-2.5 uppercase font-bold tracking-widest"
                maxLength={12}
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="premium-btn-primary w-full py-2.5 shadow-md shadow-brand-500/15 font-semibold cursor-pointer text-xs"
              >
                {t.joinBtn}
              </button>
            </form>
          </div>
        </div>

      ) : (

        // --- VIEW B: ACTIVE SHARED WORKSPACE ---
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main workspace control & calculator */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Workspace Info Panel */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md">
                    {t.activeWorkspaceLbl}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">
                    {activeWorkspace.name}
                  </h3>
                </div>
                
                <button
                  onClick={() => setActiveWorkspace(null)}
                  className="premium-btn-secondary py-1.5 px-3 hover:bg-slate-100 font-semibold cursor-pointer text-[10px] shrink-0"
                >
                  🔒 {t.switchToPersonal}
                </button>
              </div>

              {/* Invite link card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase pl-0.5 tracking-wider">
                  {t.inviteCodeLbl}
                </span>
                <div className="flex items-center gap-3">
                  <div className="premium-input flex-1 font-mono font-extrabold tracking-widest text-center text-sm py-2 bg-white dark:bg-slate-900 flex items-center justify-center select-all border border-slate-200 dark:border-slate-800">
                    {activeWorkspace.invite_code}
                  </div>
                  <button
                    onClick={() => handleCopyCode(activeWorkspace.invite_code)}
                    className="premium-btn-secondary p-2.5 hover:bg-slate-100 flex items-center justify-center cursor-pointer shrink-0"
                    title={t.copyCode}
                  >
                    {copySuccess ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-0.5 leading-relaxed">
                  {t.inviteCodeDesc}
                </p>
              </div>

              {/* Leave workspace button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleLeaveWorkspace}
                  disabled={actionLoading}
                  className="text-red-500 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/5 transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>{t.leaveWorkspaceBtn}</span>
                </button>
              </div>
            </div>

            {/* Split Calculator Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
              
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center space-x-2">
                  <Coins className="text-amber-500" size={18} />
                  <span>{t.splitTitle}</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-relaxed">
                  {t.splitSubtitle}
                </p>
              </div>

              {/* Split Metrics Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block pl-0.5">
                    {t.totalExpenses}
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                    {formatCurrency(splitMetrics.totalSpent, user.currency)}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/30">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block pl-0.5">
                    {t.sharePerPerson}
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                    {formatCurrency(splitMetrics.share, user.currency)}
                  </span>
                </div>
              </div>

              {/* Visual balances / owe indicator */}
              <div className="p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center space-y-4 shadow-sm bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/30 dark:to-slate-900/10 border-slate-200 dark:border-slate-800/60">
                {splitMetrics.owesAmount <= 0.01 ? (
                  <>
                    <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500 rounded-full animate-bounce">
                      <CheckCircle size={28} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                        {t.settled}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {t.settledDesc}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 text-amber-500 rounded-full">
                      <Shuffle size={26} className="animate-spin duration-3000" />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest pl-0.5 block bg-amber-500/10 dark:bg-amber-500/5 px-2 py-0.5 rounded-full w-max mx-auto">
                        {isEn ? 'Unsettled Balance' : 'Dengelenmemiş Hesap'}
                      </span>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight leading-tight">
                        {splitMetrics.debtText}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                        {isEn 
                          ? 'Click the button below to register a balancing payment transaction to clear this outstanding debt.' 
                          : 'Aşağıdaki butona tıklayarak aranızdaki borcu kapatan dengeleyici bir ödeme kaydını ortak havuzunuza ekleyebilirsiniz.'}
                      </p>
                    </div>

                    <button
                      onClick={handleSettleDebt}
                      disabled={actionLoading}
                      className="premium-btn-primary py-2.5 px-6 shadow-md shadow-brand-500/15 flex items-center space-x-2 font-semibold cursor-pointer text-xs"
                    >
                      <Coins size={14} />
                      <span>{t.settleBtn}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Members listing (Right Column) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 shrink-0">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <Users size={16} className="text-brand-500" />
              <span>{t.membersTitle} ({Math.max(1, workspaceMembers.length)})</span>
            </h3>

            {workspaceMembers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4 font-medium">
                {t.noMembers}
              </p>
            ) : (
              <div className="space-y-4 pt-1">
                {workspaceMembers.map(member => {
                  const spent = memberExpenses[member.id] || 0;
                  const isMe = member.id === user.id;
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800/20">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                          {member.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden leading-tight">
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate max-w-[130px]" title={member.email}>
                            {member.email.split('@')[0]}
                            {isMe && <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 ml-1">({isEn ? 'You' : 'Siz'})</span>}
                          </h4>
                          <span className="text-[9px] text-slate-400 truncate max-w-[130px] block" title={member.email}>
                            {member.email}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                          {t.spentSoFar}
                        </span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block mt-0.5">
                          {formatCurrency(spent, user.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      )}
      
    </div>
  );
};

export default Workspace;
