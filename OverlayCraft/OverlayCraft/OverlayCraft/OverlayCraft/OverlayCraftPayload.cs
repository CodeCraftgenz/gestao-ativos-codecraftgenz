using System;

namespace OverlayCraft
{
    /*****************************************************************************
          Classe: OverlayCraftPayload
       Descrição: Estrutura de dados que será enviada para a API do servidor
                  contendo todas as informações de monitoramento do sistema.
      Dt. Criação: 10/01/2026
    Dt. Alteração:
   Obs. Alteração:
       Criada por: mFacine/Claude
    ******************************************************************************/
    public class OverlayCraftPayload
    {
        public string ServiceTag { get; set; }
        public string Usuario { get; set; }
        public string SO { get; set; }
        public string CPU { get; set; }
        public string CPU_Uso { get; set; }
        public string CPU_Temp { get; set; }
        public string GPU { get; set; }
        public string GPU_Uso { get; set; }
        public string GPU_Temp { get; set; }
        public string RAM_Total { get; set; }
        public string RAM_Uso { get; set; }
        public string RAM_PageWritesSec { get; set; }
        public string RAM_ModifiedPages { get; set; }
        public string Discos { get; set; }
        public string IP { get; set; }
        public string Mascara { get; set; }
        public string Gateway { get; set; }
        public string SSIDWiFi { get; set; }
        public string MAC { get; set; }
        public string Bateria { get; set; }
        public string Energia { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
