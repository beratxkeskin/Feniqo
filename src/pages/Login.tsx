import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, Loader, ArrowRight, UserCheck, Play, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { signIn, signUp, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password || (isRegister && !fullName.trim())) {
      setErrorMessage('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setErrorMessage('Şifreler eşleşmiyor.');
      return;
    }

    setLocalLoading(true);

    try {
      if (isRegister) {
        const res = await signUp(email.trim(), password, fullName.trim());
        if (res.success) {
          if ((res as any).sessionRequired) {
            setSuccessMessage('Kayıt başarılı! Hesabınızı etkinleştirmek için lütfen e-posta adresinize gönderilen onay linkine tıklayın.');
            setLocalLoading(false);
          } else {
            setSuccessMessage('Kayıt başarılı! Giriş yapılıyor...');
            setTimeout(async () => {
              await signIn(email.trim(), password);
            }, 1000);
          }
        } else {
          setErrorMessage(res.error || 'Kayıt sırasında bir hata oluştu.');
        }
      } else {
        const res = await signIn(email.trim(), password);
        if (!res.success) {
          setErrorMessage(res.error || 'E-posta veya şifre hatalı.');
        }
      }
    } catch (err: any) {
      setErrorMessage('Beklenmeyen bir hata oluştu.');
    } finally {
      // If email confirmation is required, we don't turn off localLoading here because user needs to read the message and we don't want them submitting again.
      // Actually, we turn it off so they can correct if needed, but we already set it to false above.
      setLocalLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setLocalLoading(true);
    setErrorMessage('');
    try {
      await signIn('demo@feniqo.com', '', true);
    } catch (e) {
      setErrorMessage('Demo modu başlatılamadı.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-brand-900 to-slate-950 px-4 py-8 relative overflow-hidden transition-all duration-300">
      
      {/* Dynamic background bubbles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-700" />

      {/* Main card */}
      <div className="w-full max-w-md rounded-3xl bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 dark:border-slate-800/80 shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 pb-6">
          <div className="p-3 bg-brand-500/20 text-brand-400 rounded-2xl animate-bounce shadow-lg shadow-brand-500/10">
            <TrendingUp size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Feniqo
            </h1>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-400 mt-1 max-w-[280px]">
              Kişisel finansınızı modern yöntemlerle, kolayca kontrol altına alın.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          {/* Notification Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl text-center">
              {successMessage}
            </div>
          )}

          {/* Full Name field (only in register mode) */}
          {isRegister && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                Ad Soyad
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/30 dark:bg-slate-900/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pl-10 text-sm transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              E-posta Adresi
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@domain.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/30 dark:bg-slate-900/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pl-10 text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Şifre
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/30 dark:bg-slate-900/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pl-10 text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Confirm Password field (if register mode) */}
          {isRegister && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                Şifre Tekrar
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800/30 dark:bg-slate-900/20 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pl-10 text-sm transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center space-x-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={localLoading || loading}
          >
            {localLoading || loading ? (
              <Loader size={16} className="animate-spin" />
            ) : isRegister ? (
              <>
                <UserCheck size={16} />
                <span>Kayıt Ol</span>
              </>
            ) : (
              <>
                <span>Giriş Yap</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-5 pb-3">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-4 hover:decoration-2"
          >
            {isRegister ? 'Zaten hesabınız var mı? Giriş Yap' : 'Hesabınız yok mu? Kayıt Ol'}
          </button>
        </div>

        {/* Separator */}
        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-slate-700/60" />
          <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            PORTFOLYO HIZLI AÇILIŞ
          </span>
          <div className="flex-grow border-t border-slate-700/60" />
        </div>

        {/* Demo mode click */}
        <button
          onClick={handleDemoMode}
          className="w-full py-3.5 px-4 rounded-xl border border-dashed border-slate-600 hover:border-slate-500 bg-slate-800/10 hover:bg-slate-800/20 active:scale-[0.98] text-slate-400 dark:text-slate-400 hover:text-white font-semibold text-xs transition-all flex items-center justify-center space-x-2.5"
          disabled={localLoading || loading}
          title="Veritabanı bilgileri girmeden, local storage üzerinden zengin test verileriyle uygulamayı anında keşfedin."
        >
          <Play size={14} className="fill-current" />
          <span>Giriş Yapmadan Dene (Demo Modu)</span>
        </button>

      </div>
    </div>
  );
};

export default Login;
