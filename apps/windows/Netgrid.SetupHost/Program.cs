using System.ComponentModel;
using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Win32;

namespace Netgrid.SetupHost;

internal static class Program
{
    [STAThread]
    public static int Main(string[] args)
    {
        try
        {
            if (args.Length == 2 && args[0] == "--extract-msi")
            {
                MsiPayload.ExtractVerified(Path.GetFullPath(args[1]));
                Console.WriteLine("NETGRID_SETUP_PAYLOAD_OK");
                return 0;
            }
            if (args.Length == 4 && args[0] == "--probe-ports")
            {
                var profile = args[1];
                var webPort = PortPlanner.ParsePort(args[2]);
                var serverPort = PortPlanner.ParsePort(args[3]);
                if (PortPlanner.AreAvailable(profile, webPort, serverPort))
                {
                    Console.WriteLine($"NETGRID_SETUP_PORTS_OK web={webPort} server={serverPort}");
                    return 0;
                }
                var alternative = PortPlanner.FindAlternative(profile, webPort, serverPort);
                Console.Error.WriteLine($"NETGRID_SETUP_PORTS_BUSY alternativeWeb={alternative.WebPort} alternativeServer={alternative.ServerPort}");
                return 2;
            }
            if (args.Length == 2 && args[0] == "--audit-contract")
            {
                File.WriteAllText(Path.GetFullPath(args[1]), JsonSerializer.Serialize(SetupContract.Audit, new JsonSerializerOptions { WriteIndented = true }));
                return 0;
            }
            if (args.Length == 3 && args[0] == "--install-update" && args[1] == "--program-root")
            {
                var result = Installer.RunUpdate(Path.GetFullPath(args[2]), uninstall: false);
                Console.WriteLine($"NETGRID_SETUP_UPDATE_RESULT code={result}");
                return result is 0 or 3010 ? 0 : result;
            }
            if (args.Length == 1 && args[0] == "--uninstall-update")
            {
                var result = Installer.RunUpdate(programRoot: null, uninstall: true);
                Console.WriteLine($"NETGRID_SETUP_UNINSTALL_RESULT code={result}");
                return result is 0 or 1605 or 3010 ? 0 : result;
            }
            if (args.Length != 0) throw new SetupException("setup_arguments_invalid", "Die Setup-Argumente sind ungültig.");

            MsiPayload.Verify();
            ApplicationConfiguration.Initialize();
            Application.Run(new SetupForm());
            return 0;
        }
        catch (Exception exception)
        {
            if (Environment.UserInteractive)
            {
                MessageBox.Show(
                    exception is SetupException setup ? setup.Message : "NETGRID Setup konnte nicht gestartet werden.",
                    "NETGRID Setup",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
            else
            {
                Console.Error.WriteLine($"NETGRID_SETUP_ERROR type={exception.GetType().Name}");
            }
            return 3;
        }
    }
}

internal sealed class SetupForm : Form
{
    private readonly RadioButton _recommended = new() { Text = "Empfohlene Installation", Checked = true, AutoSize = true };
    private readonly RadioButton _custom = new() { Text = "Benutzerdefinierte Installation", AutoSize = true };
    private readonly RadioButton _local = new() { Text = "Nur dieser Rechner (empfohlen)", Checked = true, AutoSize = true };
    private readonly RadioButton _lan = new() { Text = "Privates Netzwerk", AutoSize = true };
    private readonly TextBox _programRoot = new() { Width = 410 };
    private readonly TextBox _dataRoot = new() { Width = 410 };
    private readonly NumericUpDown _webPort = new() { Minimum = 1, Maximum = 65535, Value = 3100, Width = 90 };
    private readonly NumericUpDown _serverPort = new() { Minimum = 1, Maximum = 65535, Value = 8787, Width = 90 };
    private readonly ComboBox _retention = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 210 };
    private readonly ComboBox _accountMode = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 310 };
    private readonly CheckBox _desktop = new() { Text = "Desktopverknüpfung erstellen", Checked = true, AutoSize = true };
    private readonly CheckBox _launch = new() { Text = "NETGRID nach Abschluss starten", Checked = true, AutoSize = true };
    private readonly Label _lanAddress = new() { AutoSize = true };
    private readonly Label _status = new() { AutoSize = true, ForeColor = SystemColors.GrayText };
    private readonly Button _install = new() { Text = "Installieren", AutoSize = true, Padding = new Padding(18, 6, 18, 6) };
    private readonly IReadOnlyList<string> _privateAddresses = NetworkSelection.PrivateIpv4Addresses();

