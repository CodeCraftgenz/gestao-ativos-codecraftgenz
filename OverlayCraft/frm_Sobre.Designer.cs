namespace OverlayCraft
{
    partial class frm_Sobre
    {
        private System.ComponentModel.IContainer components = null;

        private System.Windows.Forms.Label lbl_Titulo;
        private System.Windows.Forms.Label lbl_Subtitulo;
        private System.Windows.Forms.Label lbl_Descricao;
        private System.Windows.Forms.Label lbl_Licenca;
        private System.Windows.Forms.Label lbl_Desenvolvedor;
        private System.Windows.Forms.Label lbl_Versao;
        private System.Windows.Forms.LinkLabel lnk_Site;
        private System.Windows.Forms.Button btn_Fechar;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();

            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.lbl_Titulo = new System.Windows.Forms.Label();
            this.lbl_Subtitulo = new System.Windows.Forms.Label();
            this.lbl_Descricao = new System.Windows.Forms.Label();
            this.lbl_Licenca = new System.Windows.Forms.Label();
            this.lbl_Desenvolvedor = new System.Windows.Forms.Label();
            this.lbl_Versao = new System.Windows.Forms.Label();
            this.lnk_Site = new System.Windows.Forms.LinkLabel();
            this.btn_Fechar = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // lbl_Titulo
            // 
            this.lbl_Titulo.AutoSize = true;
            this.lbl_Titulo.Font = new System.Drawing.Font("Segoe UI", 20F, System.Drawing.FontStyle.Bold);
            this.lbl_Titulo.ForeColor = System.Drawing.Color.LimeGreen;
            this.lbl_Titulo.Location = new System.Drawing.Point(21, 17);
            this.lbl_Titulo.Name = "lbl_Titulo";
            this.lbl_Titulo.Size = new System.Drawing.Size(181, 37);
            this.lbl_Titulo.TabIndex = 0;
            this.lbl_Titulo.Text = "OverlayCraft";
            // 
            // lbl_Subtitulo
            // 
            this.lbl_Subtitulo.AutoSize = true;
            this.lbl_Subtitulo.Font = new System.Drawing.Font("Segoe UI", 10F, System.Drawing.FontStyle.Italic);
            this.lbl_Subtitulo.ForeColor = System.Drawing.Color.WhiteSmoke;
            this.lbl_Subtitulo.Location = new System.Drawing.Point(24, 54);
            this.lbl_Subtitulo.Name = "lbl_Subtitulo";
            this.lbl_Subtitulo.Size = new System.Drawing.Size(239, 19);
            this.lbl_Subtitulo.TabIndex = 1;
            this.lbl_Subtitulo.Text = "Painel Inteligente de Monitoramento";
            // 
            // lbl_Descricao
            // 
            this.lbl_Descricao.Font = new System.Drawing.Font("Segoe UI", 10F);
            this.lbl_Descricao.ForeColor = System.Drawing.Color.Gainsboro;
            this.lbl_Descricao.Location = new System.Drawing.Point(24, 82);
            this.lbl_Descricao.Name = "lbl_Descricao";
            this.lbl_Descricao.Size = new System.Drawing.Size(403, 104);
            this.lbl_Descricao.TabIndex = 2;
            this.lbl_Descricao.Text = "Descricao do software";
            // 
            // lbl_Licenca
            // 
            this.lbl_Licenca.AutoSize = true;
            this.lbl_Licenca.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.lbl_Licenca.ForeColor = System.Drawing.Color.Silver;
            this.lbl_Licenca.Location = new System.Drawing.Point(24, 199);
            this.lbl_Licenca.Name = "lbl_Licenca";
            this.lbl_Licenca.Size = new System.Drawing.Size(164, 15);
            this.lbl_Licenca.TabIndex = 3;
            this.lbl_Licenca.Text = "Licenca protegida por direitos";
            // 
            // lbl_Desenvolvedor
            // 
            this.lbl_Desenvolvedor.AutoSize = true;
            this.lbl_Desenvolvedor.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.lbl_Desenvolvedor.ForeColor = System.Drawing.Color.WhiteSmoke;
            this.lbl_Desenvolvedor.Location = new System.Drawing.Point(24, 221);
            this.lbl_Desenvolvedor.Name = "lbl_Desenvolvedor";
            this.lbl_Desenvolvedor.Size = new System.Drawing.Size(197, 15);
            this.lbl_Desenvolvedor.TabIndex = 4;
            this.lbl_Desenvolvedor.Text = "Desenvolvido por CodeCraft GenZ";
            // 
            // lbl_Versao
            // 
            this.lbl_Versao.AutoSize = true;
            this.lbl_Versao.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.lbl_Versao.ForeColor = System.Drawing.Color.WhiteSmoke;
            this.lbl_Versao.Location = new System.Drawing.Point(24, 243);
            this.lbl_Versao.Name = "lbl_Versao";
            this.lbl_Versao.Size = new System.Drawing.Size(73, 15);
            this.lbl_Versao.TabIndex = 5;
            this.lbl_Versao.Text = "Versao: FULL";
            // 
            // lnk_Site
            // 
            this.lnk_Site.AutoSize = true;
            this.lnk_Site.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Underline);
            this.lnk_Site.LinkColor = System.Drawing.Color.LimeGreen;
            this.lnk_Site.Location = new System.Drawing.Point(24, 269);
            this.lnk_Site.Name = "lnk_Site";
            this.lnk_Site.Size = new System.Drawing.Size(153, 15);
            this.lnk_Site.TabIndex = 6;
            this.lnk_Site.TabStop = true;
            this.lnk_Site.Text = "www.codecraftgenz.com.br";
            this.lnk_Site.LinkClicked += new System.Windows.Forms.LinkLabelLinkClickedEventHandler(this.lnk_Site_LinkClicked);
            // 
            // btn_Fechar
            // 
            this.btn_Fechar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(45)))), ((int)(((byte)(45)))), ((int)(((byte)(45)))));
            this.btn_Fechar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_Fechar.Font = new System.Drawing.Font("Segoe UI", 9F, System.Drawing.FontStyle.Bold);
            this.btn_Fechar.ForeColor = System.Drawing.Color.White;
            this.btn_Fechar.Location = new System.Drawing.Point(360, 290);
            this.btn_Fechar.Name = "btn_Fechar";
            this.btn_Fechar.Size = new System.Drawing.Size(67, 26);
            this.btn_Fechar.TabIndex = 7;
            this.btn_Fechar.Text = "Fechar";
            this.btn_Fechar.UseVisualStyleBackColor = false;
            this.btn_Fechar.Click += new System.EventHandler(this.btn_Fechar_Click);
            // 
            // frm_Sobre
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(30)))), ((int)(((byte)(30)))), ((int)(((byte)(30)))));
            this.ClientSize = new System.Drawing.Size(454, 338);
            this.Controls.Add(this.btn_Fechar);
            this.Controls.Add(this.lnk_Site);
            this.Controls.Add(this.lbl_Versao);
            this.Controls.Add(this.lbl_Desenvolvedor);
            this.Controls.Add(this.lbl_Licenca);
            this.Controls.Add(this.lbl_Descricao);
            this.Controls.Add(this.lbl_Subtitulo);
            this.Controls.Add(this.lbl_Titulo);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "frm_Sobre";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Sobre o OverlayCraft";
            this.Shown += new System.EventHandler(this.frm_Sobre_Shown);
            this.ResumeLayout(false);
            this.PerformLayout();

        }
    }
}
