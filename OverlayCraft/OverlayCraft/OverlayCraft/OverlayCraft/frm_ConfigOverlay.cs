#define FULL
//#define TRIAL

/*
            |FULL                          |TRIAL
            |Todas as opções marcadas.     |Apenas as opções “Service Tag”, “SO”, “CPU”, “Discos”, “Usuário”  
            | e todos os botões            |marcados, e as demais ENABLED. e o botão CPU e os demais ENABLED.
*/

using HidSharp;
using System;
using System.Drawing;
using System.Windows.Forms;
using SettingsAlias = OverlayCraft.Properties.Settings;

namespace OverlayCraft
{
    public partial class frm_ConfigOverlay : Form
    {
        private readonly frm_Overlay _overlay;
        
        public frm_ConfigOverlay(frm_Overlay overlay = null)
        {
            _overlay = overlay;
            InitializeComponent();
            CarregarConfiguracoes();
            ConfigurarEventos();
        }

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);
            this.TopMost = true;   // suficiente
        }

        protected override void OnDeactivate(EventArgs e)
        {
            base.OnDeactivate(e);
            // Reforça o topo ao perder foco
            this.TopMost = true;
        }

        private void CarregarConfiguracoes()
        {
            // Estado dos checkboxes

            //TRIAL Apenas as opções “Service Tag”, “SO”, “CPU”, “Discos”, “Usuário”
#if TRIAL
            chltbox_Opcoes.SetItemChecked(0, SettingsAlias.Default.ShowServiceTag);
            chltbox_Opcoes.SetItemChecked(1, SettingsAlias.Default.ShowSO);
            chltbox_Opcoes.SetItemChecked(2, SettingsAlias.Default.ShowCPU);
            chltbox_Opcoes.SetItemChecked(3, SettingsAlias.Default.ShowDisks);
            chltbox_Opcoes.SetItemChecked(4, SettingsAlias.Default.ShowUser);
#elif FULL

            chltbox_Opcoes.SetItemChecked(0, SettingsAlias.Default.ShowServiceTag);
            chltbox_Opcoes.SetItemChecked(1, SettingsAlias.Default.ShowSO);
            chltbox_Opcoes.SetItemChecked(2, SettingsAlias.Default.ShowCPU);
            chltbox_Opcoes.SetItemChecked(3, SettingsAlias.Default.ShowDisks);
            chltbox_Opcoes.SetItemChecked(4, SettingsAlias.Default.ShowUser);
            chltbox_Opcoes.SetItemChecked(5, SettingsAlias.Default.ShowCPUPerCore);
            chltbox_Opcoes.SetItemChecked(6, SettingsAlias.Default.ShowGPU);
            chltbox_Opcoes.SetItemChecked(7, SettingsAlias.Default.ShowRAM);
            chltbox_Opcoes.SetItemChecked(8, SettingsAlias.Default.ShowNetwork);
#endif

            string hex = SettingsAlias.Default.FontColor;
            if (string.IsNullOrWhiteSpace(hex))
            {
                hex = "#32CD32";
                SettingsAlias.Default.FontColor = hex;
                SettingsAlias.Default.Save();
            }
            pnl_CorPreview.BackColor = ColorTranslator.FromHtml(hex);

            chbox_Fade.Checked = SettingsAlias.Default.EnableFade;
        }

        private void ConfigurarEventos()
        {
            chltbox_Opcoes.ItemCheck += (s, e) => BeginInvoke((MethodInvoker)SalvarConfiguracoes);
            btn_Cor.Click += Btn_Cor_Click;
            chbox_Fade.CheckedChanged += (s, e) => SalvarConfiguracoes();
        }

        private void Btn_Cor_Click(object sender, EventArgs e)
        {
            using (ColorDialog dlg = new ColorDialog())
            {
                dlg.Color = pnl_CorPreview.BackColor;
                if (dlg.ShowDialog() == DialogResult.OK)
                {
                    pnl_CorPreview.BackColor = dlg.Color;

                    // 1) grava no Settings
                    SettingsAlias.Default.FontColor = ColorTranslator.ToHtml(dlg.Color);
                    SettingsAlias.Default.Save(); // ✅ garante persistência já aqui

                    // 2) salva as demais opções e
                    SalvarConfiguracoes();        //    chama AplicarConfiguracoes()

                    // 3) aplica na hora, mesmo sem clicar em "Salvar"
                    _overlay?.AplicarConfiguracoes();
                }
            }
        }

        private void SalvarConfiguracoes()
        {
#if TRIAL
            SettingsAlias.Default.ShowServiceTag = chltbox_Opcoes.GetItemChecked(0);
            SettingsAlias.Default.ShowSO = chltbox_Opcoes.GetItemChecked(1);
            SettingsAlias.Default.ShowCPU = chltbox_Opcoes.GetItemChecked(2);
            SettingsAlias.Default.ShowDisks = chltbox_Opcoes.GetItemChecked(3);
            SettingsAlias.Default.ShowUser = chltbox_Opcoes.GetItemChecked(4);

#elif FULL
            SettingsAlias.Default.ShowServiceTag = chltbox_Opcoes.GetItemChecked(0);
            SettingsAlias.Default.ShowSO = chltbox_Opcoes.GetItemChecked(1);
            SettingsAlias.Default.ShowCPU = chltbox_Opcoes.GetItemChecked(2);
            SettingsAlias.Default.ShowDisks = chltbox_Opcoes.GetItemChecked(3);
            SettingsAlias.Default.ShowUser = chltbox_Opcoes.GetItemChecked(4);
            SettingsAlias.Default.ShowCPUPerCore = chltbox_Opcoes.GetItemChecked(5);
            SettingsAlias.Default.ShowGPU = chltbox_Opcoes.GetItemChecked(6);
            SettingsAlias.Default.ShowRAM = chltbox_Opcoes.GetItemChecked(7);
            SettingsAlias.Default.ShowNetwork = chltbox_Opcoes.GetItemChecked(8);
#endif

            SettingsAlias.Default.EnableFade = chbox_Fade.Checked;
            SettingsAlias.Default.EnableFade = chbox_Fade.Checked;
            _overlay?.AplicarConfiguracoes();
            SettingsAlias.Default.Save();
        }

        private void btn_Salvar_Click(object sender, EventArgs e)
        {
            try
            {
                SettingsAlias.Default.Save();
                _overlay?.AplicarConfiguracoes();
                this.DialogResult = DialogResult.OK; // <- essencial
                this.Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro ao salvar configurações: {ex.Message}", "OverlayCraft", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void btn_UsoCPU_Click(object sender, EventArgs e)
        {
            AbrirAnalogico("CPU");
        }

        private void btn_UsoGPU_Click(object sender, EventArgs e)
        {
            AbrirAnalogico("GPU");
        }

        private void btn_UsoRAM_Click(object sender, EventArgs e)
        {
            AbrirAnalogico("RAM");
        }


        private void AbrirAnalogico(string tipo)
        {
            string chave = tipo.ToUpper();

            // Se já existir e ainda estiver aberta, apenas traz à frente
            if (frm_Analogico.Instancias.ContainsKey(chave))
            {
                if (frm_Analogico.Instancias[chave] != null &&
                    !frm_Analogico.Instancias[chave].IsDisposed)
                {
                    frm_Analogico.Instancias[chave].Focus();
                    return;
                }
                else
                {
                    frm_Analogico.Instancias.Remove(chave);
                }
            }

            // Cria e mostra a nova janela analógica
            frm_Analogico obj_frm_Analogico = new frm_Analogico(0, 100, 0, chave);
            obj_frm_Analogico.StartPosition = FormStartPosition.Manual;
            obj_frm_Analogico.Location = new Point(100, 100);
            obj_frm_Analogico.Show();

            // ✅ Armazena no dicionário APÓS o Show()
            frm_Analogico.Instancias[chave] = obj_frm_Analogico;
        }

        private void btn_Sobre_Click(object sender, EventArgs e)
        {
            frm_Sobre sobre = new frm_Sobre();
            sobre.ShowDialog();
        }

    }
}
