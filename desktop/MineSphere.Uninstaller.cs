using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

namespace MineSphere
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
            string dataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "MineSphere");

            DialogResult answer = MessageBox.Show(
                "Remover o MineSphere Launcher?\n\n" +
                "A aplicação será apagada. As tuas contas, instalações, mundos e configurações ficam guardados.",
                "Desinstalar MineSphere",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);
            if (answer != DialogResult.Yes) return;

            Process[] running = Process.GetProcessesByName("MineSphere");
            if (running.Length > 0)
            {
                MessageBox.Show(
                    "Fecha o MineSphere Launcher antes de o desinstalar.",
                    "MineSphere",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
                return;
            }

            try
            {
                DeleteShortcut(Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.Programs),
                    "MineSphere Launcher.lnk"));
                DeleteShortcut(Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                    "MineSphere Launcher.lnk"));
            }
            catch
            {
                /* shortcuts are optional */
            }

            try
            {
                Registry.CurrentUser.DeleteSubKeyTree(
                    @"Software\Microsoft\Windows\CurrentVersion\Uninstall\MineSphere",
                    false);
            }
            catch
            {
                /* the entry may already be gone */
            }

            DialogResult removeData = MessageBox.Show(
                "Queres também apagar contas, instalações, mundos e configurações?\n\n" +
                "Pasta de dados:\n" + dataDir + "\n\n" +
                "Se escolheres Não, podes voltar a instalar o launcher e manter tudo.",
                "Desinstalar MineSphere",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning);
            if (removeData == DialogResult.Yes)
            {
                TryDeleteDirectory(dataDir);
            }

            try
            {
                RemoveApplicationFiles(appDir);
            }
            catch
            {
                /* the scheduled rmdir below is the fallback */
            }

            try
            {
                ProcessStartInfo cleanup = new ProcessStartInfo(
                    "cmd.exe",
                    "/c ping 127.0.0.1 -n 3 >nul & rmdir /s /q \"" + appDir + "\"");
                cleanup.UseShellExecute = false;
                cleanup.CreateNoWindow = true;
                cleanup.WindowStyle = ProcessWindowStyle.Hidden;
                Process.Start(cleanup);
            }
            catch
            {
                /* the remaining files can be deleted manually */
            }

            MessageBox.Show(
                "O MineSphere Launcher foi removido.",
                "MineSphere",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
        }

        private static void DeleteShortcut(string path)
        {
            if (File.Exists(path)) File.Delete(path);
        }

        private static void TryDeleteDirectory(string path)
        {
            try
            {
                if (Directory.Exists(path)) Directory.Delete(path, true);
            }
            catch
            {
                /* data may be in use by another process */
            }
        }

        private static void RemoveApplicationFiles(string appDir)
        {
            string self = Path.GetFullPath(Application.ExecutablePath);
            foreach (string file in Directory.GetFiles(appDir, "*", SearchOption.AllDirectories))
            {
                if (string.Equals(Path.GetFullPath(file), self, StringComparison.OrdinalIgnoreCase)) continue;
                try
                {
                    File.SetAttributes(file, FileAttributes.Normal);
                    File.Delete(file);
                }
                catch
                {
                    /* retry with the scheduled cleanup */
                }
            }

            string[] directories = Directory.GetDirectories(appDir, "*", SearchOption.AllDirectories);
            Array.Sort(directories, delegate(string left, string right)
            {
                return right.Length.CompareTo(left.Length);
            });
            foreach (string directory in directories)
            {
                try
                {
                    if (Directory.GetFileSystemEntries(directory).Length == 0) Directory.Delete(directory);
                }
                catch
                {
                    /* retry with the scheduled cleanup */
                }
            }
        }
    }
}
