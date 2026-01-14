using System;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;

namespace OverlayCraft
{
    public partial class frm_Sobre : Form
    {
        public frm_Sobre()
        {
            InitializeComponent();
        }

        private void frm_Sobre_Load(object sender, EventArgs e)
        {
            this.BackColor = Color.FromArgb(30, 30, 30);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Text = "Sobre o OverlayCraft";

        }

        private void lnk_Site_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "https://codecraftgenz.com.br/aplicativos",
                    UseShellExecute = true
                });
            }
            catch
            {
                MessageBox.Show(
                    "Não foi possível abrir o site.",
                    "OverlayCraft",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
            }
        }

        private void btn_Fechar_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void frm_Sobre_Shown(object sender, EventArgs e)
        {
            lbl_Titulo.Text = "OverlayCraft";
            lbl_Subtitulo.Text = "Painel Inteligente de Monitoramento de Hardware";

            lbl_Descricao.Text =
                "O OverlayCraft é um painel avançado de monitoramento em tempo real, " +
                "desenvolvido para exibir de forma clara, leve e moderna as principais " +
                "informações de desempenho do computador, como CPU, memória, GPU, discos, " +
                "rede e bateria.\r\n\r\n" +
                "Criado para entusiastas, profissionais de TI, gamers e desenvolvedores, " +
                "o OverlayCraft alia tecnologia, visual futurista e eficiência, funcionando " +
                "como um verdadeiro HUD (Head-Up Display) para o seu sistema.";

            lbl_Licenca.Text = "Este software é protegido por licença de uso.";
            lbl_Desenvolvedor.Text = "Desenvolvido por CodeCraft GenZ";
            lbl_Versao.Text = "Versão: FULL";

            lnk_Site.Text = "codecraftgenz.com.br/aplicativos";
        }
    }
}
