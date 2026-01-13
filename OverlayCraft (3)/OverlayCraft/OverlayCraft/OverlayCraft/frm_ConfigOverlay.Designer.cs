#define FULL
//#define TRIAL

/*
            |FULL                          |TRIAL
            |Todas as opções marcadas.     |Apenas as opções “Service Tag”, “SO”, “CPU”, “Discos”, “Usuário”  
            | e todos os botões            |marcados, e as demais ENABLED. e o botão CPU e os demais ENABLED.
*/

namespace OverlayCraft
{
    partial class frm_ConfigOverlay
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.CheckedListBox chltbox_Opcoes;
        private System.Windows.Forms.Panel pnl_CorPreview;
        private System.Windows.Forms.Button btn_Cor;
        private System.Windows.Forms.CheckBox chbox_Fade;
        private System.Windows.Forms.Button btn_Salvar;
        private System.Windows.Forms.Label lb_Titulo;
        private System.Windows.Forms.Label lb_Cor;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();
            base.Dispose(disposing);
        }



        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            this.chltbox_Opcoes = new System.Windows.Forms.CheckedListBox();
            this.pnl_CorPreview = new System.Windows.Forms.Panel();
            this.lb_Titulo = new System.Windows.Forms.Label();
            this.lb_Cor = new System.Windows.Forms.Label();
            this.chbox_Fade = new System.Windows.Forms.CheckBox();
            this.btn_Cor = new System.Windows.Forms.Button();
            this.btn_Salvar = new System.Windows.Forms.Button();
            this.btn_UsoCPU = new System.Windows.Forms.Button();
            this.btn_UsoRAM = new System.Windows.Forms.Button();
            this.btn_UsoGPU = new System.Windows.Forms.Button();
            this.panel1 = new System.Windows.Forms.Panel();
            this.btn_Sobre = new System.Windows.Forms.Button();
            this.panel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // chltbox_Opcoes
            // 
            this.chltbox_Opcoes.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(40)))), ((int)(((byte)(40)))), ((int)(((byte)(40)))));
            this.chltbox_Opcoes.CheckOnClick = true;
            this.chltbox_Opcoes.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.chltbox_Opcoes.ForeColor = System.Drawing.Color.Gainsboro;
            this.chltbox_Opcoes.Items.AddRange(new object[] {
            "Mostrar Service Tag",
            "Mostrar Sistema Operacional",
            "Mostrar CPU",
            "Mostrar Discos",
            "Mostrar Usuário",
            "Mostrar CPU por CORE",
            "Mostrar GPU",
            "Mostrar RAM",
            "Mostrar Rede (IP, Gateway)"});
            this.chltbox_Opcoes.Location = new System.Drawing.Point(20, 60);
            this.chltbox_Opcoes.Name = "chltbox_Opcoes";
            this.chltbox_Opcoes.Size = new System.Drawing.Size(318, 256);
            this.chltbox_Opcoes.TabIndex = 1;
            // 
            // pnl_CorPreview
            // 
            this.pnl_CorPreview.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.pnl_CorPreview.Location = new System.Drawing.Point(119, 337);
            this.pnl_CorPreview.Name = "pnl_CorPreview";
            this.pnl_CorPreview.Size = new System.Drawing.Size(40, 25);
            this.pnl_CorPreview.TabIndex = 3;
            // 
            // lb_Titulo
            // 
            this.lb_Titulo.AutoSize = true;
            this.lb_Titulo.Location = new System.Drawing.Point(20, 20);
            this.lb_Titulo.Name = "lb_Titulo";
            this.lb_Titulo.Size = new System.Drawing.Size(218, 15);
            this.lb_Titulo.TabIndex = 0;
            this.lb_Titulo.Text = "Selecione o que deseja exibir no overlay:";
            // 
            // lb_Cor
            // 
            this.lb_Cor.AutoSize = true;
            this.lb_Cor.Location = new System.Drawing.Point(20, 337);
            this.lb_Cor.Name = "lb_Cor";
            this.lb_Cor.Size = new System.Drawing.Size(78, 15);
            this.lb_Cor.TabIndex = 2;
            this.lb_Cor.Text = "Cor da Fonte:";
            // 
            // chbox_Fade
            // 
            this.chbox_Fade.AutoSize = true;
            this.chbox_Fade.BackColor = System.Drawing.Color.Transparent;
            this.chbox_Fade.ForeColor = System.Drawing.Color.Gainsboro;
            this.chbox_Fade.Location = new System.Drawing.Point(20, 372);
            this.chbox_Fade.Name = "chbox_Fade";
            this.chbox_Fade.Size = new System.Drawing.Size(190, 19);
            this.chbox_Fade.TabIndex = 5;
            this.chbox_Fade.Text = "Esmaecer quando o mouse sair";
            this.chbox_Fade.UseVisualStyleBackColor = false;
            // 
            // btn_Cor
            // 
            this.btn_Cor.BackColor = System.Drawing.Color.DimGray;
            this.btn_Cor.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_Cor.ForeColor = System.Drawing.Color.White;
            this.btn_Cor.Location = new System.Drawing.Point(185, 331);
            this.btn_Cor.Name = "btn_Cor";
            this.btn_Cor.Size = new System.Drawing.Size(153, 35);
            this.btn_Cor.TabIndex = 4;
            this.btn_Cor.Text = "Escolher Cor";
            this.btn_Cor.UseVisualStyleBackColor = false;
            // 
            // btn_Salvar
            // 
            this.btn_Salvar.BackColor = System.Drawing.Color.LimeGreen;
            this.btn_Salvar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_Salvar.ForeColor = System.Drawing.Color.Black;
            this.btn_Salvar.Location = new System.Drawing.Point(82, 462);
            this.btn_Salvar.Name = "btn_Salvar";
            this.btn_Salvar.Size = new System.Drawing.Size(97, 35);
            this.btn_Salvar.TabIndex = 6;
            this.btn_Salvar.Text = "Salvar";
            this.btn_Salvar.UseVisualStyleBackColor = false;
            this.btn_Salvar.Click += new System.EventHandler(this.btn_Salvar_Click);
            // 
            // btn_UsoCPU
            // 
            this.btn_UsoCPU.BackColor = System.Drawing.Color.Gray;
            this.btn_UsoCPU.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_UsoCPU.ForeColor = System.Drawing.Color.White;
            this.btn_UsoCPU.Location = new System.Drawing.Point(7, 7);
            this.btn_UsoCPU.Name = "btn_UsoCPU";
            this.btn_UsoCPU.Size = new System.Drawing.Size(97, 38);
            this.btn_UsoCPU.TabIndex = 7;
            this.btn_UsoCPU.Text = "Uso CPU";
            this.btn_UsoCPU.UseVisualStyleBackColor = false;
            this.btn_UsoCPU.Click += new System.EventHandler(this.btn_UsoCPU_Click);
            // 
            // btn_UsoRAM
            // 
            this.btn_UsoRAM.BackColor = System.Drawing.Color.Gray;
            this.btn_UsoRAM.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_UsoRAM.ForeColor = System.Drawing.Color.White;
            this.btn_UsoRAM.Location = new System.Drawing.Point(213, 7);
            this.btn_UsoRAM.Name = "btn_UsoRAM";
            this.btn_UsoRAM.Size = new System.Drawing.Size(97, 38);
            this.btn_UsoRAM.TabIndex = 9;
            this.btn_UsoRAM.Text = "Uso RAM";
            this.btn_UsoRAM.UseVisualStyleBackColor = false;
            this.btn_UsoRAM.Click += new System.EventHandler(this.btn_UsoRAM_Click);
            // 
            // btn_UsoGPU
            // 
            this.btn_UsoGPU.BackColor = System.Drawing.Color.Gray;
            this.btn_UsoGPU.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_UsoGPU.ForeColor = System.Drawing.Color.White;
            this.btn_UsoGPU.Location = new System.Drawing.Point(110, 7);
            this.btn_UsoGPU.Name = "btn_UsoGPU";
            this.btn_UsoGPU.Size = new System.Drawing.Size(97, 38);
            this.btn_UsoGPU.TabIndex = 8;
            this.btn_UsoGPU.Text = "Uso GPU";
            this.btn_UsoGPU.UseVisualStyleBackColor = false;
            this.btn_UsoGPU.Click += new System.EventHandler(this.btn_UsoGPU_Click);
            // 
            // panel1
            // 
            this.panel1.Controls.Add(this.btn_UsoRAM);
            this.panel1.Controls.Add(this.btn_UsoGPU);
            this.panel1.Controls.Add(this.btn_UsoCPU);
            this.panel1.Location = new System.Drawing.Point(20, 401);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(318, 51);
            this.panel1.TabIndex = 8;
            // 
            // btn_Sobre
            // 
            this.btn_Sobre.BackColor = System.Drawing.Color.LimeGreen;
            this.btn_Sobre.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_Sobre.ForeColor = System.Drawing.Color.Black;
            this.btn_Sobre.Location = new System.Drawing.Point(185, 462);
            this.btn_Sobre.Name = "btn_Sobre";
            this.btn_Sobre.Size = new System.Drawing.Size(97, 35);
            this.btn_Sobre.TabIndex = 9;
            this.btn_Sobre.Text = "Sobre";
            this.btn_Sobre.UseVisualStyleBackColor = false;
            this.btn_Sobre.Click += new System.EventHandler(this.btn_Sobre_Click);
            // 
            // frm_ConfigOverlay
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(30)))), ((int)(((byte)(30)))), ((int)(((byte)(30)))));
            this.ClientSize = new System.Drawing.Size(356, 509);
            this.Controls.Add(this.btn_Sobre);
            this.Controls.Add(this.panel1);
            this.Controls.Add(this.lb_Titulo);
            this.Controls.Add(this.chltbox_Opcoes);
            this.Controls.Add(this.lb_Cor);
            this.Controls.Add(this.pnl_CorPreview);
            this.Controls.Add(this.btn_Cor);
            this.Controls.Add(this.chbox_Fade);
            this.Controls.Add(this.btn_Salvar);
            this.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.ForeColor = System.Drawing.Color.Gainsboro;
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "frm_ConfigOverlay";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Configurações do Overlay";
            this.panel1.ResumeLayout(false);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

#endregion
        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Button btn_UsoCPU;
        private System.Windows.Forms.Button btn_UsoRAM;
        private System.Windows.Forms.Button btn_UsoGPU;
        private System.Windows.Forms.Button btn_Sobre;
        //private System.Windows.Forms.Button btn_Sobre;

    }
}