    public SetupForm()
    {
        Text = $"NETGRID Setup {MsiPayload.ProductVersion}";
        Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath!);
        StartPosition = FormStartPosition.CenterScreen;
        AutoScaleMode = AutoScaleMode.Dpi;
        MinimumSize = new Size(720, 690);
        ClientSize = new Size(760, 720);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;

        _programRoot.Text = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "NETGRID");
        _dataRoot.Text = ExistingDataRoot() ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "NETGRID");
        _retention.Items.AddRange(SetupContract.RetentionChoices.Cast<object>().ToArray());
        _retention.SelectedIndex = 1;
        _accountMode.Items.AddRange(new object[]
        {
            new AccountModeChoice("simple", "Einfach, ohne Spielerpasswörter (empfohlen)"),
            new AccountModeChoice("protected", "Geschützt, mit Spielerpasswörtern"),
        });
        _accountMode.SelectedIndex = 0;
        _lanAddress.Text = _privateAddresses.Count > 0
            ? $"Erkannte private Adresse: {_privateAddresses[0]}"
            : "Keine private IPv4-Adresse erkannt.";

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            AutoScroll = true,
            ColumnCount = 1,
            Padding = new Padding(28),
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Controls.Add(root);
        root.Controls.Add(Heading("NETGRID installieren", 18));
        root.Controls.Add(Body("Der Assistent installiert NETGRID für alle Benutzer dieses Rechners. Administratorrechte werden erst nach Ihrer Bestätigung angefordert."));
        root.Controls.Add(Group("Installationsweg", Flow(_recommended, _custom)));
        root.Controls.Add(Group("Betriebsart", Flow(
            _local,
            Body("Spiel und Maintenance sind nur auf diesem Rechner erreichbar."),
            _lan,
            Body("Das Spiel wird im privaten LAN freigegeben. Maintenance bleibt nur lokal erreichbar."),
            _lanAddress
        )));

        var advanced = new TableLayoutPanel { AutoSize = true, Dock = DockStyle.Top, ColumnCount = 3 };
        advanced.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 120));
        advanced.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        advanced.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        AddPathRow(advanced, 0, "Programmordner", _programRoot);
        AddPathRow(advanced, 1, "Datenordner", _dataRoot);
        advanced.Controls.Add(new Label { Text = "Web-/Serverport", AutoSize = true, Anchor = AnchorStyles.Left }, 0, 2);
        advanced.Controls.Add(Flow(_webPort, new Label { Text = "/", AutoSize = true }, _serverPort), 1, 2);
        advanced.Controls.Add(new Label { Text = "Spielaufbewahrung", AutoSize = true, Anchor = AnchorStyles.Left }, 0, 3);
        advanced.Controls.Add(_retention, 1, 3);
        advanced.Controls.Add(new Label { Text = "Spielerprofile", AutoSize = true, Anchor = AnchorStyles.Left }, 0, 4);
        advanced.Controls.Add(_accountMode, 1, 4);
        root.Controls.Add(Group("Erweiterte Optionen", advanced));
        root.Controls.Add(Flow(_desktop, _launch));
        root.Controls.Add(Body("Es werden keine Entwicklungsdaten, Testspiele, privaten Kartenbilder oder Zugangsdaten aus diesem Rechner übernommen."));
        root.Controls.Add(_status);
        var actions = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Top, FlowDirection = FlowDirection.RightToLeft };
        actions.Controls.Add(_install);
        root.Controls.Add(actions);

        _recommended.CheckedChanged += (_, _) => UpdateAdvancedState();
        _custom.CheckedChanged += (_, _) => UpdateAdvancedState();
        _lan.CheckedChanged += (_, _) => UpdateLanState();
        _install.Click += async (_, _) => await InstallAsync();
        UpdateAdvancedState();
        UpdateLanState();
    }

    private async Task InstallAsync()
    {
        try
        {
            ToggleUi(false);
            _status.Text = "Einstellungen werden geprüft …";
            var settings = ReadSettings();
            settings.Validate();
            if (!PortPlanner.AreAvailable(settings.Profile, settings.WebPort, settings.ServerPort))
            {
                if (!_recommended.Checked)
                    throw new SetupException("ports_busy", "Mindestens einer der gewählten Ports ist bereits belegt. Bitte wählen Sie andere Ports.");
                var alternative = PortPlanner.FindAlternative(settings.Profile, settings.WebPort, settings.ServerPort);
                var answer = MessageBox.Show(
                    $"Die Standardports sind belegt. Soll NETGRID stattdessen die freien Ports {alternative.WebPort} und {alternative.ServerPort} verwenden?",
                    "NETGRID Setup – Portkonflikt",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question
                );
                if (answer != DialogResult.Yes) throw new SetupException("ports_busy", "Die Installation wurde wegen des Portkonflikts nicht gestartet.");
                _webPort.Value = alternative.WebPort;
                _serverPort.Value = alternative.ServerPort;
                settings = ReadSettings();
            }
            _status.Text = "Windows-Administratorfreigabe wird angefordert …";
            var result = await Task.Run(() => Installer.Run(settings));
            if (result is not (0 or 3010)) throw new SetupException("msi_failed", $"Windows Installer meldete Fehlercode {result}. Das Installationsprotokoll liegt unter {Installer.LogPath}.");
            _status.Text = "NETGRID wurde erfolgreich installiert.";
            var firstRunResult = await Task.Run(() => Installer.RunFirstRun(settings));
            if (firstRunResult > 1)
            {
                MessageBox.Show(
                    "Die Maintenance-Ersteinrichtung konnte nicht abgeschlossen werden. Sie kann jederzeit über das Startmenü erneut geöffnet werden.",
                    "NETGRID Setup",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
            }
            if (_launch.Checked)
            {
                Process.Start(new ProcessStartInfo(Path.Combine(settings.ProgramRoot, "NETGRID.exe")) { UseShellExecute = true });
            }
            MessageBox.Show("NETGRID wurde erfolgreich installiert.", "NETGRID Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
            Close();
        }
        catch (Win32Exception exception) when (exception.NativeErrorCode == 1223)
        {
            _status.Text = "Die Administratorfreigabe wurde abgebrochen.";
            MessageBox.Show(_status.Text, "NETGRID Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
            ToggleUi(true);
        }
        catch (Exception exception)
        {
            _status.Text = exception.Message;
            MessageBox.Show(exception.Message, "NETGRID Setup", MessageBoxButtons.OK, MessageBoxIcon.Error);
            ToggleUi(true);
        }
    }

    private SetupSettings ReadSettings()
    {
        var retention = (RetentionChoice?)_retention.SelectedItem ?? throw new SetupException("retention_missing", "Bitte wählen Sie die Spielaufbewahrung.");
        var accountMode = (AccountModeChoice?)_accountMode.SelectedItem ?? throw new SetupException("account_mode_missing", "Bitte wählen Sie den Spielerprofilmodus.");
        return new SetupSettings(
            _lan.Checked ? "private_lan" : "local",
            _lan.Checked ? _privateAddresses.FirstOrDefault() : null,
            Path.GetFullPath(_programRoot.Text.Trim()),
            Path.GetFullPath(_dataRoot.Text.Trim()),
            decimal.ToInt32(_webPort.Value),
            decimal.ToInt32(_serverPort.Value),
            retention.Value,
            accountMode.Value,
            _desktop.Checked
        );
    }

    private void ToggleUi(bool enabled)
    {
        foreach (Control control in Controls) control.Enabled = enabled;
        _status.Enabled = true;
    }

    private void UpdateAdvancedState()
    {
        var enabled = _custom.Checked;
        _programRoot.Enabled = enabled;
        _dataRoot.Enabled = enabled;
        _webPort.Enabled = enabled;
        _serverPort.Enabled = enabled;
        _retention.Enabled = enabled;
        _accountMode.Enabled = enabled;
    }

    private void UpdateLanState()
    {
        _lanAddress.Visible = _lan.Checked;
        if (_lan.Checked && _privateAddresses.Count == 0)
            _status.Text = "Für den LAN-Betrieb muss eine private IPv4-Adresse verfügbar sein.";
        else if (_status.Text.StartsWith("Für den LAN-Betrieb", StringComparison.Ordinal))
            _status.Text = string.Empty;
    }

    private void AddPathRow(TableLayoutPanel table, int row, string label, TextBox box)
    {
        table.Controls.Add(new Label { Text = label, AutoSize = true, Anchor = AnchorStyles.Left }, 0, row);
        table.Controls.Add(box, 1, row);
        var browse = new Button { Text = "Auswählen …", AutoSize = true };
        browse.Click += (_, _) =>
        {
            using var dialog = new FolderBrowserDialog { SelectedPath = box.Text, ShowNewFolderButton = true };
            if (dialog.ShowDialog(this) == DialogResult.OK) box.Text = dialog.SelectedPath;
        };
        table.Controls.Add(browse, 2, row);
    }

    private static GroupBox Group(string title, Control content)
    {
        var group = new GroupBox { Text = title, AutoSize = true, Dock = DockStyle.Top, Padding = new Padding(14) };
        group.Controls.Add(content);
        content.Dock = DockStyle.Top;
        return group;
    }

    private static FlowLayoutPanel Flow(params Control[] controls)
    {
        var flow = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Top, FlowDirection = FlowDirection.LeftToRight, WrapContents = true };
        flow.Controls.AddRange(controls);
        return flow;
    }

    private static Label Heading(string text, float size) => new() { Text = text, AutoSize = true, Font = new Font(SystemFonts.DefaultFont.FontFamily, size, FontStyle.Bold) };
    private static Label Body(string text) => new() { Text = text, AutoSize = true, MaximumSize = new Size(660, 0), Margin = new Padding(3, 5, 3, 10) };

    private static string? ExistingDataRoot()
    {
        using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false);
        return key?.GetValue("RuntimeDataRoot") as string;
    }
}

