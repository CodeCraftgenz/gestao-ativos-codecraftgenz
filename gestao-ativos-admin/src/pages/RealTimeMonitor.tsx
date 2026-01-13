import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Cpu, MemoryStick, HardDrive, Wifi, Battery, Thermometer,
  Activity, RefreshCw, AlertCircle, ArrowLeft, Monitor,
  Gauge, Server, User, Clock
} from 'lucide-react';
import { devicesService } from '../services/devices.service';
import type { OverlayCraftSnapshot } from '../services/devices.service';
import type { Device } from '../types';

// Componente de barra de progresso circular
function CircularProgress({ value, size = 80, strokeWidth = 8, color = 'blue' }: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorClasses: Record<string, string> = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500',
    purple: 'text-purple-500',
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={colorClasses[color] || 'text-blue-500'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-700">{value.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// Componente de barra de progresso linear
function LinearProgress({ value, color = 'blue', label }: {
  value: number;
  color?: string;
  label?: string;
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="text-gray-700 font-medium">{value.toFixed(1)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${bgColors[color] || 'bg-blue-500'}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

// Funcao para extrair valor numerico de string de porcentagem (ex: "21,2%" -> 21.2)
function parsePercentage(value: string): number {
  if (!value || value === 'N/D') return 0;
  const num = parseFloat(value.replace('%', '').replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

// Funcao para extrair temperatura de string (ex: "60,0 °C" -> 60)
function parseTemperature(value: string): number {
  if (!value || value === 'N/D') return 0;
  const num = parseFloat(value.replace('°C', '').replace(',', '.').trim());
  return isNaN(num) ? 0 : num;
}

// Funcao para extrair GB de string (ex: "15,7 GB" -> 15.7)
function parseGB(value: string): number {
  if (!value || value === 'N/D') return 0;
  const num = parseFloat(value.replace('GB', '').replace(',', '.').trim());
  return isNaN(num) ? 0 : num;
}

// Funcao para extrair bateria de string (ex: "100%" -> 100)
function parseBattery(value: string): number {
  if (!value || value === 'N/D') return 0;
  const num = parseInt(value.replace('%', ''));
  return isNaN(num) ? 0 : num;
}

// Parse discos da string do snapshot
interface ParsedDisk {
  letter: string;
  freeGB: number;
  totalGB: number;
  usedGB: number;
  usagePercent: number;
  queueLength: number;
}

function parseDisks(diskString: string): ParsedDisk[] {
  if (!diskString) return [];

  const lines = diskString.split('\n');
  const disks: ParsedDisk[] = [];

  for (const line of lines) {
    // Formato: "Disco: C:\ 87,7 GB / 454,4 GB livres | Fila: 0,00"
    const match = line.match(/(?:Disco|USB):\s*(\w:\\?)\s*([\d,.]+)\s*GB\s*\/\s*([\d,.]+)\s*GB\s*livres(?:\s*\|\s*Fila:\s*([\d,.]+))?/i);
    if (match) {
      const freeGB = parseFloat(match[2].replace(',', '.'));
      const totalGB = parseFloat(match[3].replace(',', '.'));
      const usedGB = totalGB - freeGB;
      const queueLength = match[4] ? parseFloat(match[4].replace(',', '.')) : 0;

      disks.push({
        letter: match[1],
        freeGB,
        totalGB,
        usedGB,
        usagePercent: totalGB > 0 ? (usedGB / totalGB) * 100 : 0,
        queueLength
      });
    }
  }

  return disks;
}

export function RealTimeMonitor() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [data, setData] = useState<OverlayCraftSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const deviceId = parseInt(id || '0');

  // Carregar dados do dispositivo
  useEffect(() => {
    if (deviceId) {
      devicesService.getById(deviceId)
        .then(setDevice)
        .catch(console.error);
    }
  }, [deviceId]);

  // Carregar dados em tempo real do cache de snapshots
  const loadRealTimeData = useCallback(async () => {
    if (!deviceId) return;

    try {
      setError(null);
      const snapshot = await devicesService.getRealTimeDataCached(deviceId);
      setData(snapshot);
      setLastUpdate(new Date(snapshot.receivedAt));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Carregar dados iniciais e configurar auto-refresh
  useEffect(() => {
    loadRealTimeData();

    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(loadRealTimeData, 5000); // Atualiza a cada 5 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadRealTimeData, autoRefresh]);

  // Funcao para determinar cor baseada no valor
  const getColorByValue = (value: number, thresholds = { low: 50, medium: 75, high: 90 }) => {
    if (value >= thresholds.high) return 'red';
    if (value >= thresholds.medium) return 'yellow';
    if (value >= thresholds.low) return 'blue';
    return 'green';
  };

  // Valores parseados
  const cpuUsage = data ? parsePercentage(data.cpu_Uso) : 0;
  const cpuTemp = data ? parseTemperature(data.cpu_Temp) : 0;
  const gpuUsage = data ? parsePercentage(data.gpu_Uso) : 0;
  const gpuTemp = data ? parseTemperature(data.gpu_Temp) : 0;
  const ramUsage = data ? parsePercentage(data.ram_Uso) : 0;
  const ramTotal = data ? parseGB(data.ram_Total) : 0;
  const ramUsed = ramTotal * (ramUsage / 100);
  const batteryPercent = data ? parseBattery(data.bateria) : 0;
  const disks = data ? parseDisks(data.discos) : [];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Conectando ao OverlayCraft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={device ? `/devices/${device.id}` : '/devices'}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-500" />
              Monitoramento em Tempo Real
            </h1>
            <p className="text-gray-600">
              {device?.hostname || 'Dispositivo'} - {data?.serviceTag || 'Carregando...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>

          <button
            type="button"
            onClick={loadRealTimeData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-medium text-red-700">Erro ao conectar</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Info do sistema */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Service Tag:</span>
                <span className="font-medium">{data.serviceTag}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Usuario:</span>
                <span className="font-medium">{data.usuario}</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">OS:</span>
                <span className="font-medium truncate" title={data.so}>{data.so}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">IP:</span>
                <span className="font-medium">{data.ip}</span>
              </div>
            </div>
          </div>

          {/* Metricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-500" />
                  CPU
                </h3>
                {cpuTemp > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Thermometer className={`w-4 h-4 ${cpuTemp > 80 ? 'text-red-500' : 'text-orange-500'}`} />
                    <span className={cpuTemp > 80 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {cpuTemp.toFixed(0)}°C
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-center mb-4">
                <CircularProgress
                  value={cpuUsage}
                  color={getColorByValue(cpuUsage)}
                  size={100}
                />
              </div>

              <p className="text-xs text-gray-500 text-center mb-3 truncate" title={data.cpu}>
                {data.cpu}
              </p>
            </div>

            {/* RAM */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MemoryStick className="w-5 h-5 text-purple-500" />
                  Memoria RAM
                </h3>
                <span className="text-sm text-gray-500">
                  {ramUsed.toFixed(1)} / {ramTotal.toFixed(1)} GB
                </span>
              </div>

              <div className="flex justify-center mb-4">
                <CircularProgress
                  value={ramUsage}
                  color={getColorByValue(ramUsage)}
                  size={100}
                />
              </div>

              <div className="space-y-2 mt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Page Writes/sec:</span>
                  <span className="font-mono">{data.ram_PageWritesSec}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Modified Pages:</span>
                  <span className="font-mono">{data.ram_ModifiedPages}</span>
                </div>
              </div>
            </div>

            {/* GPU */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-green-500" />
                  GPU
                </h3>
                {gpuTemp > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Thermometer className={`w-4 h-4 ${gpuTemp > 80 ? 'text-red-500' : 'text-orange-500'}`} />
                    <span className={gpuTemp > 80 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {gpuTemp.toFixed(0)}°C
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-center mb-4">
                <CircularProgress
                  value={gpuUsage}
                  color={getColorByValue(gpuUsage)}
                  size={100}
                />
              </div>

              <p className="text-xs text-gray-500 text-center truncate" title={data.gpu}>
                {data.gpu}
              </p>
            </div>
          </div>

          {/* Discos */}
          {disks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <HardDrive className="w-5 h-5 text-gray-500" />
                Armazenamento
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {disks.map((disk, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{disk.letter}</span>
                      <span className="text-sm text-gray-500">
                        {disk.freeGB.toFixed(1)} GB livres
                      </span>
                    </div>
                    <LinearProgress
                      value={disk.usagePercent}
                      color={getColorByValue(disk.usagePercent, { low: 60, medium: 80, high: 90 })}
                    />
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>{disk.usedGB.toFixed(1)} GB usado</span>
                      <span>{disk.totalGB.toFixed(1)} GB total</span>
                    </div>
                    {disk.queueLength > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Queue: {disk.queueLength.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rede e Bateria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rede */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Wifi className="w-5 h-5 text-blue-500" />
                Rede
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">IP:</span>
                  <span className="font-mono">{data.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mascara:</span>
                  <span className="font-mono">{data.mascara}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gateway:</span>
                  <span className="font-mono">{data.gateway}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MAC:</span>
                  <span className="font-mono">{data.mac}</span>
                </div>
                {data.ssidWiFi !== 'N/D' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">WiFi SSID:</span>
                    <span className="font-medium">{data.ssidWiFi}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bateria */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Battery className="w-5 h-5 text-green-500" />
                Bateria
              </h3>

              {data.bateria !== 'N/D' ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <CircularProgress
                      value={batteryPercent}
                      color={batteryPercent < 20 ? 'red' : batteryPercent < 50 ? 'yellow' : 'green'}
                      size={100}
                    />
                  </div>
                  <div className="text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      data.energia === 'Carregando'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {data.energia}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Battery className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Sem bateria (Desktop)</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
