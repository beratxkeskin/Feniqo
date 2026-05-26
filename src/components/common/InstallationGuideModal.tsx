import React from 'react';
import { X } from 'lucide-react';

interface InstallationGuideModalProps {
  isOpen: boolean;
  deviceType: 'ios' | 'android' | 'desktop';
  isEn: boolean;
  onClose: () => void;
}

export const InstallationGuideModal: React.FC<InstallationGuideModalProps> = ({
  isOpen,
  deviceType,
  isEn,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <X size={18} />
        </button>

        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <span className="text-3xl">📲</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
            {deviceType === 'ios'
              ? (isEn ? 'Install MoneyMate on iOS' : 'iOS Cihazınıza Yükleyin')
              : deviceType === 'android'
              ? (isEn ? 'Install MoneyMate on Android' : 'Android Cihazınıza Yükleyin')
              : (isEn ? 'Install MoneyMate on PC' : 'Bilgisayarınıza Yükleyin')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {deviceType === 'ios'
              ? (isEn ? 'Follow these simple steps in Safari to add to your Home Screen:' : 'MoneyMate\'i ana ekranınıza eklemek için Safari\'de aşağıdaki adımları takip edin:')
              : deviceType === 'android'
              ? (isEn ? 'Follow these simple steps in Chrome to add to your Home Screen:' : 'MoneyMate\'i ana ekranınıza eklemek için Chrome\'da aşağıdaki adımları takip edin:')
              : (isEn ? 'Follow these simple steps in Chrome/Edge to install on your PC:' : 'MoneyMate\'i bilgisayarınıza uygulama olarak kurmak için aşağıdaki adımları takip edin:')}
          </p>
        </div>

        <div className="py-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {deviceType === 'ios' && (
            <>
              {/* Step 1 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  1
                </span>
                <p className="leading-relaxed">
                  {isEn ? (
                    <>Tap the <strong>Share</strong> button <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">📤</span> in the bottom toolbar of Safari.</>
                  ) : (
                    <>Safari tarayıcısının altındaki araç çubuğunda bulunan <strong>Paylaş</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">📤</span> butonuna dokunun.</>
                  )}
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  2
                </span>
                <p className="leading-relaxed">
                  {isEn ? (
                    <>Scroll down the share menu and select <strong>Add to Home Screen</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">➕</span>.</>
                  ) : (
                    <>Açılan menüde aşağı kaydırın ve <strong>Ana Ekrana Ekle</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">➕</span> seçeneğini seçin.</>
                  )}
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  3
                </span>
                <p className="leading-relaxed">
                  {isEn ? (
                    <>Tap <strong>Add</strong> in the top-right corner to complete the installation.</>
                  ) : (
                    <>Sağ üst köşedeki <strong>Ekle</strong> butonuna dokunarak kurulumu tamamlayın.</>
                  )}
                </p>
              </div>
            </>
          )}

          {deviceType === 'android' && (
            <>
              {/* Step 1 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  1
                </span>
                <p className="leading-relaxed">
                  {isEn ? (
                    <>Tap the <strong>Menu</strong> icon <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">⋮</span> in the top-right corner of Chrome.</>
                  ) : (
                    <>Chrome tarayıcısının sağ üst köşesindeki <strong>Menü (üç nokta)</strong> <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">⋮</span> simgesine dokunun.</>
                  )}
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  2
                </span>
                <p className="leading-relaxed">
                  {isEn ? (
                    <>Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</>
                  ) : (
                    <>Açılan menüden <strong>"Ana Ekrana Ekle"</strong> veya <strong>"Uygulamayı Yükle"</strong> seçeneğine dokunun.</>
                  )}
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  3
                </span>
                <p className="leading-relaxed">
                  {isEn ? (
                    <>Confirm by tapping <strong>Install</strong> or <strong>Add</strong> in the pop-up.</>
                  ) : (
                    <>Çıkan onay penceresinde <strong>"Yükle"</strong> veya <strong>"Ekle"</strong> butonuna dokunarak kurulumu tamamlayın.</>
                  )}
                </p>
              </div>

              <div className="p-3 bg-brand-500/5 dark:bg-brand-500/5 border border-brand-200/40 dark:border-brand-800/40 text-brand-600 dark:text-brand-400 rounded-xl leading-relaxed text-[10px] font-semibold mt-2.5">
                {isEn ? (
                  <>💡 <strong>Note:</strong> Over local HTTP development connections, browsers block the automatic prompt. Deploying to a secure HTTPS server makes it direct. However, you can still install it manually via the menu!</>
                ) : (
                  <>💡 <strong>Not:</strong> Yerel ağda HTTP bağlantısı kullanıldığında tarayıcı otomatik kurulumu engeller. Uygulama HTTPS yüklü bir sunucuya taşındığında bu buton doğrudan çalışacaktır. Ancak şu anda da tarayıcı menüsünden manuel olarak sorunsuzca kurabilirsiniz!</>
                )}
              </div>
            </>
          )}

          {deviceType === 'desktop' && (
            <>
              {/* Step 1 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  1
                </span>
                <p className="leading-relaxed">
                  {isEn ? (
                    <>Look at the right end of the browser's <strong>Address Bar</strong> (URL input area).</>
                  ) : (
                    <>Tarayıcınızın <strong>Adres Çubuğunun</strong> (URL yazdığınız yer) en sağ tarafına bakın.</>
                  )}
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  2
                </span>
                <p className="leading-relaxed">
                  {isEn ? (
                    <>Click the <strong>Install</strong> icon <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">🖥️</span> or "Install MoneyMate" button.</>
                  ) : (
                    <>Orada beliren <strong>Uygulamayı Yükle / Install</strong> simgesine <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm mx-0.5">🖥️</span> tıklayın.</>
                  )}
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 font-bold shrink-0 text-[10px]">
                  3
                </span>
                <p className="leading-relaxed">
                  {isEn ? (
                    <>Confirm by clicking <strong>Install</strong> in the dialogue box.</>
                  ) : (
                    <>Çıkan kutucukta <strong>"Yükle"</strong> (Install) butonuna basarak bilgisayarınıza kurun.</>
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 text-center">
          <button
            onClick={onClose}
            className="w-full premium-btn-primary py-2.5 text-xs font-semibold cursor-pointer"
          >
            {isEn ? 'Got it' : 'Anladım'}
          </button>
        </div>
      </div>
    </div>
  );
};