internal sealed record SetupSettings(
    string Profile,
    string? LanAddress,
    string ProgramRoot,
    string DataRoot,
    int WebPort,
    int ServerPort,
    string RetentionDays,
    string AccountAccessMode,
    bool DesktopShortcut
)
{
    public void Validate()
    {
        if (Profile == "private_lan" && LanAddress is null) throw new SetupException("lan_address_missing", "Es wurde keine private IPv4-Adresse erkannt.");
        if (WebPort == ServerPort) throw new SetupException("ports_conflict", "Web- und Serverport müssen verschieden sein.");
        ValidateRoot(ProgramRoot, "Programmordner");
        ValidateRoot(DataRoot, "Datenordner");
        if (Contains(ProgramRoot, DataRoot) || Contains(DataRoot, ProgramRoot))
            throw new SetupException("path_overlap", "Programm- und Datenordner dürfen sich nicht überlappen.");
        var drive = new DriveInfo(Path.GetPathRoot(DataRoot)!);
        if (drive.AvailableFreeSpace < 512L * 1024 * 1024)
            throw new SetupException("disk_space_low", "Am Datenziel sind weniger als 512 MiB frei.");
    }

    private static void ValidateRoot(string path, string label)
    {
        if (!Path.IsPathFullyQualified(path) || path.StartsWith(@"\\", StringComparison.Ordinal))
            throw new SetupException("path_invalid", $"{label}: Es ist nur ein absoluter lokaler Pfad zulässig.");
        var root = Path.GetPathRoot(path);
        if (string.IsNullOrWhiteSpace(root) || string.Equals(Path.TrimEndingDirectorySeparator(path), Path.TrimEndingDirectorySeparator(root), StringComparison.OrdinalIgnoreCase))
            throw new SetupException("path_too_broad", $"{label}: Eine Laufwerkswurzel ist nicht zulässig.");
        var drive = new DriveInfo(root);
        if (!drive.IsReady || drive.DriveType != DriveType.Fixed)
            throw new SetupException("path_drive_invalid", $"{label}: Das Laufwerk muss lokal, fest eingebaut und verfügbar sein.");
    }

    private static bool Contains(string parent, string candidate)
    {
        var relative = Path.GetRelativePath(parent, candidate);
        return relative == "." || (relative != ".." && !relative.StartsWith($"..{Path.DirectorySeparatorChar}", StringComparison.Ordinal));
    }
}

