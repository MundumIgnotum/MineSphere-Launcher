using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;

namespace MineSphere
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }

    internal sealed class InstallerForm : Form
    {
        private readonly TextBox _path;
        private readonly CheckBox _desktopShortcut;
        private readonly CheckBox _runAfter;
        private readonly ProgressBar _progress;
        private readonly Label _status;
        private readonly Button _install;
        private readonly Button _cancel;

        public InstallerForm()
        {
            Text = "Instalar MineSphere Launcher";
            ClientSize = new Size(540, 372);
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(10, 16, 24);
            ForeColor = Color.FromArgb(232, 244, 255);
            try
            {
                Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch
            {
                /* default icon */
            }

            Label title = new Label();
            title.Text = "MineSphere Launcher";
            title.Font = new Font("Segoe UI", 18f, FontStyle.Bold);
            title.ForeColor = Color.FromArgb(125, 243, 201);
            title.SetBounds(22, 18, 480, 34);
            Controls.Add(title);

            Label subtitle = new Label();
            subtitle.Text = "Aplicação desktop para Minecraft Java Edition. Sem navegador e com o Node.js incluído.";
            subtitle.ForeColor = Color.FromArgb(170, 186, 204);
            subtitle.SetBounds(22, 54, 480, 38);
            Controls.Add(subtitle);

            Label pathLabel = new Label();
            pathLabel.Text = "Pasta de instalação:";
            pathLabel.ForeColor = Color.FromArgb(210, 224, 238);
            pathLabel.SetBounds(22, 108, 240, 20);
            Controls.Add(pathLabel);

            _path = new TextBox();
            _path.SetBounds(22, 132, 382, 26);
            _path.Text = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs",
                "MineSphere");
            Controls.Add(_path);

            Button browse = new Button();
            browse.Text = "Procurar...";
            browse.SetBounds(414, 130, 100, 28);
            browse.Click += OnBrowse;
            Controls.Add(browse);

            _desktopShortcut = new CheckBox();
            _desktopShortcut.Text = "Criar atalho no ambiente de trabalho";
            _desktopShortcut.Checked = true;
            _desktopShortcut.ForeColor = Color.FromArgb(210, 224, 238);
            _desktopShortcut.SetBounds(22, 174, 450, 24);
            Controls.Add(_desktopShortcut);

            _runAfter = new CheckBox();
            _runAfter.Text = "Abrir o MineSphere depois de instalar";
            _runAfter.Checked = true;
            _runAfter.ForeColor = Color.FromArgb(210, 224, 238);
            _runAfter.SetBounds(22, 200, 450, 24);
            Controls.Add(_runAfter);

            Label note = new Label();
            note.Text = "Os teus dados (contas, instalações e mundos) ficam em %LOCALAPPDATA%\\MineSphere e são mantidos ao desinstalar.";
            note.ForeColor = Color.FromArgb(132, 150, 170);
            note.SetBounds(22, 228, 492, 34);
            Controls.Add(note);

            _progress = new ProgressBar();
            _progress.SetBounds(22, 266, 492, 8);
            _progress.Style = ProgressBarStyle.Marquee;
            _progress.MarqueeAnimationSpeed = 28;
            _progress.Visible = false;
            Controls.Add(_progress);

            _status = new Label();
            _status.Text = "Pronto para instalar.";
            _status.ForeColor = Color.FromArgb(170, 186, 204);
            _status.SetBounds(22, 281, 492, 22);
            Controls.Add(_status);

            _install = new Button();
            _install.Text = "Instalar";
            _install.SetBounds(314, 318, 100, 32);
            _install.Click += OnInstall;
            Controls.Add(_install);

            _cancel = new Button();
            _cancel.Text = "Cancelar";
            _cancel.SetBounds(420, 318, 94, 32);
            _cancel.Click += delegate { Close(); };
            Controls.Add(_cancel);
        }

        private void OnBrowse(object sender, EventArgs eventArgs)
        {
            using (FolderBrowserDialog dialog = new FolderBrowserDialog())
            {
                dialog.Description = "Escolhe a pasta onde instalar o MineSphere Launcher.";
                dialog.SelectedPath = _path.Text;
                if (dialog.ShowDialog(this) == DialogResult.OK) _path.Text = dialog.SelectedPath;
            }
        }

        private async void OnInstall(object sender, EventArgs eventArgs)
        {
            string target;
            try
            {
                target = Path.GetFullPath(_path.Text.Trim());
            }
            catch
            {
                MessageBox.Show(this, "A pasta de instalação não é válida.", "MineSphere", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (target.Length < 4)
            {
                MessageBox.Show(this, "Escolhe uma pasta de instalação válida.", "MineSphere", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            string executable = Path.Combine(target, "MineSphere.exe");
            if (File.Exists(executable))
            {
                DialogResult replace = MessageBox.Show(
                    this,
                    "Já existe uma instalação nesta pasta.\n\nQueres substituir os ficheiros da aplicação? Os dados não são alterados.",
                    "MineSphere",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question);
                if (replace != DialogResult.Yes) return;
            }

            Process[] running = Process.GetProcessesByName("MineSphere");
            if (running.Length > 0)
            {
                MessageBox.Show(
                    this,
                    "Fecha o MineSphere Launcher antes de instalar.",
                    "MineSphere",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
                return;
            }

            _install.Enabled = false;
            _cancel.Enabled = false;
            _path.Enabled = false;
            _desktopShortcut.Enabled = false;
            _runAfter.Enabled = false;
            _progress.Visible = true;
            _status.Text = "A instalar ficheiros...";

            try
            {
                await Task.Run(() => ExtractPayload(target));
                _status.Text = "A criar atalhos...";
                CreateShortcuts(target, _desktopShortcut.Checked);
                WriteUninstallEntry(target);
            }
            catch (Exception error)
            {
                _progress.Visible = false;
                _status.Text = "A instalação falhou.";
                MessageBox.Show(
                    this,
                    "Não foi possível instalar o MineSphere.\n\n" + error.Message,
                    "MineSphere",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                _install.Enabled = true;
                _cancel.Enabled = true;
                _path.Enabled = true;
                _desktopShortcut.Enabled = true;
                _runAfter.Enabled = true;
                return;
            }

            _progress.Visible = false;
            _status.Text = "Instalação concluída.";
            MessageBox.Show(
                this,
                "O MineSphere Launcher foi instalado em:\n\n" + target,
                "MineSphere",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);

            if (_runAfter.Checked)
            {
                try
                {
                    Process.Start(new ProcessStartInfo(executable) { WorkingDirectory = target, UseShellExecute = true });
                }
                catch
                {
                    /* the app can be opened from the shortcut */
                }
            }
            Close();
        }

        private static void ExtractPayload(string target)
        {
            Directory.CreateDirectory(target);
            using (Stream payload = Assembly.GetExecutingAssembly().GetManifestResourceStream("Payload"))
            {
                if (payload == null) throw new InvalidOperationException("O pacote de instalação está em falta.");
                using (ZipArchive archive = new ZipArchive(payload, ZipArchiveMode.Read))
                {
                    string root = Path.GetFullPath(target).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        if (entry.FullName.EndsWith("/", StringComparison.Ordinal)) continue;
                        string destination = Path.GetFullPath(Path.Combine(target, entry.FullName));
                        if (!destination.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                        {
                            throw new InvalidDataException("O pacote contém um caminho inválido.");
                        }
                        string directory = Path.GetDirectoryName(destination);
                        if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                        using (Stream input = entry.Open())
                        using (FileStream output = File.Create(destination))
                        {
                            input.CopyTo(output);
                        }
                    }
                }
            }

            // An installed copy must never behave as the portable edition.
            string marker = Path.Combine(target, "portable.txt");
            if (File.Exists(marker)) File.Delete(marker);
        }

        private static void CreateShortcuts(string target, bool includeDesktop)
        {
            string executable = Path.Combine(target, "MineSphere.exe");
            string startMenu = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Programs),
                "MineSphere Launcher.lnk");
            CreateShortcut(startMenu, executable, target, "MineSphere Launcher");
            if (includeDesktop)
            {
                string desktop = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                    "MineSphere Launcher.lnk");
                CreateShortcut(desktop, executable, target, "MineSphere Launcher");
            }
        }

        private static void CreateShortcut(string linkPath, string executable, string workingDirectory, string description)
        {
            string directory = Path.GetDirectoryName(linkPath);
            if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
            Type shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null) throw new InvalidOperationException("O Windows Script Host não está disponível.");
            object shell = Activator.CreateInstance(shellType);
            object shortcut = shellType.InvokeMember(
                "CreateShortcut",
                BindingFlags.InvokeMethod,
                null,
                shell,
                new object[] { linkPath });
            Type shortcutType = shortcut.GetType();
            shortcutType.InvokeMember("TargetPath", BindingFlags.SetProperty, null, shortcut, new object[] { executable });
            shortcutType.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, shortcut, new object[] { workingDirectory });
            shortcutType.InvokeMember("IconLocation", BindingFlags.SetProperty, null, shortcut, new object[] { executable + ",0" });
            shortcutType.InvokeMember("Description", BindingFlags.SetProperty, null, shortcut, new object[] { description });
            shortcutType.InvokeMember("Save", BindingFlags.InvokeMethod, null, shortcut, null);
        }

        private static void WriteUninstallEntry(string target)
        {
            string uninstaller = Path.Combine(target, "MineSphereUninstall.exe");
            using (RegistryKey key = Registry.CurrentUser.CreateSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Uninstall\MineSphere"))
            {
                if (key == null) return;
                key.SetValue("DisplayName", "MineSphere Launcher");
                key.SetValue("DisplayVersion", BuildInfo.Version);
                key.SetValue("Publisher", "MundumIgnotum");
                key.SetValue("InstallLocation", target);
                key.SetValue("DisplayIcon", Path.Combine(target, "MineSphere.exe"));
                key.SetValue("UninstallString", "\"" + uninstaller + "\"");
                key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
            }
        }
    }
}
