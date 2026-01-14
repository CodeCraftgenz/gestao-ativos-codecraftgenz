using System;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;
using SettingsAlias = OverlayCraft.Properties.Settings;

namespace OverlayCraft
{
    public partial class frm_License : Form
    {
        public string email = null;

        public string EmailValidado => tbox_Email.Text.Trim();

        public frm_License()
        {
            InitializeComponent();
            
        }

        private void btn_Confirmar_Click(object sender, EventArgs e)
        {
            email = tbox_Email.Text.Trim();

            if (!EmailEhValido(email))
            {
                MessageBox.Show(
                    "Por favor, digite um e-mail válido.",
                    "Validação",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
                return;
            }
            
            SettingsAlias.Default.Save();

            DialogResult = DialogResult.OK;
            Close();
        }


        

        private bool EmailEhValido(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            return Regex.IsMatch(
                email,
                @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
                RegexOptions.IgnoreCase
            );
        }

        private void btn_Cancelar_Click(object sender, EventArgs e)
        {
            DialogResult = DialogResult.Cancel;
            Close();
        }
    }
}