internal static class Installer
{
    public static string LogPath { get; } = Path.Combine(Path.GetTempPath(), $"NETGRID-install-{DateTime.UtcNow:yyyyMMdd-HHmmss}.log");

    public static int Run(SetupSettings settings)
    {
        var temporaryMsi = Path.Combine(Path.GetTempPath(), $"NETGRID-{Guid.NewGuid():N}.msi");
        try
        {
            MsiPayload.ExtractVerified(temporaryMsi);
            var properties = new[]
            {
                Property("INSTALLFOLDER", settings.ProgramRoot),
                Property("NETGRID_DATA_ROOT", settings.DataRoot),
                Property("NETGRID_DEPLOYMENT_PROFILE", settings.Profile),
                Property("NETGRID_LAN_ADDRESS", settings.LanAddress ?? string.Empty),
                Property("NETGRID_WEB_PORT", settings.WebPort.ToString()),
                Property("NETGRID_SERVER_PORT", settings.ServerPort.ToString()),
                Property("NETGRID_RETENTION_DAYS", settings.RetentionDays),
                Property("NETGRID_ACCOUNT_ACCESS_MODE", settings.AccountAccessMode),
                Property("INSTALLDESKTOPSHORTCUT", settings.DesktopShortcut ? "1" : "0"),
                Property("NETGRID_SETUP_SOURCE", Environment.ProcessPath ?? throw new SetupException("setup_path_missing", "Der Setup-Pfad ist nicht verfügbar.")),
                Property("NETGRID_SETUP_SHA256", CurrentSetupHash()),
            };
            var arguments = $"/i {Quote(temporaryMsi)} /qn /norestart /l*v {Quote(LogPath)} {string.Join(" ", properties)}";
            using var process = Process.Start(new ProcessStartInfo("msiexec.exe")
            {
                Arguments = arguments,
                UseShellExecute = true,
                Verb = "runas",
                WindowStyle = ProcessWindowStyle.Hidden,
            }) ?? throw new SetupException("msi_start_failed", "Windows Installer konnte nicht gestartet werden.");
            process.WaitForExit();
            return process.ExitCode;
        }
        finally
        {
            if (File.Exists(temporaryMsi)) File.Delete(temporaryMsi);
        }
    }

