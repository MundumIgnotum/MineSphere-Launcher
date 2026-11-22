using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace MineSphere
{
    internal static class Program
    {
        private static Mutex _mutex;

        [STAThread]
        private static void Main()
        {
            bool created;
            _mutex = new Mutex(true, "MineSphereLauncherDesktop", out created);
            if (!created)
            {
                MessageBox.Show(
                    "O MineSphere Launcher já está aberto.",
                    "MineSphere",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
            bool portable = File.Exists(Path.Combine(appDir, "portable.txt"));
            string dataHome = portable
                ? appDir
                : Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "MineSphere");

            try
            {
                Directory.CreateDirectory(dataHome);
                Directory.CreateDirectory(Path.Combine(dataHome, "data"));
                Directory.CreateDirectory(Path.Combine(dataHome, "game"));
                Directory.CreateDirectory(Path.Combine(dataHome, "instances"));
                Directory.CreateDirectory(Path.Combine(dataHome, "runtime"));
                Directory.CreateDirectory(Path.Combine(dataHome, "logs"));
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    "Não foi possível preparar a pasta de dados:\n\n" + dataHome + "\n\n" + error.Message,
                    "MineSphere",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return;
            }

            string node = Path.Combine(appDir, "runtime", "node", "node.exe");
            string server = Path.Combine(appDir, "server.js");
            if (!File.Exists(node) || !File.Exists(server))
            {
                MessageBox.Show(
                    "A instalação está incompleta.\n\nFalta o runtime Node.js ou o ficheiro server.js em:\n" + appDir,
                    "MineSphere",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return;
            }

            ServerProcess serverProcess = new ServerProcess(node, server, appDir, dataHome);
            try
            {
                serverProcess.Start();
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    "Não foi possível iniciar o servidor local.\n\n" + error.Message,
                    "MineSphere",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                serverProcess.Dispose();
                return;
            }

            try
            {
                Application.Run(new MainForm(serverProcess, dataHome, portable));
            }
            finally
            {
                serverProcess.Dispose();
                GC.KeepAlive(_mutex);
            }
        }
    }

    internal sealed class ServerProcess : IDisposable
    {
        private readonly Process _process;
        private readonly string _logPath;
        private readonly object _sync = new object();
        private readonly StringBuilder _tail = new StringBuilder();
        private readonly ManualResetEventSlim _ready = new ManualResetEventSlim(false);
        private string _url;
        private bool _disposed;

        public ServerProcess(string node, string server, string appDir, string dataHome)
        {
            _logPath = Path.Combine(dataHome, "logs", "desktop.log");
            int port = FindFreePort();

            ProcessStartInfo info = new ProcessStartInfo();
            info.FileName = node;
            info.Arguments = "\"" + server + "\" --no-open --parent-pid " + Process.GetCurrentProcess().Id;
            info.WorkingDirectory = appDir;
            info.UseShellExecute = false;
            info.CreateNoWindow = true;
            info.RedirectStandardOutput = true;
            info.RedirectStandardError = true;
            info.RedirectStandardInput = true;
            info.StandardOutputEncoding = Encoding.UTF8;
            info.StandardErrorEncoding = Encoding.UTF8;
            info.EnvironmentVariables["MINESPHERE_HOME"] = dataHome;
            info.EnvironmentVariables["MINESPHERE_PORT"] = port.ToString();
            info.EnvironmentVariables["MINESPHERE_DESKTOP"] = "1";

            _process = new Process();
            _process.StartInfo = info;
            _process.EnableRaisingEvents = true;
            _process.OutputDataReceived += OnData;
            _process.ErrorDataReceived += OnData;
        }

        public string Url
        {
            get
            {
                lock (_sync) return _url;
            }
        }

        public void Start()
        {
            AppendLine("=== MineSphere Desktop " + BuildInfo.Version + " ===");
            AppendLine(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
            _process.Start();
            _process.BeginOutputReadLine();
            _process.BeginErrorReadLine();
        }

        public string WaitForUrl(int timeoutMs)
        {
            _ready.Wait(timeoutMs);
            lock (_sync) return _url;
        }

        public string Tail(int maximum)
        {
            lock (_sync)
            {
                if (_tail.Length <= maximum) return _tail.ToString();
                return _tail.ToString(_tail.Length - maximum, maximum);
            }
        }

        private void OnData(object sender, DataReceivedEventArgs eventArgs)
        {
            if (eventArgs.Data == null) return;
            AppendLine(eventArgs.Data);
            Match match = Regex.Match(eventArgs.Data, @"http://127\.0\.0\.1:\d+");
            if (match.Success)
            {
                lock (_sync) _url = match.Value;
                _ready.Set();
            }
        }

        private void AppendLine(string line)
        {
            lock (_sync)
            {
                _tail.AppendLine(line);
                if (_tail.Length > 16000) _tail.Remove(0, _tail.Length - 12000);
                try
                {
                    File.AppendAllText(_logPath, line + Environment.NewLine, Encoding.UTF8);
                }
                catch
                {
                    /* the log is best effort */
                }
            }
        }

        private static int FindFreePort()
        {
            TcpListener listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            int port = ((IPEndPoint)listener.LocalEndpoint).Port;
            listener.Stop();
            return port;
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            try
            {
                if (!_process.HasExited)
                {
                    _process.Kill();
                    _process.WaitForExit(3000);
                }
            }
            catch
            {
                /* the process may already be gone */
            }
            try
            {
                _process.Dispose();
            }
            catch
            {
                /* ignore */
            }
            _ready.Dispose();
        }
    }

    internal sealed class MainForm : Form
    {
        private readonly ServerProcess _server;
        private readonly string _dataHome;
        private readonly bool _portable;
        private WebView2 _webView;
        private Label _status;
        private ProgressBar _progress;
        private Panel _content;
        private MenuStrip _menu;

        public MainForm(ServerProcess server, string dataHome, bool portable)
        {
            _server = server;
            _dataHome = dataHome;
            _portable = portable;

            Text = "MineSphere Launcher";
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(1480, 920);
            MinimumSize = new Size(1060, 700);
            BackColor = Color.FromArgb(8, 12, 20);
            ForeColor = Color.FromArgb(232, 244, 255);
            try
            {
                Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch
            {
                /* use the default icon */
            }

            BuildMenu();
            BuildLoading();
            Shown += OnShown;
            FormClosing += OnClosing;
        }

        private void BuildMenu()
        {
            _menu = new MenuStrip();
            _menu.BackColor = Color.FromArgb(12, 19, 30);
            _menu.ForeColor = Color.FromArgb(232, 244, 255);

            ToolStripMenuItem launcher = new ToolStripMenuItem("Launcher");
            ToolStripMenuItem reload = new ToolStripMenuItem("Recarregar");
            reload.Click += delegate
            {
                if (_webView != null && _webView.CoreWebView2 != null) _webView.CoreWebView2.Reload();
            };
            ToolStripMenuItem openData = new ToolStripMenuItem("Abrir pasta de dados");
            openData.Click += delegate { OpenPath(_dataHome); };
            ToolStripMenuItem exit = new ToolStripMenuItem("Sair");
            exit.Click += delegate { Close(); };
            launcher.DropDownItems.Add(reload);
            launcher.DropDownItems.Add(openData);
            launcher.DropDownItems.Add(new ToolStripSeparator());
            launcher.DropDownItems.Add(exit);

            ToolStripMenuItem help = new ToolStripMenuItem("Ajuda");
            ToolStripMenuItem website = new ToolStripMenuItem("Website");
            website.Click += delegate { OpenExternal("https://mundumignotum.github.io/MineSphere-Launcher/"); };
            ToolStripMenuItem about = new ToolStripMenuItem("Sobre");
            about.Click += delegate
            {
                MessageBox.Show(
                    "MineSphere Launcher " + BuildInfo.Version + "\n\n" +
                    (_portable ? "Edição portátil" : "Edição instalada") + "\n" +
                    "Dados: " + _dataHome + "\n\n" +
                    "Launcher open source para Minecraft Java Edition.\n" +
                    "Licença MIT. Não afiliado com a Microsoft ou a Mojang.",
                    "Sobre o MineSphere",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            };
            help.DropDownItems.Add(website);
            help.DropDownItems.Add(about);

            _menu.Items.Add(launcher);
            _menu.Items.Add(help);
        }

        private void BuildLoading()
        {
            _content = new Panel();
            _content.Dock = DockStyle.Fill;
            _content.BackColor = BackColor;

            _status = new Label();
            _status.Dock = DockStyle.Fill;
            _status.TextAlign = ContentAlignment.MiddleCenter;
            _status.Font = new Font("Segoe UI", 14f, FontStyle.Regular);
            _status.ForeColor = Color.FromArgb(125, 243, 201);
            _status.Text = "A iniciar o MineSphere...";

            _progress = new ProgressBar();
            _progress.Dock = DockStyle.Bottom;
            _progress.Height = 5;
            _progress.Style = ProgressBarStyle.Marquee;
            _progress.MarqueeAnimationSpeed = 28;

            _content.Controls.Add(_status);
            _content.Controls.Add(_progress);
            Controls.Add(_content);
            Controls.Add(_menu);
            MainMenuStrip = _menu;
        }

        private async void OnShown(object sender, EventArgs eventArgs)
        {
            string url = await Task.Run(() => _server.WaitForUrl(60000));
            if (string.IsNullOrEmpty(url))
            {
                ShowFailure("O servidor local não respondeu a tempo.");
                return;
            }

            await InitializeWebView(url);
        }

        private async Task InitializeWebView(string url)
        {
            try
            {
                string userData = Path.Combine(_dataHome, "webview2");
                Directory.CreateDirectory(userData);
                CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(null, userData, null);

                _webView = new WebView2();
                _webView.Dock = DockStyle.Fill;
                _webView.Visible = false;
                _webView.DefaultBackgroundColor = Color.FromArgb(8, 12, 20);
                _content.Controls.Add(_webView);
                _webView.BringToFront();
                await _webView.EnsureCoreWebView2Async(environment);

                CoreWebView2 core = _webView.CoreWebView2;
                core.Settings.AreDefaultContextMenusEnabled = false;
                core.Settings.AreDevToolsEnabled = false;
                core.Settings.IsStatusBarEnabled = false;
                core.Settings.AreBrowserAcceleratorKeysEnabled = false;
                core.Settings.IsZoomControlEnabled = true;
                core.NewWindowRequested += OnNewWindowRequested;
                core.NavigationStarting += OnNavigationStarting;
                core.NavigationCompleted += OnNavigationCompleted;

                _webView.Source = new Uri(url);
            }
            catch (WebView2RuntimeNotFoundException)
            {
                ShowWebViewMissing();
            }
            catch (Exception error)
            {
                ShowFailure(error.Message);
            }
        }

        private void OnNavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs eventArgs)
        {
            if (!eventArgs.IsSuccess)
            {
                ShowFailure("A interface não carregou (" + eventArgs.WebErrorStatus + ").");
                return;
            }
            _status.Visible = false;
            _progress.Visible = false;
            _webView.Visible = true;
        }

        private void OnNavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs eventArgs)
        {
            if (eventArgs.Uri.StartsWith("http://127.0.0.1:", StringComparison.OrdinalIgnoreCase) ||
                eventArgs.Uri.StartsWith("https://127.0.0.1:", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
            eventArgs.Cancel = true;
            OpenExternal(eventArgs.Uri);
        }

        private void OnNewWindowRequested(object sender, CoreWebView2NewWindowRequestedEventArgs eventArgs)
        {
            eventArgs.Handled = true;
            OpenExternal(eventArgs.Uri);
        }

        private void ShowFailure(string detail)
        {
            _progress.Visible = false;
            _status.Visible = true;
            _status.Text =
                "Não foi possível iniciar o MineSphere.\n\n" +
                (detail ?? "Erro desconhecido.") +
                "\n\nConsulta o registo:\n" + Path.Combine(_dataHome, "logs", "desktop.log");
        }

        private void ShowWebViewMissing()
        {
            DialogResult answer = MessageBox.Show(
                "O Microsoft Edge WebView2 Runtime não está instalado.\n\n" +
                "É necessário para mostrar a interface numa janela própria. " +
                "Queres abrir a página oficial de download?",
                "MineSphere",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning);
            if (answer == DialogResult.Yes)
            {
                OpenExternal("https://go.microsoft.com/fwlink/p/?LinkId=2124703");
            }
            Close();
        }

        private void OnClosing(object sender, FormClosingEventArgs eventArgs)
        {
            try
            {
                if (_webView != null) _webView.Dispose();
            }
            catch
            {
                /* ignore */
            }
            _server.Dispose();
        }

        private static void OpenPath(string path)
        {
            try
            {
                Process.Start(new ProcessStartInfo("explorer.exe", "\"" + path + "\"") { UseShellExecute = true });
            }
            catch
            {
                /* ignore */
            }
        }

        private static void OpenExternal(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch
            {
                /* ignore */
            }
        }
    }
}
