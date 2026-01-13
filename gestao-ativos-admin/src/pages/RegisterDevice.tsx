import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Tag, FileText, Clock, User, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { devicesService } from '../services/devices.service';
import type { PreRegisteredDevice, Device } from '../types';

export function RegisterDevice() {
  const navigate = useNavigate();

  // Estado para busca
  const [searchTag, setSearchTag] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Device | null | 'not_found'>(null);

  // Estado para registro
  const [newServiceTag, setNewServiceTag] = useState('');
  const [description, setDescription] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Lista de pre-registrados
  const [preRegistered, setPreRegistered] = useState<PreRegisteredDevice[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showList, setShowList] = useState(false);

  // Buscar dispositivo por Service Tag
  const handleSearch = async () => {
    if (!searchTag.trim()) return;

    setSearching(true);
    setSearchResult(null);

    try {
      const device = await devicesService.getByServiceTag(searchTag.trim());
      setSearchResult(device || 'not_found');
    } catch {
      setSearchResult('not_found');
    } finally {
      setSearching(false);
    }
  };

  // Registrar novo dispositivo
  const handleRegister = async () => {
    if (!newServiceTag.trim()) {
      setRegisterError('Service Tag e obrigatoria');
      return;
    }

    setRegistering(true);
    setRegisterError('');
    setRegisterSuccess(false);

    try {
      await devicesService.registerByServiceTag(newServiceTag.trim(), description.trim() || undefined);
      setRegisterSuccess(true);
      setNewServiceTag('');
      setDescription('');

      // Atualiza lista se estiver visivel
      if (showList) {
        loadPreRegistered();
      }
    } catch (error: unknown) {
      setRegisterError(error instanceof Error ? error.message : 'Erro ao registrar dispositivo');
    } finally {
      setRegistering(false);
    }
  };

  // Carregar lista de pre-registrados
  const loadPreRegistered = async () => {
    setLoadingList(true);
    try {
      const list = await devicesService.getPreRegistered();
      setPreRegistered(list);
    } catch (error) {
      console.error('Erro ao carregar lista:', error);
    } finally {
      setLoadingList(false);
    }
  };

  // Toggle lista
  const toggleList = () => {
    if (!showList) {
      loadPreRegistered();
    }
    setShowList(!showList);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Registrar Dispositivo</h1>
            <p className="page-description">
              Cadastre dispositivos por Service Tag antes do enrollment
            </p>
          </div>
          <button type="button" onClick={toggleList} className="btn btn-secondary">
            <Clock size={18} />
            {showList ? 'Ocultar Lista' : 'Ver Pre-Registrados'}
            {preRegistered.length > 0 && (
              <span className="badge badge-warning ml-2">
                {preRegistered.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Card de Busca */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Search size={20} />
              Buscar por Service Tag
            </h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Service Tag</label>
              <div className="search-row">
                <input
                  type="text"
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Ex: ABC1234"
                  className="input"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching || !searchTag.trim()}
                  className="btn btn-primary"
                >
                  {searching ? <div className="spinner spinner-sm"></div> : <Search size={18} />}
                  Buscar
                </button>
              </div>
            </div>

            {/* Resultado da busca */}
            {searchResult && (
              <div className={`alert mt-4 ${searchResult === 'not_found' ? 'alert-warning' : 'alert-success'}`}>
                {searchResult === 'not_found' ? (
                  <>
                    <AlertCircle size={20} />
                    <span>Nenhum dispositivo encontrado com esta Service Tag</span>
                  </>
                ) : (
                  <div className="result-content">
                    <div className="result-header">
                      <Check size={20} />
                      <strong>Dispositivo encontrado!</strong>
                    </div>
                    <div className="result-details text-sm">
                      <p><strong>Hostname:</strong> {searchResult.hostname}</p>
                      <p><strong>Status:</strong> {searchResult.status}</p>
                      <p><strong>SO:</strong> {searchResult.os_name || 'N/D'}</p>
                      <button
                        type="button"
                        onClick={() => navigate(`/devices/${searchResult.id}`)}
                        className="btn btn-link mt-2"
                      >
                        Ver detalhes →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card de Registro */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Plus size={20} />
              Pre-Registrar Dispositivo
            </h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">
                <Tag size={16} />
                Service Tag *
              </label>
              <input
                type="text"
                value={newServiceTag}
                onChange={(e) => setNewServiceTag(e.target.value.toUpperCase())}
                placeholder="Ex: ABC1234"
                className="input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <FileText size={16} />
                Descricao (opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Notebook do setor financeiro"
                className="input"
              />
            </div>

            {registerError && (
              <div className="alert alert-danger">
                <AlertCircle size={18} />
                <span>{registerError}</span>
              </div>
            )}

            {registerSuccess && (
              <div className="alert alert-success">
                <Check size={18} />
                <span>Dispositivo pre-registrado com sucesso! Aguardando enrollment.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleRegister}
              disabled={registering || !newServiceTag.trim()}
              className="btn btn-success w-full mt-2"
            >
              {registering ? <div className="spinner spinner-sm"></div> : <Plus size={18} />}
              Registrar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Pre-Registrados */}
      {showList && (
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={20} />
              Dispositivos Pre-Registrados
            </h3>
            <button type="button" onClick={loadPreRegistered} className="btn btn-ghost btn-sm" title="Atualizar lista">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="card-body">
            {loadingList ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : preRegistered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Tag />
                </div>
                <h3 className="empty-state-title">Nenhum dispositivo pre-registrado</h3>
                <p className="empty-state-description">
                  Use o formulario acima para pre-registrar dispositivos
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Service Tag</th>
                      <th>Descricao</th>
                      <th>Registrado por</th>
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preRegistered.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <code className="text-primary-600">{item.service_tag}</code>
                        </td>
                        <td>{item.description || '-'}</td>
                        <td>
                          <div className="user-cell">
                            <User size={14} />
                            <span>{item.registered_by_email || `ID: ${item.registered_by}`}</span>
                          </div>
                        </td>
                        <td>{new Date(item.registered_at).toLocaleDateString('pt-BR')}</td>
                        <td>
                          {item.enrolled ? (
                            <span className="badge badge-success">
                              <Check size={12} />
                              Vinculado
                            </span>
                          ) : (
                            <span className="badge badge-warning">
                              <Clock size={12} />
                              Aguardando
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