    public static int RunUpdate(string? programRoot, bool uninstall)
    {
        var temporaryMsi = Path.Combine(Path.GetTempPath(), $"NETGRID-{Guid.NewGuid():N}.msi");
        try
        {
            MsiPayload.ExtractVerified(temporaryMsi);
            var action = uninstall ? "/x" : "/i";
            var arguments = $"{action} {Quote(temporaryMsi)} /qn /norestart /l*v {Quote(LogPath)}";
            if (!uninstall)
            {
                if (string.IsNullOrWhiteSpace(programRoot)) throw new SetupException("update_program_root_missing", "Der installierte Programmordner fehlt.");
                using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false);
                var dataRoot = key?.GetValue("RuntimeDataRoot") as string;
                if (string.IsNullOrWhiteSpace(dataRoot)) throw new SetupException("update_data_root_missing", "Der registrierte NETGRID-Datenordner fehlt.");
                var desktop = Convert.ToInt32(key?.GetValue("DesktopShortcut") ?? 0) == 1 ? "1" : "0";
                arguments += $" {Property("INSTALLFOLDER", Path.GetFullPath(programRoot))} {Property("NETGRID_DATA_ROOT", Path.GetFullPath(dataRoot))} {Property("INSTALLDESKTOPSHORTCUT", desktop)} {Property("NETGRID_SETUP_SOURCE", Environment.ProcessPath ?? throw new SetupException("setup_path_missing", "Der Setup-Pfad ist nicht verfügbar."))} {Property("NETGRID_SETUP_SHA256", CurrentSetupHash())}";
            }
            using var process = Process.Start(new ProcessStartInfo("msiexec.exe")
            {
                Arguments = arguments,
                UseShellExecute = true,
                Verb = "runas",
                WindowStyle = ProcessWindowStyle.Hidden,
            }) ?? throw new SetupException("msi_start_failed", "Windows Installer konnte nicht gestartet werden.");
            process.WaitForExit();
            return process.ExitCode;
        }
        finally
        {
            if (File.Exists(temporaryMsi)) File.Delete(temporaryMsi);
        }
    }

    private static string CurrentSetupHash()
    {
        var source = Environment.ProcessPath ?? throw new SetupException("setup_path_missing", "Der Setup-Pfad ist nicht verfügbar.");
        using var stream = File.OpenRead(source);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }

    public static int RunFirstRun(SetupSettings settings)
    {
        var executable = Path.Combine(settings.ProgramRoot, "NETGRID.FirstRun.exe");
        if (!File.Exists(executable)) return 2;
        using var process = Process.Start(new ProcessStartInfo(executable) { UseShellExecute = true })
            ?? throw new SetupException("first_run_start_failed", "Die NETGRID-Ersteinrichtung konnte nicht gestartet werden.");
        process.WaitForExit();
        return process.ExitCode;
    }

    private static string Property(string name, string value)
    {
        if (value.IndexOfAny(['"', '\r', '\n']) >= 0) throw new SetupException("msi_property_invalid", "Eine Setup-Einstellung enthält ungültige Zeichen.");
        return $"{name}=\"{value}\"";
    }

    private static string Quote(string value) => $"\"{value.Replace("\"", "\"\"")}\"";
}

