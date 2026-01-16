import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { plansService } from '../services/plans.service';
import { Cpu, AlertCircle, Mail, Lock, User, Check } from 'lucide-react';
import type { Plan } from '../types';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('gratuito');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoadingPlans(true);
      const plansData = await plansService.getPlans();
      setPlans(plansData);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    } finally {
      setLoadingPlans(false);
    }
  }

  function formatPrice(cents: number): string {
    if (cents === 0) return 'Gratis';
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validacoes
    if (password !== confirmPassword) {
      setError('As senhas nao conferem');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no minimo 8 caracteres');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('A senha deve conter pelo menos uma letra maiuscula');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('A senha deve conter pelo menos uma letra minuscula');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('A senha deve conter pelo menos um numero');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        name,
        email,
        password,
        plan_slug: selectedPlan,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-right" style={{ maxWidth: '500px' }}>
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <Cpu />
            </div>
            <span className="login-logo-text">Gestao de Ativos</span>
          </div>

          {/* Title */}
          <h1 className="login-title">Criar Conta</h1>
          <p className="login-subtitle">Comece agora mesmo a gerenciar seus dispositivos</p>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger mb-4">
              <AlertCircle className="alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Nome Completo
              </label>
              <div className="input-with-icon">
                <User className="input-icon" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Seu nome"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="input-with-icon">
                <Mail className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Senha
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Min. 8 caracteres"
                  required
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Deve conter letras maiusculas, minusculas e numeros
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Senha
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="Repita a senha"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Plan Selection */}
            <div className="form-group">
              <label className="form-label">Escolha seu Plano</label>
              {loadingPlans ? (
                <div className="text-center py-4">
                  <div className="spinner"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.slug)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedPlan === plan.slug
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{plan.name}</span>
                        {selectedPlan === plan.slug && (
                          <Check size={16} className="text-primary-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPrice(plan.price_monthly_cents)}/mes
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {plan.max_devices === 999999 ? 'Ilimitado' : `${plan.max_devices} dispositivos`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedPlan !== 'gratuito' && (
                <p className="text-xs text-primary-600 mt-2">
                  Voce tera 14 dias de teste gratuito
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary login-btn"
            >
              {isLoading ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Ja tem uma conta?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
