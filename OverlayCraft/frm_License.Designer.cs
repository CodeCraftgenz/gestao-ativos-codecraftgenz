namespace OverlayCraft
{
    partial class frm_License
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Label lbl_Titulo;
        private System.Windows.Forms.Label lbl_Email;
        private System.Windows.Forms.TextBox tbox_Email;
        private System.Windows.Forms.Button btn_Confirmar;
        private System.Windows.Forms.Button btn_Cancelar;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.lbl_Titulo = new System.Windows.Forms.Label();
            this.lbl_Email = new System.Windows.Forms.Label();
            this.tbox_Email = new System.Windows.Forms.TextBox();
            this.btn_Confirmar = new System.Windows.Forms.Button();
            this.btn_Cancelar = new System.Windows.Forms.Button();
            this.SuspendLayout();

            // 
            // lbl_Titulo
            // 
            this.lbl_Titulo.AutoSize = true;
            this.lbl_Titulo.Font = new System.Drawing.Font("Segoe UI", 14F, System.Drawing.FontStyle.Bold);
            this.lbl_Titulo.ForeColor = System.Drawing.Color.LimeGreen;
            this.lbl_Titulo.Location = new System.Drawing.Point(20, 20);
            this.lbl_Titulo.Name = "lbl_Titulo";
            this.lbl_Titulo.Size = new System.Drawing.Size(203, 25);
            this.lbl_Titulo.Text = "Validação de Licença";

            // 
            // lbl_Email
            // 
            this.lbl_Email.AutoSize = true;
            this.lbl_Email.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.lbl_Email.ForeColor = System.Drawing.Color.WhiteSmoke;
            this.lbl_Email.Location = new System.Drawing.Point(22, 74);
            this.lbl_Email.Name = "lbl_Email";
            this.lbl_Email.Size = new System.Drawing.Size(50, 19);
            this.lbl_Email.Text = "E-mail:";

            // 
            // tbox_Email
            // 
            this.tbox_Email.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.tbox_Email.Location = new System.Drawing.Point(22, 96);
            this.tbox_Email.Name = "tbox_Email";
            this.tbox_Email.Size = new System.Drawing.Size(290, 25);

            // 
            // btn_Confirmar
            // 
            this.btn_Confirmar.BackColor = System.Drawing.Color.LimeGreen;
            this.btn_Confirmar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_Confirmar.ForeColor = System.Drawing.Color.Black;
            this.btn_Confirmar.Location = new System.Drawing.Point(145, 150);
            this.btn_Confirmar.Name = "btn_Confirmar";
            this.btn_Confirmar.Size = new System.Drawing.Size(80, 32);
            this.btn_Confirmar.Text = "Confirmar";
            this.btn_Confirmar.UseVisualStyleBackColor = false;
            this.btn_Confirmar.Click += new System.EventHandler(this.btn_Confirmar_Click);

            // 
            // btn_Cancelar
            // 
            this.btn_Cancelar.BackColor = System.Drawing.Color.Gray;
            this.btn_Cancelar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_Cancelar.ForeColor = System.Drawing.Color.White;
            this.btn_Cancelar.Location = new System.Drawing.Point(232, 150);
            this.btn_Cancelar.Name = "btn_Cancelar";
            this.btn_Cancelar.Size = new System.Drawing.Size(80, 32);
            this.btn_Cancelar.Text = "Cancelar";
            this.btn_Cancelar.UseVisualStyleBackColor = false;
            this.btn_Cancelar.Click += new System.EventHandler(this.btn_Cancelar_Click);

            // 
            // frm_License
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(28, 28, 28);
            this.ClientSize = new System.Drawing.Size(340, 210);
            this.Controls.Add(this.btn_Cancelar);
            this.Controls.Add(this.btn_Confirmar);
            this.Controls.Add(this.tbox_Email);
            this.Controls.Add(this.lbl_Email);
            this.Controls.Add(this.lbl_Titulo);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.Name = "frm_License";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Licença OverlayCraft";
            this.ResumeLayout(false);
            this.PerformLayout();
        }
    }
}