internal static class MsiPayload
{
    private const string ResourceName = "NETGRID.Product.msi";
    private static readonly IReadOnlyDictionary<string, string> Metadata = Assembly.GetExecutingAssembly()
        .GetCustomAttributes<AssemblyMetadataAttribute>()
        .ToDictionary(attribute => attribute.Key, attribute => attribute.Value ?? string.Empty, StringComparer.Ordinal);

    public static string ProductVersion => Metadata.GetValueOrDefault("NetgridProductVersion") ?? "";

    public static void Verify()
    {
        using var stream = Open();
        VerifyHash(stream);
    }

    public static void ExtractVerified(string target)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(target) ?? throw new SetupException("payload_target_invalid", "Das MSI-Ziel ist ungültig."));
        var temporary = $"{target}.{Guid.NewGuid():N}.tmp";
        try
        {
            using (var input = Open())
            using (var output = File.Create(temporary)) input.CopyTo(output);
            using (var verify = File.OpenRead(temporary)) VerifyHash(verify);
            File.Move(temporary, target, overwrite: true);
        }
        finally
        {
            if (File.Exists(temporary)) File.Delete(temporary);
        }
    }

    private static Stream Open() => Assembly.GetExecutingAssembly().GetManifestResourceStream(ResourceName)
        ?? throw new SetupException("payload_missing", "Das eingebettete NETGRID-MSI fehlt.");

    private static void VerifyHash(Stream stream)
    {
        var expected = Metadata.GetValueOrDefault("NetgridMsiSha256");
        if (string.IsNullOrWhiteSpace(expected) || expected.Length != 64) throw new SetupException("payload_hash_missing", "Die MSI-Prüfsumme fehlt.");
        var actual = Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
        if (!string.Equals(actual, expected, StringComparison.Ordinal)) throw new SetupException("payload_hash_mismatch", "Das eingebettete NETGRID-MSI ist beschädigt.");
    }
}

