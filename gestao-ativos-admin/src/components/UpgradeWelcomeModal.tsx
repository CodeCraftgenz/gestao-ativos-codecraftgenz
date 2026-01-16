import { X, Sparkles, Check, PartyPopper, ArrowRight } from 'lucide-react';
import type { UpgradeInfo } from '../contexts/SubscriptionContext';

interface UpgradeWelcomeModalProps {
  upgradeInfo: UpgradeInfo;
  onClose: () => void;
}

export function UpgradeWelcomeModal({ upgradeInfo, onClose }: UpgradeWelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-white text-center relative overflow-hidden">
          {/* Decoracao de fundo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>

          {/* Botao fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Icone de celebracao */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
            <PartyPopper size={40} className="text-white" />
            <Sparkles size={20} className="absolute -top-1 -right-1 text-yellow-300" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Parabens pelo Upgrade!</h2>
          <p className="text-white/90 text-sm">
            Voce agora esta no plano <span className="font-semibold">{upgradeInfo.newPlan}</span>
          </p>
        </div>

        {/* Conteudo */}
        <div className="px-6 py-6">
          {/* Transicao de plano */}
          <div className="flex items-center justify-center gap-3 mb-6 text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-600">
              {upgradeInfo.previousPlan}
            </span>
            <ArrowRight size={20} className="text-primary-500" />
            <span className="px-3 py-1 bg-primary-100 rounded-full text-primary-700 font-medium">
              {upgradeInfo.newPlan}
            </span>
          </div>

          {/* Novas funcionalidades */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Novas Funcionalidades Liberadas
            </h3>
            <ul className="space-y-3">
              {upgradeInfo.newFeatures.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dica */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>Dica:</strong> Explore o menu lateral para acessar todas as novas funcionalidades do seu plano!
            </p>
          </div>

          {/* Botao de acao */}
          <button
            onClick={onClose}
            className="btn btn-primary w-full py-3"
          >
            Comecar a Explorar
          </button>
        </div>
      </div>
    </div>
  );
}
