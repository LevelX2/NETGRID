using System.Diagnostics;
using System.Text.Json;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.FirstRun;

internal static class Program
{
    [STAThread]
    public static int Main(string[] args)
    {
        if (args.Length == 2 && args[0] == "--audit-localization")
        {
            File.WriteAllText(Path.GetFullPath(args[1]), JsonSerializer.Serialize(UiText.Audit));
            return 0;
        }
        if (args.Length > 0) return RunHeadless(args);
        ApplicationConfiguration.Initialize();
        using var form = new FirstRunForm();
        Application.Run(form);
        return form.ResultCode;
    }

    private static int RunHeadless(string[] args)
    {
        try
        {
            if (args.Length != 5 || args[1] != "--program-root" || args[3] != "--environment") return 3;
            var runtime = FirstRunRuntime.Load(Path.GetFullPath(args[2]), Path.GetFullPath(args[4]));
            if (args[0] == "--status") return runtime.IsMaintenanceInitialized() ? 0 : 1;
            if (args[0] != "--bootstrap-stdin") return 3;
            var input = Console.In.ReadToEnd().Replace("\r", string.Empty, StringComparison.Ordinal).Split('\n');
            if (input.Length < 2 || string.IsNullOrEmpty(input[0]) || input[0] != input[1]) return 2;
            runtime.BootstrapMaintenance(input[0], input[1]);
            return 0;
        }
        catch
        {
            return 2;
        }
    }
}

internal sealed class FirstRunForm : Form
{
    private readonly TextBox _password = new() { Width = 390, UseSystemPasswordChar = true };
    private readonly TextBox _confirmation = new() { Width = 390, UseSystemPasswordChar = true };
    private readonly Label _status = new() { AutoSize = true, ForeColor = SystemColors.GrayText, MaximumSize = new Size(520, 0) };
    private readonly Label _accountMode = new() { AutoSize = true, MaximumSize = new Size(520, 0) };
    private readonly Button _complete = new() { Text = UiText.Get("first.complete"), AutoSize = true, Padding = new Padding(16, 6, 16, 6) };
    private readonly Button _later = new() { Text = UiText.Get("first.later"), AutoSize = true, Padding = new Padding(12, 6, 12, 6) };
    private FirstRunRuntime? _runtime;
    private bool _alreadyInitialized;

    public int ResultCode { get; private set; } = 1;

    public FirstRunForm()
    {
        Text = UiText.Get("first.title");
        Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath!);
        StartPosition = FormStartPosition.CenterScreen;
        AutoScaleMode = AutoScaleMode.Dpi;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        ClientSize = new Size(610, 470);
        Padding = new Padding(28);

