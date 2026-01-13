using System.Drawing;

namespace OverlayCraft
{
    partial class frm_Overlay
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Label lb_Info;
        private System.Windows.Forms.Panel pnl_Rodape;
        private System.Windows.Forms.Button btn_Config;
        private System.Windows.Forms.Button btn_Close;
        private System.Windows.Forms.PictureBox picbox_Logo;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code
        private void InitializeComponent()
        {
            this.lb_Info = new System.Windows.Forms.Label();
            this.pnl_Rodape = new System.Windows.Forms.Panel();
            this.btn_Config = new System.Windows.Forms.Button();
            this.btn_Close = new System.Windows.Forms.Button();
            this.picbox_Logo = new System.Windows.Forms.PictureBox();
            this.pnl_Drag = new System.Windows.Forms.Panel();
            this.btn_Toggle = new System.Windows.Forms.Button();
            this.pnl_Rodape.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.picbox_Logo)).BeginInit();
            this.pnl_Drag.SuspendLayout();
            this.SuspendLayout();
            // 
            // lb_Info
            // 
            this.lb_Info.AutoSize = true;
            this.lb_Info.Font = new System.Drawing.Font("Arial", 10F);
            this.lb_Info.ForeColor = System.Drawing.Color.Lime;
            this.lb_Info.Location = new System.Drawing.Point(11, 11);
            this.lb_Info.Margin = new System.Windows.Forms.Padding(10);
            this.lb_Info.Name = "lb_Info";
            this.lb_Info.Size = new System.Drawing.Size(0, 19);
            this.lb_Info.TabIndex = 0;
            this.lb_Info.UseCompatibleTextRendering = true;
            this.lb_Info.MouseDown += new System.Windows.Forms.MouseEventHandler(this.ArrastarJanela);
            this.lb_Info.MouseEnter += new System.EventHandler(this.frm_Overlay_MouseEnter);
            this.lb_Info.MouseLeave += new System.EventHandler(this.frm_Overlay_MouseLeave);
            // 
            // pnl_Rodape
            // 
            this.pnl_Rodape.BackColor = System.Drawing.Color.Transparent;
            this.pnl_Rodape.Controls.Add(this.btn_Config);
            this.pnl_Rodape.Controls.Add(this.btn_Close);
            this.pnl_Rodape.Controls.Add(this.picbox_Logo);
            this.pnl_Rodape.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.pnl_Rodape.Location = new System.Drawing.Point(0, 255);
            this.pnl_Rodape.Margin = new System.Windows.Forms.Padding(0);
            this.pnl_Rodape.Name = "pnl_Rodape";
            this.pnl_Rodape.Size = new System.Drawing.Size(400, 50);
            this.pnl_Rodape.TabIndex = 1;
            this.pnl_Rodape.MouseDown += new System.Windows.Forms.MouseEventHandler(this.ArrastarJanela);
            // 
            // btn_Config
            // 
            this.btn_Config.BackColor = System.Drawing.Color.Transparent;
            this.btn_Config.Dock = System.Windows.Forms.DockStyle.Right;
            this.btn_Config.FlatAppearance.BorderSize = 0;
            this.btn_Config.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_Config.Font = new System.Drawing.Font("Segoe UI Symbol", 11F, System.Drawing.FontStyle.Bold);
            this.btn_Config.ForeColor = System.Drawing.Color.Lime;
            this.btn_Config.Location = new System.Drawing.Point(350, 0);
            this.btn_Config.Name = "btn_Config";
            this.btn_Config.Size = new System.Drawing.Size(50, 50);
            this.btn_Config.TabIndex = 0;
            this.btn_Config.Text = "⚙";
            this.btn_Config.UseVisualStyleBackColor = false;
            this.btn_Config.Click += new System.EventHandler(this.btn_Config_Click);
            // 
            // btn_Close
            // 
            this.btn_Close.BackColor = System.Drawing.Color.Transparent;
            this.btn_Close.FlatAppearance.BorderSize = 0;
            this.btn_Close.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btn_Close.Font = new System.Drawing.Font("Segoe UI Symbol", 11F, System.Drawing.FontStyle.Bold);
            this.btn_Close.ForeColor = System.Drawing.Color.Lime;
            this.btn_Close.Location = new System.Drawing.Point(297, 2);
            this.btn_Close.Name = "btn_Close";
            this.btn_Close.Size = new System.Drawing.Size(48, 47);
            this.btn_Close.TabIndex = 1;
            this.btn_Close.Text = "✕";
            this.btn_Close.UseVisualStyleBackColor = false;
            this.btn_Close.Click += new System.EventHandler(this.btn_Close_Click);
            // 
            // picbox_Logo
            // 
            this.picbox_Logo.BackColor = System.Drawing.Color.Transparent;
            this.picbox_Logo.Image = global::OverlayCraft.Properties.Resources.Logo_Overlay;
            this.picbox_Logo.Location = new System.Drawing.Point(15, 8);
            this.picbox_Logo.Name = "picbox_Logo";
            this.picbox_Logo.Size = new System.Drawing.Size(185, 35);
            this.picbox_Logo.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            this.picbox_Logo.TabIndex = 2;
            this.picbox_Logo.TabStop = false;
            this.picbox_Logo.MouseDown += new System.Windows.Forms.MouseEventHandler(this.ArrastarJanela);
            // 
            // pnl_Drag
            // 
            this.pnl_Drag.BackColor = System.Drawing.Color.Transparent;
            this.pnl_Drag.Controls.Add(this.lb_Info);
            this.pnl_Drag.Dock = System.Windows.Forms.DockStyle.Fill;
            this.pnl_Drag.Location = new System.Drawing.Point(0, 0);
            this.pnl_Drag.Name = "pnl_Drag";
            this.pnl_Drag.Size = new System.Drawing.Size(400, 255);
            this.pnl_Drag.TabIndex = 2;
            this.pnl_Drag.MouseDown += new System.Windows.Forms.MouseEventHandler(this.ArrastarJanela);
            this.pnl_Drag.MouseEnter += new System.EventHandler(this.frm_Overlay_MouseEnter);
            this.pnl_Drag.MouseLeave += new System.EventHandler(this.frm_Overlay_MouseLeave);
            // 
            // btn_Toggle
            // 
            this.btn_Toggle.Dock = System.Windows.Forms.DockStyle.Right;
            this.btn_Toggle.Location = new System.Drawing.Point(350, 0);
            this.btn_Toggle.Name = "btn_Toggle";
            this.btn_Toggle.Size = new System.Drawing.Size(50, 255);
            this.btn_Toggle.TabIndex = 3;
            this.btn_Toggle.UseVisualStyleBackColor = true;
            this.btn_Toggle.Click += new System.EventHandler(this.btn_Toggle_Click);
            // 
            // frm_Overlay
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.ClientSize = new System.Drawing.Size(400, 305);
            this.Controls.Add(this.btn_Toggle);
            this.Controls.Add(this.pnl_Drag);
            this.Controls.Add(this.pnl_Rodape);
            this.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Margin = new System.Windows.Forms.Padding(10);
            this.Name = "frm_Overlay";
            this.Opacity = 0.9D;
            this.ShowInTaskbar = false;
            this.StartPosition = System.Windows.Forms.FormStartPosition.Manual;
            this.Text = "OverlayCraft";
            this.TopMost = true;
            this.Load += new System.EventHandler(this.frm_Overlay_Load);
            this.MouseDown += new System.Windows.Forms.MouseEventHandler(this.ArrastarJanela);
            this.pnl_Rodape.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.picbox_Logo)).EndInit();
            this.pnl_Drag.ResumeLayout(false);
            this.pnl_Drag.PerformLayout();
            this.ResumeLayout(false);

        }
        #endregion

        private System.Windows.Forms.Panel pnl_Drag;
        private System.Windows.Forms.Button btn_Toggle;
    }
}