internal static class NetworkSelection
{
    public static IReadOnlyList<string> PrivateIpv4Addresses() => NetworkInterface.GetAllNetworkInterfaces()
        .Where(adapter => adapter.OperationalStatus == OperationalStatus.Up && adapter.NetworkInterfaceType is not (NetworkInterfaceType.Loopback or NetworkInterfaceType.Tunnel))
        .SelectMany(adapter => adapter.GetIPProperties().UnicastAddresses)
        .Select(entry => entry.Address)
        .Where(address => address.AddressFamily == AddressFamily.InterNetwork && IsPrivate(address))
        .Select(address => address.ToString())
        .Distinct(StringComparer.Ordinal)
        .OrderBy(address => address, StringComparer.Ordinal)
        .ToArray();

    private static bool IsPrivate(IPAddress address)
    {
        var bytes = address.GetAddressBytes();
        return bytes[0] == 10 || (bytes[0] == 172 && bytes[1] is >= 16 and <= 31) || (bytes[0] == 192 && bytes[1] == 168);
    }
}

internal static class PortPlanner
{
    public static int ParsePort(string value)
    {
        if (!int.TryParse(value, out var port) || port is < 1 or > 65535) throw new SetupException("port_invalid", "Der Port muss zwischen 1 und 65535 liegen.");
        return port;
    }

    public static bool AreAvailable(string profile, int webPort, int serverPort)
    {
        if (webPort == serverPort) return false;
        var address = profile == "private_lan" ? IPAddress.Any : IPAddress.Loopback;
        TcpListener? web = null;
        TcpListener? server = null;
        try
        {
            web = new TcpListener(address, webPort);
            web.Start();
            server = new TcpListener(address, serverPort);
            server.Start();
            return true;
        }
        catch (SocketException)
        {
            return false;
        }
        finally
        {
            server?.Stop();
            web?.Stop();
        }
    }

    public static (int WebPort, int ServerPort) FindAlternative(string profile, int preferredWeb, int preferredServer)
    {
        for (var offset = 1; offset <= 200; offset++)
        {
            var web = preferredWeb + offset;
            var server = preferredServer + offset;
            if (web <= 65535 && server <= 65535 && AreAvailable(profile, web, server)) return (web, server);
        }
        throw new SetupException("ports_unavailable", "Es konnte kein freies alternatives Portpaar gefunden werden.");
    }
}

internal sealed record RetentionChoice(string Value, string Label)
{
    public override string ToString() => Label;
}

internal sealed record AccountModeChoice(string Value, string Label)
{
    public override string ToString() => Label;
}

internal static class SetupContract
{
    public static readonly RetentionChoice[] RetentionChoices =
    [
        new("7", "7 Tage"),
        new("30", "30 Tage (empfohlen)"),
        new("90", "90 Tage"),
        new("180", "180 Tage"),
        new("365", "365 Tage"),
        new("never", "Nie automatisch löschen"),
    ];

    public static object Audit => new
    {
        schemaVersion = "netgrid-guided-setup-contract-v1",
        setupModes = new[] { "recommended", "custom" },
        defaultSetupMode = "recommended",
        deploymentProfiles = new[] { "local", "private_lan" },
        defaultDeploymentProfile = "local",
        webPort = 3100,
        serverPort = 8787,
        retentionValues = RetentionChoices.Select(choice => choice.Value).ToArray(),
        defaultRetention = "30",
        accountAccessModes = new[] { "simple", "protected" },
        defaultAccountAccessMode = "simple",
        desktopShortcutDefault = true,
        launchAfterInstallDefault = true,
        firewallProfiles = new[] { "private" },
        publicFirewallProfileEnabled = false,
        updateChannel = "github-releases-only",
        updateCommands = new[] { "install-update", "uninstall-update" },
        installerRollback = "msi-major-upgrade",
    };
}

internal sealed class SetupException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