        var root = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, AutoSize = true };
        root.Controls.Add(new Label
        {
            Text = UiText.Get("first.header"),
            AutoSize = true,
            Font = new Font(SystemFonts.DefaultFont.FontFamily, 17, FontStyle.Bold),
            Margin = new Padding(3, 3, 3, 14),
        });
        root.Controls.Add(Body(UiText.Get("first.body")));
        root.Controls.Add(_accountMode);
        root.Controls.Add(Field(UiText.Get("first.password"), _password));
        root.Controls.Add(Field(UiText.Get("first.confirm"), _confirmation));
        root.Controls.Add(_status);
        var actions = new FlowLayoutPanel { AutoSize = true, FlowDirection = FlowDirection.RightToLeft, Dock = DockStyle.Top };
        actions.Controls.Add(_complete);
        actions.Controls.Add(_later);
        root.Controls.Add(actions);
        Controls.Add(root);

        Shown += async (_, _) => await InitializeAsync();
        _complete.Click += async (_, _) => await CompleteAsync();
        _later.Click += (_, _) => Close();
    }

    private async Task InitializeAsync()
    {
        try
        {
            ToggleInputs(false);
            _status.Text = UiText.Get("first.checking");
            _runtime = FirstRunRuntime.Load();
            _accountMode.Text = _runtime.AccountMode == "protected"
                ? UiText.Get("first.account.protected")
                : UiText.Get("first.account.simple");
            if (await Task.Run(_runtime.IsMaintenanceInitialized))
            {
                _status.Text = UiText.Get("first.exists");
                _password.Enabled = false;
                _confirmation.Enabled = false;
                _complete.Text = UiText.Get("common.close");
                _alreadyInitialized = true;
                _complete.Enabled = true;
                _later.Visible = false;
                return;
            }
            _status.Text = UiText.Get("first.pipe");
            ToggleInputs(true);
            _password.Focus();
        }
        catch (Exception)
        {
            _status.Text = UiText.Get("first.runtime.error");
            MessageBox.Show(_status.Text, UiText.Get("first.title"), MessageBoxButtons.OK, MessageBoxIcon.Error);
            _later.Enabled = true;
        }
    }

    private async Task CompleteAsync()
    {
        if (_runtime is null) return;
        if (_alreadyInitialized)
        {
            ResultCode = 0;
            Close();
            return;
        }
        var password = _password.Text;
        var confirmation = _confirmation.Text;
        if (password.Length is < 12 or > 1024)
        {
            MessageBox.Show(UiText.Get("first.password.length"), UiText.Get("first.title"), MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }
        if (!string.Equals(password, confirmation, StringComparison.Ordinal))
        {
            MessageBox.Show(UiText.Get("first.password.mismatch"), UiText.Get("first.title"), MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        try
        {
            ToggleInputs(false);
            _status.Text = UiText.Get("first.setting");
            _password.Clear();
            _confirmation.Clear();
            await Task.Run(() => _runtime.BootstrapMaintenance(password, confirmation));
            password = string.Empty;
            confirmation = string.Empty;
            ResultCode = 0;
            _status.Text = UiText.Get("first.done");
            MessageBox.Show(UiText.Get("first.done.help"), UiText.Get("first.title"), MessageBoxButtons.OK, MessageBoxIcon.Information);
            Close();
        }
        catch (Exception)
        {
            password = string.Empty;
            confirmation = string.Empty;
            _status.Text = UiText.Get("first.runtime.error");
            MessageBox.Show(_status.Text, UiText.Get("first.title"), MessageBoxButtons.OK, MessageBoxIcon.Error);
            ToggleInputs(true);
        }
    }

    private void ToggleInputs(bool enabled)
    {
        _password.Enabled = enabled;
        _confirmation.Enabled = enabled;
        _complete.Enabled = enabled;
        _later.Enabled = enabled;
    }

    private static Label Body(string text) => new() { Text = text, AutoSize = true, MaximumSize = new Size(520, 0), Margin = new Padding(3, 3, 3, 15) };

    private static Control Field(string label, TextBox textBox)
    {
        var panel = new TableLayoutPanel { AutoSize = true, Dock = DockStyle.Top, ColumnCount = 1, Margin = new Padding(3, 8, 3, 8) };
        panel.Controls.Add(new Label { Text = label, AutoSize = true });
        panel.Controls.Add(textBox);
        return panel;
    }
}

internal sealed class FirstRunRuntime
{
    private readonly string _nodePath;
    private readonly string _cliPath;
    private readonly IReadOnlyDictionary<string, string> _environment;

    private FirstRunRuntime(string nodePath, string cliPath, IReadOnlyDictionary<string, string> environment)
    {
        _nodePath = nodePath;
        _cliPath = cliPath;
        _environment = environment;
    }

    public string AccountMode => _environment.GetValueOrDefault("NETGRID_ACCOUNT_ACCESS_MODE") ?? "simple";

    public static FirstRunRuntime Load()
    {
        var programRoot = AppContext.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
        using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false);
        var dataRoot = key?.GetValue("RuntimeDataRoot") as string;
        if (string.IsNullOrWhiteSpace(dataRoot) || !Path.IsPathFullyQualified(dataRoot))
            throw new FirstRunException("Der installierte NETGRID-Datenordner ist nicht registriert.");
        return Load(programRoot, Path.Combine(dataRoot, "config", "runtime.env"));
    }

    public static FirstRunRuntime Load(string programRoot, string environmentPath)
    {
        var environment = ReadEnvironment(environmentPath);
        var nodePath = Path.Combine(programRoot, "runtime", "node", "node.exe");
        var cliPath = Path.Combine(programRoot, "app", "maintenance-auth.mjs");
        if (!File.Exists(nodePath) || !File.Exists(cliPath))
            throw new FirstRunException("Die installierte Maintenance-Laufzeit ist unvollständig.");
        return new FirstRunRuntime(nodePath, cliPath, environment);
    }

    public bool IsMaintenanceInitialized()
    {
        var result = RunCli(["status"], null);
        if (result.ExitCode != 0) throw new FirstRunException("Der Maintenance-Status konnte nicht geprüft werden.");
        try
        {
            using var json = JsonDocument.Parse(result.Output);
            return json.RootElement.GetProperty("initialized").GetBoolean();
        }
        catch (JsonException)
        {
            throw new FirstRunException("Die Maintenance-Statusantwort ist ungültig.");
        }
    }

    public void BootstrapMaintenance(string password, string confirmation)
    {
        var result = RunCli(["bootstrap", "--password-stdin"], $"{password}\n{confirmation}\n");
        if (result.ExitCode == 0) return;
        if (result.Error.Contains("maintenance_auth_already_initialized", StringComparison.Ordinal))
            throw new FirstRunException("Maintenance ist bereits eingerichtet. Das vorhandene Passwort wurde nicht verändert.");
        if (result.Error.Contains("maintenance_password_too_short", StringComparison.Ordinal))
            throw new FirstRunException("Das Maintenance-Passwort ist zu kurz.");
        throw new FirstRunException("Der Maintenance-Zugang konnte nicht eingerichtet werden.");
    }

    private CliResult RunCli(string[] arguments, string? standardInput)
    {
        var start = new ProcessStartInfo(_nodePath)
        {
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardInput = standardInput is not null,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        };
        start.ArgumentList.Add(_cliPath);
        foreach (var argument in arguments) start.ArgumentList.Add(argument);
        foreach (var key in start.Environment.Keys.Where(key => key.StartsWith("NETGRID_", StringComparison.Ordinal) || key is "NODE_OPTIONS" or "NODE_PATH").ToArray())
            start.Environment.Remove(key);
        foreach (var (name, value) in _environment) start.Environment[name] = value;
        using var process = Process.Start(start) ?? throw new FirstRunException("Die Maintenance-Laufzeit konnte nicht gestartet werden.");
        if (standardInput is not null)
        {
            process.StandardInput.Write(standardInput);
            process.StandardInput.Close();
        }
        var output = process.StandardOutput.ReadToEnd();
        var error = process.StandardError.ReadToEnd();
        if (!process.WaitForExit(60_000))
        {
            process.Kill(entireProcessTree: true);
            throw new FirstRunException("Die Maintenance-Einrichtung hat das Zeitlimit überschritten.");
        }
        return new CliResult(process.ExitCode, output, error);
    }

    private static IReadOnlyDictionary<string, string> ReadEnvironment(string path)
    {
        if (!File.Exists(path)) throw new FirstRunException("Die geschützte Runtimekonfiguration fehlt.");
        var values = new Dictionary<string, string>(StringComparer.Ordinal);
        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;
            var separator = line.IndexOf('=');
            if (separator <= 0) throw new FirstRunException("Die Runtimekonfiguration ist ungültig.");
            var name = line[..separator];
            var value = line[(separator + 1)..].Trim().Trim('"');
            if (!values.TryAdd(name, value)) throw new FirstRunException("Die Runtimekonfiguration enthält doppelte Werte.");
        }
        if (!values.ContainsKey("NETGRID_DATA_ROOT") || !values.ContainsKey("NETGRID_TOKEN_SALT"))
            throw new FirstRunException("Die Runtimekonfiguration ist unvollständig.");
        return values;
    }

    private sealed record CliResult(int ExitCode, string Output, string Error);
}

internal sealed class FirstRunException(string message) : Exception(message);
