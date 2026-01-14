
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Linq;
using System.Management.Instrumentation;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace OverlayCraft
{
    public partial class frm_Analogico : Form
    {
        //public static frm_Analogico Instancia { get; private set; }
        public static Dictionary<string, frm_Analogico> Instancias = new Dictionary<string, frm_Analogico>();
        //public static readonly Dictionary<string, frm_Analogico> Instancias = new Dictionary<string, frm_Analogico>();
        
        private string tipoMedicao;
        private PerformanceCounter contador;
        private bool primeiraLeitura = true;

        //Botão direito sobre o frm
        private ContextMenuStrip menuContexto;

        private float valorMin;
        private float valorMax;
        private float valorAtual;
        private Timer animacao;
        private float valorAnimado;

        private bool dragging = false;
        private Point dragCursorPoint;
        private Point dragFormPoint;


        public frm_Analogico(float min, float max, float valor, string tipo)
        {

            InitializeComponent();

            // 🔹 Menu de contexto com botão direito
            menuContexto = new ContextMenuStrip();
            menuContexto.Items.Add("Fechar", null, (s, e) => this.Close());

            // Associa o menu ao formulário
            this.ContextMenuStrip = menuContexto;

            animacao = new Timer();
            animacao.Interval = 150; // 20 fps para suavização (~50ms)
            animacao.Tick += AnimarPonteiro;
            animacao.Enabled = true; // ✅ inicia ativo

            if (Instancias.ContainsKey(tipo))
            {
                try { Instancias[tipo].Close(); } catch { }
                Instancias.Remove(tipo);
            }
            Instancias[tipo] = this;
            DoubleBuffered = true;
            valorMin = min;
            valorMax = max;
            valorAtual = valor;
            valorAnimado = min;
            tipoMedicao = tipo.ToUpper();

            this.Text = $"USO {tipoMedicao}";
            this.Width = 133;
            this.Height = 133;
            this.BackColor = Color.White;
            this.Opacity = 0.9;

            // Seleciona o contador conforme o tipo
            try
            {
                switch (tipoMedicao)
                {
                    case "CPU":
                        {
                            contador = new PerformanceCounter("Processor", "% Processor Time", "_Total");
                            break;
                        }
                    case "GPU":
                        {
                            contador = null; // ✅ evita crash em GPU onboard
                            // Requer Windows 10+ com GPU compatível
                            break;
                        }
                    case "RAM":
                        {
                            contador = new PerformanceCounter("Memory", "% Committed Bytes In Use");
                            break;
                        }
                }
            }
            catch { contador = null; }

            animacao = new Timer();
            animacao.Interval = 2000;
            animacao.Tick += AtualizarMedicao;
            animacao.Start();
        }

        private void AtualizarMedicao(object sender, EventArgs e)
        {
            if (contador == null) return;

            try
            {
                float valor = contador.NextValue();
                AtualizarValor(valor);
            }
            catch
            {
                AtualizarValor(0);
            }
        }

        public void AtualizarValor(float novoValor)
        {
            //// Mantém valor dentro do intervalo
            //valorAtual = Math.Max(valorMin, Math.Min(valorMax, novoValor));
            //
            //// Se o timer parou por algum motivo, religa
            //if (animacao == null)
            //{
            //    animacao = new Timer();
            //    animacao.Interval = 250;
            //    animacao.Tick += AnimarPonteiro;
            //    animacao.Enabled = true;
            //}
            //else if (!animacao.Enabled)
            //{
            //    animacao.Start();
            //}

            if (tipoMedicao == "GPU" || tipoMedicao == "CPU" || tipoMedicao == "RAM")
            {
                novoValor = Math.Max(0, Math.Min(100, novoValor));
            }
                

            valorAtual = novoValor;

            if (animacao == null)
            {
                animacao = new Timer();
                animacao.Interval = 250;
                animacao.Tick += AnimarPonteiro;
                animacao.Enabled = true;
            }
            else if (!animacao.Enabled)
            {
                animacao.Start();
            }

            // Força redesenho imediato
            Invalidate();
        }

        private void AnimarPonteiro(object sender, EventArgs e)
        {
            // Mantém o valor suavizado, mas garante atualização contínua
            valorAnimado += (valorAtual - valorAnimado) * 0.2f;

            // Força repintura constante
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        
            int raio = Math.Min(Width, Height) / 2 - 20;
            Point centro = new Point(Width / 2, Height / 2);
        
            // Arco colorido de fundo
            using (LinearGradientBrush brush = new LinearGradientBrush(
                new Rectangle(centro.X - raio, centro.Y - raio, raio * 2, raio * 2),
                Color.Lime, Color.Red, LinearGradientMode.ForwardDiagonal))
            {
                using (Pen p = new Pen(brush, 10))
                {
                    g.DrawArc(p, centro.X - raio, centro.Y - raio, raio * 2, raio * 2, 135, 270);
                }
            }
        
            // Ângulo do ponteiro
            float angulo = 135 + (270 * (valorAnimado - valorMin) / (valorMax - valorMin));
            double rad = angulo * Math.PI / 180;
            int x = centro.X + (int)(Math.Cos(rad) * (raio - 5));
            int y = centro.Y + (int)(Math.Sin(rad) * (raio - 5));
        
            // Ponteiro
            g.DrawLine(new Pen(Color.Cyan, 4), centro, new Point(x, y));
        
            // Valor numérico
            string texto = valorAnimado.ToString("0.0");
            Font fonte = new Font("Orbitron", 20, FontStyle.Regular);
            SizeF sz = g.MeasureString(texto, fonte);
            
            g.DrawString(texto, fonte, Brushes.Black, centro.X - sz.Width / 2, centro.Y - sz.Height / 2);
        
            // Título
            g.DrawString(tipoMedicao, new Font("Segoe UI", 10, FontStyle.Bold), Brushes.Gray, centro.X - 15, centro.Y + raio / 2);
        
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            base.OnMouseDown(e);
            if (e.Button == MouseButtons.Left)
            {
                dragging = true;
                dragCursorPoint = Cursor.Position;
                dragFormPoint = this.Location;
            }
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            if (dragging)
            {
                Point dif = Point.Subtract(Cursor.Position, new Size(dragCursorPoint));
                this.Location = Point.Add(dragFormPoint, new Size(dif));
            }
        }

        protected override void OnMouseUp(MouseEventArgs e)
        {
            base.OnMouseUp(e);
            if (e.Button == MouseButtons.Left)
                dragging = false;
        }


    }
}
