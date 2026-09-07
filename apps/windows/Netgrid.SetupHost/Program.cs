using System.ComponentModel;
using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Win32;
using Netgrid.Windows;

namespace Netgrid.SetupHost;

internal static class Program
{
    [STAThread]
    public static int Main(string[] args)
    {
        var interactiveCommand = args.Length == 0 || args[0] is "--uninstall" or "--uninstall-product";
        try
        {
            if (args.Length == 2 && args[0] == "--install-worker")
                return InstallationWorker.Run(InstallationRequest.Decode(args[1])).GetAwaiter().GetResult();
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
            if (args.Length == 2 && args[0] == "--audit-localization")
            {
                File.WriteAllText(Path.GetFullPath(args[1]), JsonSerializer.Serialize(UiText.Audit));
                return 0;
            }
            if (args.Length == 4 && args[0] is "--render-preview" or "--render-language-preview")
            {
                ApplicationConfiguration.Initialize();
                UiText.Use(args[1]);
                if (!int.TryParse(args[2], out var scale) || scale is not (100 or 125 or 150)) throw new SetupException("setup_arguments_invalid");
                using Form form = args[0] == "--render-language-preview" ? new LanguageDialog() : new SetupForm();
                form.ShowInTaskbar = false;
                form.StartPosition = FormStartPosition.Manual;
                form.Location = new Point(-32000, -32000);
                form.Show();
                Application.DoEvents();
                var factor = scale / 100f;
                if (factor != 1f) form.Scale(new SizeF(factor, factor));
                form.PerformLayout();
                using var bitmap = new Bitmap(form.Width, form.Height);
                form.DrawToBitmap(bitmap, new Rectangle(Point.Empty, bitmap.Size));
                bitmap.Save(Path.GetFullPath(args[3]), System.Drawing.Imaging.ImageFormat.Png);
                form.Hide();
                return 0;
            }
            if (args.Length == 4 && args[0] == "--render-uninstall-preview")
            {
                ApplicationConfiguration.Initialize();
                UiText.Use(args[1]);
                if (!int.TryParse(args[2], out var scale) || scale is not (100 or 125 or 150)) throw new SetupException("setup_arguments_invalid");
                using var form = new UninstallForm();
                form.ShowInTaskbar = false;
                form.StartPosition = FormStartPosition.Manual;
                form.Location = new Point(-32000, -32000);
                form.Show();
                Application.DoEvents();
                var factor = scale / 100f;
                if (factor != 1f) form.Scale(new SizeF(factor, factor));
                form.PerformLayout();
                using var bitmap = new Bitmap(form.Width, form.Height);
                form.DrawToBitmap(bitmap, new Rectangle(Point.Empty, bitmap.Size));
                bitmap.Save(Path.GetFullPath(args[3]), System.Drawing.Imaging.ImageFormat.Png);
                form.Hide();
                return 0;
            }
            if (args.Length == 6 && args[0] == "--uninstall-product" && args[2] == "--language" && args[4] == "--wait-pid")
            {
                ApplicationConfiguration.Initialize();
                UiText.Use(args[3]);
                var deleteData = args[1] switch
                {
                    "retain" => false,
                    "delete" => true,
                    _ => throw new SetupException("uninstall_mode_invalid"),
                };
                if (!int.TryParse(args[5], out var waitPid) || waitPid <= 0) throw new SetupException("uninstall_parent_invalid");
                UninstallWorker.ValidateAndWait(waitPid);
                try
                {
                    var result = Installer.RunUpdate(programRoot: null, uninstall: true, deleteData: deleteData);
                    if (result is not (0 or 3010)) throw new SetupException("uninstall_failed", result);
                    MessageBox.Show(UiText.Get("uninstall.status.success"), UiText.Get("uninstall.title"), MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return 0;
                }
                finally
                {
                    UninstallWorker.ScheduleSelfRemoval();
                }
            }
            if (args.Length > 0 && args[0] is "--install-update" or "--uninstall-update")
            {
                var command = UpdateCommand.Parse(args);
                var result = Installer.RunUpdate(command.ProgramRoot, command.Uninstall, updateLease: command.Lease);
                Console.WriteLine($"{(command.Uninstall ? "NETGRID_SETUP_UNINSTALL_RESULT" : "NETGRID_SETUP_UPDATE_RESULT")} code={result}");
                // Only a standalone removal is idempotent for an absent MSI.
                // An updater-owned rollback must observe its exact result.
                return command.ExitCode(result);
            }
            if (args.Length == 1 && args[0] == "--uninstall")
            {
                MsiPayload.Verify();
                ApplicationConfiguration.Initialize();
                if (!LanguageDialog.SelectLanguage()) return 1;
                Application.Run(new UninstallForm());
                return 0;
            }
            if (args.Length != 0) throw new SetupException("setup_arguments_invalid");

            MsiPayload.Verify();
            ApplicationConfiguration.Initialize();
            if (!LanguageDialog.SelectLanguage()) return 1;
            Application.Run(new SetupForm());
            return 0;
        }
        catch (Exception exception)
        {
            if (Environment.UserInteractive && interactiveCommand)
            {
                MessageBox.Show(
                    SetupFailure.Message(exception),
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

internal sealed class UninstallForm : Form
{
    private readonly CheckBox _deleteData = new()
    {
        Text = UiText.Get("uninstall.delete_data"),
        AutoSize = true,
        MaximumSize = new Size(520, 0),
    };
    private readonly Label _status = new() { AutoSize = true, ForeColor = SystemColors.GrayText };
    private readonly Button _uninstall = new() { Text = UiText.Get("uninstall.action"), AutoSize = true, Padding = new Padding(15, 5, 15, 5) };
    private readonly Button _cancel = new() { Text = UiText.Get("uninstall.cancel"), AutoSize = true, Padding = new Padding(15, 5, 15, 5) };

    public UninstallForm()
    {
        SuspendLayout();
        Text = UiText.Get("uninstall.title");
        Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath!);
        StartPosition = FormStartPosition.CenterScreen;
        AutoScaleMode = AutoScaleMode.Dpi;
        ClientSize = new Size(620, 390);
        MinimumSize = new Size(620, 390);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;

        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Fill,
            AutoScroll = true,
            ColumnCount = 1,
            Padding = new Padding(28),
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        Controls.Add(root);
        root.Controls.Add(new Label
        {
            Text = UiText.Get("uninstall.header"),
            AutoSize = true,
            Font = new Font(SystemFonts.DefaultFont.FontFamily, 18, FontStyle.Bold),
        });
        root.Controls.Add(Body(UiText.Get("uninstall.body")));
        root.Controls.Add(_deleteData);
        root.Controls.Add(Body(UiText.Get("uninstall.delete_help")));
        root.Controls.Add(_status);
        var actions = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Top, FlowDirection = FlowDirection.RightToLeft };
        actions.Controls.Add(_uninstall);
        actions.Controls.Add(_cancel);
        root.Controls.Add(actions);
        AcceptButton = _uninstall;
        CancelButton = _cancel;

        _cancel.Click += (_, _) => Close();
        _uninstall.Click += (_, _) => StartUninstall();
        AutoScaleDimensions = new SizeF(96, 96);
        ResumeLayout(performLayout: true);
    }

    private void StartUninstall()
    {
        try
        {
            if (_deleteData.Checked)
            {
                var answer = MessageBox.Show(
                    UiText.Get("uninstall.delete_confirm"),
                    UiText.Get("uninstall.delete_confirm_title"),
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Warning,
                    MessageBoxDefaultButton.Button2
                );
                if (answer != DialogResult.Yes) return;
            }
            _uninstall.Enabled = false;
            _cancel.Enabled = false;
            _status.Text = UiText.Get("uninstall.status.elevation");
            UninstallWorker.Start(_deleteData.Checked, UiText.Language);
            Close();
        }
        catch (Win32Exception exception) when (exception.NativeErrorCode == 1223)
        {
            _status.Text = UiText.Get("uninstall.status.cancelled");
            _uninstall.Enabled = true;
            _cancel.Enabled = true;
        }
        catch (Exception exception)
        {
            _status.Text = UiText.Get("uninstall.status.failed");
            MessageBox.Show($"{_status.Text}\n\n{UiText.Get("common.cause", SetupFailure.Message(exception))}", Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
            _uninstall.Enabled = true;
            _cancel.Enabled = true;
        }
    }

    private static Label Body(string text) => new()
    {
        Text = text,
        AutoSize = true,
        MaximumSize = new Size(540, 0),
        Margin = new Padding(3, 10, 3, 12),
    };
}

internal static class UninstallWorker
{
    private const int MoveFileDelayUntilReboot = 0x4;

    public static void Start(bool deleteData, string language)
    {
        var source = Environment.ProcessPath ?? throw new SetupException("setup_path_missing");
        var destination = Path.Combine(Path.GetTempPath(), $"NETGRID-Uninstall-{Guid.NewGuid():N}.exe");
        File.Copy(source, destination, overwrite: false);
        if (!HashesEqual(source, destination))
        {
            File.Delete(destination);
            throw new SetupException("uninstall_worker_hash_mismatch");
        }
        var start = new ProcessStartInfo(destination) { UseShellExecute = true, Verb = "runas", WindowStyle = ProcessWindowStyle.Hidden };
        foreach (var argument in new[] { "--uninstall-product", deleteData ? "delete" : "retain", "--language", language, "--wait-pid", Environment.ProcessId.ToString() })
            start.ArgumentList.Add(argument);
        try
        {
            Process.Start(start)?.Dispose();
        }
        catch
        {
            File.Delete(destination);
            throw;
        }
    }

    public static void ValidateAndWait(int processId)
    {
        var executable = Path.GetFullPath(Environment.ProcessPath ?? string.Empty);
        var temporaryRoot = Path.GetFullPath(Path.GetTempPath()).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        if (!executable.StartsWith(temporaryRoot, StringComparison.OrdinalIgnoreCase) || !Path.GetFileName(executable).StartsWith("NETGRID-Uninstall-", StringComparison.Ordinal) || !executable.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
            throw new SetupException("uninstall_worker_location_invalid");
        if (processId == Environment.ProcessId) throw new SetupException("uninstall_parent_invalid");
        try
        {
            using var parent = Process.GetProcessById(processId);
            if (!parent.WaitForExit(30_000)) throw new SetupException("uninstall_parent_running");
        }
        catch (ArgumentException)
        {
            // The initiating setup process has already exited.
        }
    }

    public static void ScheduleSelfRemoval()
    {
        var executable = Environment.ProcessPath;
        if (string.IsNullOrWhiteSpace(executable)) return;
        try
        {
            File.Delete(executable);
        }
        catch (IOException)
        {
            _ = MoveFileEx(executable, null, MoveFileDelayUntilReboot);
        }
        catch (UnauthorizedAccessException)
        {
            _ = MoveFileEx(executable, null, MoveFileDelayUntilReboot);
        }
    }

    private static bool HashesEqual(string left, string right)
    {
        using var leftStream = File.OpenRead(left);
        using var rightStream = File.OpenRead(right);
        return CryptographicOperations.FixedTimeEquals(SHA256.HashData(leftStream), SHA256.HashData(rightStream));
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool MoveFileEx(string existingFileName, string? newFileName, int flags);
}

internal enum InstallationPhase { Validating, Preparing, Elevation, Installing, FirstRun, Completed }

internal sealed class SetupForm : Form
{
    private readonly ToolTip _helpToolTip = SetupHelpToolTip.Create();
    private readonly RadioButton _recommended = new() { Text = UiText.Get("setup.recommended"), Checked = true, AutoSize = true };
    private readonly RadioButton _custom = new() { Text = UiText.Get("setup.custom"), AutoSize = true };
    private readonly RadioButton _local = new() { Text = UiText.Get("setup.local"), Checked = true, AutoSize = true };
    private readonly RadioButton _lan = new() { Text = UiText.Get("setup.lan"), AutoSize = true };
    private readonly TextBox _programRoot = new() { Dock = DockStyle.Fill };
    private readonly TextBox _dataRoot = new() { Dock = DockStyle.Fill };
    private readonly NumericUpDown _webPort = new() { Minimum = 1, Maximum = 65535, Value = 3100, Width = 90 };
    private readonly NumericUpDown _serverPort = new() { Minimum = 1, Maximum = 65535, Value = 8787, Width = 90 };
    private readonly ComboBox _retention = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 210 };
    private readonly ComboBox _accountMode = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 400 };
    private readonly CheckBox _desktop = new() { Text = UiText.Get("setup.desktop"), Checked = true, AutoSize = true };
    private readonly CheckBox _launch = new() { Text = UiText.Get("setup.launch"), Checked = true, AutoSize = true };
    private readonly Label _lanAddress = new() { AutoSize = true };
    private readonly Label _dataNotice = Body(UiText.Get("setup.data.help"));
    private readonly Label _status = new() { AutoSize = true, MaximumSize = new Size(660, 0), ForeColor = SystemColors.GrayText };
    private readonly ProgressBar _progress = new() { Dock = DockStyle.Top, Height = 20, Visible = false, MarqueeAnimationSpeed = 0 };
    private readonly Button _install = new() { Text = UiText.Get("setup.install"), AutoSize = true, Padding = new Padding(18, 6, 18, 6) };
    private readonly IReadOnlyList<string> _privateAddresses = NetworkSelection.PrivateIpv4Addresses();

    public SetupForm()
    {
        SuspendLayout();
        Text = $"NETGRID Setup {MsiPayload.ProductVersion}";
        Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath!);
        StartPosition = FormStartPosition.CenterScreen;
        AutoScaleMode = AutoScaleMode.Dpi;
        MinimumSize = new Size(760, 760);
        ClientSize = new Size(800, 920);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;

        _programRoot.Text = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "NETGRID");
        _dataRoot.Text = ExistingDataRoot() ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "NETGRID");
        _retention.Items.AddRange(SetupContract.RetentionChoices.Cast<object>().ToArray());
        _retention.SelectedIndex = 1;
        _accountMode.Items.AddRange(new object[]
        {
            new AccountModeChoice("simple", UiText.Get("setup.account.simple")),
            new AccountModeChoice("protected", UiText.Get("setup.account.protected")),
        });
        _accountMode.SelectedIndex = 0;
        _lanAddress.Text = _privateAddresses.Count > 0
            ? UiText.Get("setup.lan.found", _privateAddresses[0])
            : UiText.Get("setup.lan.missing");

        // The viewport scrolls the table's complete preferred height. A filling
        // TableLayoutPanel with AutoScroll can leave its final auto-sized row
        // beyond the scroll extent when the available height is constrained.
        var viewport = new Panel { Dock = DockStyle.Fill, AutoScroll = true };
        var root = new TableLayoutPanel
        {
            Dock = DockStyle.Top,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            ColumnCount = 1,
            Padding = new Padding(28),
        };
        root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        viewport.Controls.Add(root);
        Controls.Add(viewport);
        root.Controls.Add(Flow(
            new PictureBox { Image = Icon?.ToBitmap(), SizeMode = PictureBoxSizeMode.Zoom, Size = new Size(44, 44), Margin = new Padding(3, 0, 12, 6) },
            Heading(UiText.Get("setup.header"), 18)
        ));
        root.Controls.Add(Body(UiText.Get("setup.body")));
        root.Controls.Add(Group(UiText.Get("setup.path"), Flow(
            _recommended, Help("setup.recommended", "setup.help.recommended", _recommended),
            _custom, Help("setup.custom", "setup.help.custom", _custom))));
        var network = new TableLayoutPanel { AutoSize = true, Dock = DockStyle.Top, ColumnCount = 2 };
        network.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        network.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        // Keep both radio buttons under one parent so Windows maintains exclusivity.
        network.Controls.Add(_local, 0, 0);
        network.Controls.Add(Help("setup.local", "setup.help.local", _local), 1, 0);
        var localHelp = Body(UiText.Get("setup.local.help"));
        network.Controls.Add(localHelp, 0, 1);
        network.SetColumnSpan(localHelp, 2);
        network.Controls.Add(_lan, 0, 2);
        network.Controls.Add(Help("setup.lan", "setup.help.lan", _lan), 1, 2);
        var lanHelp = Body(UiText.Get("setup.lan.help"));
        network.Controls.Add(lanHelp, 0, 3);
        network.SetColumnSpan(lanHelp, 2);
        network.Controls.Add(_lanAddress, 0, 4);
        network.SetColumnSpan(_lanAddress, 2);
        var maintenanceHelp = new LinkLabel { Text = UiText.Get("setup.maintenance.help_link"), AutoSize = true, Margin = new Padding(3, 7, 3, 5), AccessibleDescription = UiText.Get("setup.help.maintenance") };
        maintenanceHelp.LinkClicked += (_, _) => ShowHelp("setup.maintenance.help_link", "setup.help.maintenance");
        _helpToolTip.SetToolTip(maintenanceHelp, UiText.Get("setup.help.maintenance"));
        network.Controls.Add(maintenanceHelp, 0, 5);
        network.SetColumnSpan(maintenanceHelp, 2);
        root.Controls.Add(Group(UiText.Get("setup.profile"), network));

        var advanced = new TableLayoutPanel { AutoSize = true, Dock = DockStyle.Top, ColumnCount = 3 };
        advanced.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        advanced.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        advanced.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        AddPathRow(advanced, 0, "setup.program", "setup.help.program", _programRoot);
        AddPathRow(advanced, 1, "setup.data", "setup.help.data", _dataRoot);
        advanced.Controls.Add(OptionLabel("setup.ports", "setup.help.ports", _webPort, _serverPort), 0, 2);
        advanced.Controls.Add(Flow(_webPort, new Label { Text = "/", AutoSize = true }, _serverPort), 1, 2);
        advanced.Controls.Add(OptionLabel("setup.retention", "setup.help.retention", _retention), 0, 3);
        advanced.Controls.Add(_retention, 1, 3);
        advanced.Controls.Add(OptionLabel("setup.accounts", "setup.help.accounts", _accountMode), 0, 4);
        advanced.Controls.Add(_accountMode, 1, 4);
        advanced.SetColumnSpan(_accountMode, 2);
        root.Controls.Add(Group(UiText.Get("setup.advanced"), advanced));
        root.Controls.Add(Flow(_desktop, Help("setup.desktop", "setup.help.desktop", _desktop), _launch, Help("setup.launch", "setup.help.launch", _launch)));
        // Keep feedback and the primary action visible even when translated
        // options need to scroll in a smaller window.
        var footer = new TableLayoutPanel
        {
            AutoSize = true,
            Dock = DockStyle.Bottom,
            ColumnCount = 1,
            Padding = new Padding(28, 8, 28, 20),
        };
        footer.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        footer.Controls.Add(_dataNotice);
        footer.Controls.Add(_status);
        footer.Controls.Add(_progress);
        var actions = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Top, FlowDirection = FlowDirection.RightToLeft };
        actions.Controls.Add(_install);
        footer.Controls.Add(actions);
        Controls.Add(footer);

        _recommended.CheckedChanged += (_, _) => UpdateAdvancedState();
        _custom.CheckedChanged += (_, _) => UpdateAdvancedState();
        _lan.CheckedChanged += (_, _) => UpdateLanState();
        _install.Click += async (_, _) => await InstallAsync();
        UpdateAdvancedState();
        UpdateLanState();
        // All fixed dimensions above are authored at 96 DPI. Without this
        // baseline WinForms treats them as already scaled on a high-DPI PC.
        AutoScaleDimensions = new SizeF(96, 96);
        ResumeLayout(performLayout: true);
        _retention.FontChanged += (_, _) => FitChoiceWidths();
        _accountMode.FontChanged += (_, _) => FitChoiceWidths();
    }

    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        var available = Screen.FromControl(this).WorkingArea.Size;
        MinimumSize = new Size(Math.Min(MinimumSize.Width, available.Width), Math.Min(MinimumSize.Height, available.Height));
        MaximumSize = available;
        FitChoiceWidths();
    }

    private void FitChoiceWidths()
    {
        foreach (var choice in new[] { _retention, _accountMode })
        {
            var textWidth = choice.Items.Cast<object>().Max(item => TextRenderer.MeasureText(item.ToString(), choice.Font).Width);
            // Include the native arrow and text insets in the current DPI.
            var requiredWidth = textWidth + choice.LogicalToDeviceUnits(24);
            choice.MinimumSize = new Size(requiredWidth, 0);
            choice.Width = requiredWidth;
            choice.DropDownWidth = requiredWidth;
        }
    }

    private async Task InstallAsync()
    {
        try
        {
            ToggleUi(false);
            SetInstallationPhase(InstallationPhase.Validating);
            var settings = ReadSettings();
            settings.Validate();
            await Task.Run(() => InstallationSpace.Check(settings.ProgramRoot, settings.DataRoot, InstallationWorker.TemporaryRoot));
            if (!PortPlanner.AreAvailable(settings.Profile, settings.WebPort, settings.ServerPort))
            {
                if (!_recommended.Checked)
                    throw new SetupException("ports_busy");
                var alternative = PortPlanner.FindAlternative(settings.Profile, settings.WebPort, settings.ServerPort);
                var answer = MessageBox.Show(
                    UiText.Get("setup.port.offer", alternative.WebPort, alternative.ServerPort),
                    UiText.Get("setup.port.title"),
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question
                );
                if (answer != DialogResult.Yes) throw new SetupException("ports_declined");
                _webPort.Value = alternative.WebPort;
                _serverPort.Value = alternative.ServerPort;
                settings = ReadSettings();
            }
            var progress = new Progress<InstallationPhase>(SetInstallationPhase);
            var measured = new Progress<MsiProgressSnapshot>(SetMsiProgress);
            var result = await Task.Run(() => Installer.Run(settings, progress, measured));
            if (result.Code is not (0 or 3010)) throw new SetupException("msi_failed", result.Code, result.LogPath);
            SetInstallationPhase(InstallationPhase.FirstRun);
            var firstRunResult = await Task.Run(() => Installer.RunFirstRun(settings));
            if (firstRunResult > 1)
            {
                MessageBox.Show(
                    UiText.Get("setup.first_run.warning"),
                    "NETGRID Setup",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
            }
            if (_launch.Checked)
            {
                Process.Start(new ProcessStartInfo(Path.Combine(settings.ProgramRoot, "NETGRID.exe")) { UseShellExecute = true });
            }
            SetInstallationPhase(InstallationPhase.Completed);
            MessageBox.Show(UiText.Get("setup.status.success"), "NETGRID Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
            Close();
        }
        catch (Win32Exception exception) when (exception.NativeErrorCode == 1223)
        {
            StopProgress();
            _status.Text = UiText.Get("setup.status.cancelled");
            MessageBox.Show(_status.Text, "NETGRID Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
            ToggleUi(true);
        }
        catch (Exception exception)
        {
            StopProgress();
            _status.Text = SetupFailure.Message(exception);
            MessageBox.Show(_status.Text, "NETGRID Setup", MessageBoxButtons.OK, MessageBoxIcon.Error);
            ToggleUi(true);
        }
    }

    private SetupSettings ReadSettings()
    {
        var retention = (RetentionChoice?)_retention.SelectedItem ?? throw new SetupException("retention_missing");
        var accountMode = (AccountModeChoice?)_accountMode.SelectedItem ?? throw new SetupException("account_mode_missing");
        return new SetupSettings(
            _lan.Checked ? "private_lan" : "local",
            _lan.Checked ? _privateAddresses.FirstOrDefault() : null,
            SetupSettings.ReadRoot(_programRoot.Text.Trim(), UiText.Get("setup.program")),
            SetupSettings.ReadRoot(_dataRoot.Text.Trim(), UiText.Get("setup.data")),
            decimal.ToInt32(_webPort.Value),
            decimal.ToInt32(_serverPort.Value),
            retention.Value,
            accountMode.Value,
            _desktop.Checked
        );
    }

    private void ToggleUi(bool enabled)
    {
        // Keep the feedback's parent enabled so the label stays legible and the
        // native marquee can animate while the interactive sections are locked.
        foreach (Control root in Controls)
            foreach (Control control in root.Controls)
                if (control != _dataNotice && control != _status && control != _progress) control.Enabled = enabled;
        if (enabled) UpdateAdvancedState();
    }

    internal void SetInstallationPhase(InstallationPhase phase)
    {
        var key = phase switch
        {
            InstallationPhase.Validating => "setup.status.validate",
            InstallationPhase.Preparing => "setup.status.prepare",
            InstallationPhase.Elevation => "setup.status.elevation",
            InstallationPhase.Installing => "setup.status.installing",
            InstallationPhase.FirstRun => "setup.status.first_run",
            InstallationPhase.Completed => "setup.status.success",
            _ => throw new ArgumentOutOfRangeException(nameof(phase)),
        };
        var running = phase is not (InstallationPhase.FirstRun or InstallationPhase.Completed);
        _status.Text = UiText.Get(key);
        _status.ForeColor = SystemColors.ControlText;
        _progress.AccessibleName = _status.Text;
        _progress.Style = running ? ProgressBarStyle.Marquee : ProgressBarStyle.Continuous;
        _progress.MarqueeAnimationSpeed = running ? 30 : 0;
        _progress.Value = running ? 0 : _progress.Maximum;
        _progress.Visible = true;
    }

    internal void SetMsiProgress(MsiProgressSnapshot snapshot)
    {
        var percent = snapshot.Percent;
        _status.Text = percent is int value
            ? UiText.Get(snapshot.Backward ? "setup.status.measured_reverse" : "setup.status.measured", value)
            : UiText.Get(snapshot.Preparing ? "setup.status.measuring" : "setup.status.unmeasured");
        _status.ForeColor = SystemColors.ControlText;
        _progress.AccessibleName = _status.Text;
        _progress.Style = percent.HasValue ? ProgressBarStyle.Continuous : ProgressBarStyle.Marquee;
        _progress.MarqueeAnimationSpeed = percent.HasValue ? 0 : 30;
        _progress.Value = percent ?? 0;
        _progress.Visible = true;
    }

    private void StopProgress()
    {
        _progress.MarqueeAnimationSpeed = 0;
        _progress.Visible = false;
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
            _status.Text = UiText.Get("setup.failure.lan_address_missing");
        else if (_status.Text == UiText.Get("setup.failure.lan_address_missing"))
            _status.Text = string.Empty;
    }

    private void AddPathRow(TableLayoutPanel table, int row, string labelKey, string helpKey, TextBox box)
    {
        table.Controls.Add(OptionLabel(labelKey, helpKey, box), 0, row);
        table.Controls.Add(box, 1, row);
        var browse = new Button { Text = UiText.Get("setup.browse"), AutoSize = true };
        browse.Click += (_, _) =>
        {
            using var dialog = new FolderBrowserDialog { SelectedPath = box.Text, ShowNewFolderButton = true };
            if (dialog.ShowDialog(this) == DialogResult.OK) box.Text = dialog.SelectedPath;
        };
        table.Controls.Add(browse, 2, row);
    }

    private Button Help(string labelKey, string helpKey, params Control[] targets)
    {
        var description = UiText.Get(helpKey);
        var button = new Button
        {
            Name = helpKey, Text = "?", Size = new Size(26, 26), TabStop = true,
            AccessibleName = UiText.Get("setup.help.title", UiText.Get(labelKey)),
            AccessibleDescription = description,
            Margin = new Padding(3, 0, 8, 0),
        };
        _helpToolTip.SetToolTip(button, description);
        foreach (var target in targets)
        {
            _helpToolTip.SetToolTip(target, description);
            target.AccessibleDescription = description;
        }
        button.Click += (_, _) => ShowHelp(labelKey, helpKey);
        return button;
    }

    private Control OptionLabel(string labelKey, string helpKey, params Control[] targets)
    {
        var panel = new FlowLayoutPanel { AutoSize = true, WrapContents = false, Anchor = AnchorStyles.Left, Margin = Padding.Empty };
        panel.Controls.Add(new Label { Text = UiText.Get(labelKey), AutoSize = true, Margin = new Padding(3, 5, 3, 0) });
        panel.Controls.Add(Help(labelKey, helpKey, targets));
        return panel;
    }

    private void ShowHelp(string labelKey, string helpKey) => MessageBox.Show(this,
        UiText.Get(helpKey), UiText.Get("setup.help.title", UiText.Get(labelKey)),
        MessageBoxButtons.OK, MessageBoxIcon.Information);

    protected override void Dispose(bool disposing)
    {
        if (disposing) _helpToolTip.Dispose();
        base.Dispose(disposing);
    }

    private static GroupBox Group(string title, Control content)
    {
        var group = new GroupBox { Text = title, AutoSize = false, Dock = DockStyle.Top, Padding = new Padding(14) };
        group.Controls.Add(content);
        content.Dock = DockStyle.Top;
        group.Height = content.GetPreferredSize(new Size(700, 0)).Height + 55;
        return group;
    }

    private static FlowLayoutPanel Flow(params Control[] controls)
    {
        var flow = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Top, FlowDirection = FlowDirection.LeftToRight, WrapContents = true };
        flow.Controls.AddRange(controls);
        return flow;
    }

    private static FlowLayoutPanel Stack(params Control[] controls)
    {
        var flow = new FlowLayoutPanel { AutoSize = true, Dock = DockStyle.Top, FlowDirection = FlowDirection.TopDown, WrapContents = false, MaximumSize = new Size(700, 0) };
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
        if (Profile is not ("local" or "private_lan") || AccountAccessMode is not ("simple" or "protected") ||
            RetentionDays is not ("7" or "30" or "90" or "180" or "365" or "never") ||
            (Profile == "local" && LanAddress is not null))
            throw new SetupException("setup_arguments_invalid");
        if (Profile == "private_lan" && LanAddress is null) throw new SetupException("lan_address_missing");
        if (LanAddress is not null && (!IPAddress.TryParse(LanAddress, out var address) || !NetworkSelection.IsPrivate(address)))
            throw new SetupException("lan_address_missing");
        if (WebPort is < 1 or > 65535 || ServerPort is < 1 or > 65535) throw new SetupException("port_invalid");
        if (WebPort == ServerPort) throw new SetupException("ports_conflict");
        ValidateRoot(ProgramRoot, UiText.Get("setup.program"));
        ValidateRoot(DataRoot, UiText.Get("setup.data"));
        if (Contains(ProgramRoot, DataRoot) || Contains(DataRoot, ProgramRoot))
            throw new SetupException("path_overlap");
    }

    public static string ReadRoot(string path, string label)
    {
        try
        {
            if (!Path.IsPathFullyQualified(path) || path.StartsWith(@"\\", StringComparison.Ordinal))
                throw new SetupException("path_invalid", label);
            return Path.GetFullPath(path);
        }
        catch (Exception exception) when (exception is ArgumentException or NotSupportedException or PathTooLongException)
        {
            throw new SetupException("path_invalid", label);
        }
    }

    private static void ValidateRoot(string path, string label)
    {
        if (!Path.IsPathFullyQualified(path) || path.StartsWith(@"\\", StringComparison.Ordinal))
            throw new SetupException("path_invalid", label);
        var root = Path.GetPathRoot(path);
        if (string.IsNullOrWhiteSpace(root) || string.Equals(Path.TrimEndingDirectorySeparator(path), Path.TrimEndingDirectorySeparator(root), StringComparison.OrdinalIgnoreCase))
            throw new SetupException("path_too_broad", label);
        var drive = new DriveInfo(root);
        if (!drive.IsReady || drive.DriveType != DriveType.Fixed)
            throw new SetupException("path_drive_invalid", label);
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

    public static Task<InstallationResult> Run(SetupSettings settings, IProgress<InstallationPhase> progress,
        IProgress<MsiProgressSnapshot> measured)
    {
        settings.Validate();
        InstallationSpace.Check(settings.ProgramRoot, settings.DataRoot, InstallationWorker.TemporaryRoot);
        progress.Report(InstallationPhase.Preparing);
        MsiPayload.Verify();
        return InstallationWorker.Start(settings, progress, measured);
    }

    internal static string Properties(SetupSettings settings)
    {
        settings.Validate();
        return string.Join(" ", new[]
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
                Property("NETGRID_UI_LANGUAGE", UiText.Language),
                Property("NETGRID_SETUP_SOURCE", Environment.ProcessPath ?? throw new SetupException("setup_path_missing")),
                Property("NETGRID_SETUP_SHA256", CurrentSetupHash()),
        });
    }

    public static int RunUpdate(string? programRoot, bool uninstall, bool deleteData = false, string? updateLease = null)
    {
        var temporaryMsi = Path.Combine(Path.GetTempPath(), $"NETGRID-{Guid.NewGuid():N}.msi");
        try
        {
            // Keep the real updater handle through MSI completion. Neither a
            // guessed nonce nor a recycled PID authorizes joining its lease.
            using var updateOwner = updateLease is null ? null : BindUpdateOwner(programRoot, updateLease, deleteData);
            var action = uninstall ? "/x" : "/i";
            var arguments = $"{action} {Quote(temporaryMsi)} /qn /norestart /l*v {Quote(LogPath)}";
            if (updateLease is not null)
            {
                arguments += " " + UpdateLeaseProperty(updateLease);
                if (uninstall) arguments += " " + Property("INSTALLFOLDER", programRoot!);
            }
            if (uninstall && deleteData) arguments += " DELETEUSERDATA=1";
            if (!uninstall)
            {
                if (string.IsNullOrWhiteSpace(programRoot)) throw new SetupException("update_program_root_missing");
                using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false);
                var dataRoot = key?.GetValue("RuntimeDataRoot") as string;
                if (string.IsNullOrWhiteSpace(dataRoot)) throw new SetupException("update_data_root_missing");
                InstallationSpace.Check(programRoot, dataRoot);
                var desktop = ReadDesktopShortcutPreference(key?.GetValue("DesktopShortcutPreference"));
                arguments += $" {Property("INSTALLFOLDER", Path.GetFullPath(programRoot))} {Property("NETGRID_DATA_ROOT", Path.GetFullPath(dataRoot))} {Property("INSTALLDESKTOPSHORTCUT", desktop)} {Property("NETGRID_SETUP_SOURCE", Environment.ProcessPath ?? throw new SetupException("setup_path_missing"))} {Property("NETGRID_SETUP_SHA256", CurrentSetupHash())}";
            }
            MsiPayload.ExtractVerified(temporaryMsi);
            using var process = Process.Start(new ProcessStartInfo("msiexec.exe")
            {
                Arguments = arguments,
                UseShellExecute = true,
                Verb = "runas",
                WindowStyle = ProcessWindowStyle.Hidden,
            }) ?? throw new SetupException("msi_start_failed");
            process.WaitForExit();
            return process.ExitCode;
        }
        finally
        {
            if (File.Exists(temporaryMsi)) File.Delete(temporaryMsi);
        }
    }

    internal static string UpdateLeaseProperty(string lease)
    {
        try { InstallationGate.ValidateLease(lease); }
        catch (InvalidOperationException) { throw new SetupException("update_context_invalid"); }
        return Property("NETGRID_UPDATE_LEASE", lease);
    }

    private static Process BindUpdateOwner(string? programRoot, string lease, bool deleteData)
    {
        if (programRoot is null || deleteData) throw new SetupException("update_context_invalid");
        using var machine = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
        using var registration = machine.OpenSubKey(@"SOFTWARE\LevelX2\NETGRID", writable: false);
        var installedRoot = registration?.GetValue("InstallDirectory") as string;
        if (installedRoot is null || !Path.TrimEndingDirectorySeparator(Path.GetFullPath(installedRoot))
            .Equals(Path.TrimEndingDirectorySeparator(Path.GetFullPath(programRoot)), StringComparison.OrdinalIgnoreCase))
            throw new SetupException("update_context_invalid");
        return InstallationGate.OpenUpdateOwner(machine, programRoot, lease);
    }

    public static string ReadDesktopShortcutPreference(object? value) => value is "0" or "1"
        ? (string)value : throw new SetupException("update_desktop_preference_invalid");

    private static string CurrentSetupHash()
    {
        var source = Environment.ProcessPath ?? throw new SetupException("setup_path_missing");
        using var stream = File.OpenRead(source);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }

    public static int RunFirstRun(SetupSettings settings)
    {
        var executable = Path.Combine(settings.ProgramRoot, "NETGRID.FirstRun.exe");
        if (!File.Exists(executable)) return 2;
        using var process = Process.Start(new ProcessStartInfo(executable) { UseShellExecute = true })
            ?? throw new SetupException("first_run_start_failed");
        process.WaitForExit();
        return process.ExitCode;
    }

    private static string Property(string name, string value)
    {
        if (value.IndexOfAny(['"', '\r', '\n']) >= 0) throw new SetupException("msi_property_invalid");
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
    public static InstallationFootprint Footprint => new(
        PositiveMetadata("NetgridPayloadBytes"), PositiveMetadata("NetgridPayloadFileCount"), PositiveMetadata("NetgridMsiBytes"));

    private static long PositiveMetadata(string key) =>
        Metadata.TryGetValue(key, out var value) && long.TryParse(value, out var number) && number > 0
            ? number : throw new SetupException("disk_space_metadata_invalid");

    public static void Verify()
    {
        using var stream = Open();
        VerifyHash(stream);
    }

    public static void ExtractVerified(string target)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(target) ?? throw new SetupException("payload_target_invalid"));
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
        ?? throw new SetupException("payload_missing");

    private static void VerifyHash(Stream stream)
    {
        var expected = Metadata.GetValueOrDefault("NetgridMsiSha256");
        if (string.IsNullOrWhiteSpace(expected) || expected.Length != 64) throw new SetupException("payload_hash_missing");
        var actual = Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
        if (!string.Equals(actual, expected, StringComparison.Ordinal)) throw new SetupException("payload_hash_mismatch");
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

    internal static bool IsPrivate(IPAddress address)
    {
        if (address.AddressFamily != AddressFamily.InterNetwork) return false;
        var bytes = address.GetAddressBytes();
        return bytes[0] == 10 || (bytes[0] == 172 && bytes[1] is >= 16 and <= 31) || (bytes[0] == 192 && bytes[1] == 168);
    }
}

internal static class PortPlanner
{
    public static int ParsePort(string value)
    {
        if (!int.TryParse(value, out var port) || port is < 1 or > 65535) throw new SetupException("port_invalid");
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
        throw new SetupException("ports_unavailable");
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
    public static RetentionChoice[] RetentionChoices =>
    [
        new("7", UiText.Get("setup.retention.days", 7)),
        new("30", UiText.Get("setup.retention.recommended")),
        new("90", UiText.Get("setup.retention.days", 90)),
        new("180", UiText.Get("setup.retention.days", 180)),
        new("365", UiText.Get("setup.retention.days", 365)),
        new("never", UiText.Get("setup.retention.never")),
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
        uninstall = new { defaultMode = "retain-data", explicitMode = "delete-data", localizedConfirmation = true },
        installerRollback = "msi-major-upgrade",
        installationSpace = new
        {
            footprint = MsiPayload.Footprint,
            initialDataReserveBytes = InstallationSpace.InitialDataReserveBytes,
            includesTemporaryPayloadReserve = true,
            aggregatesSharedDrives = true,
        },
    };
}

internal sealed class SetupException(string code, params object[] arguments) : Exception(UiText.Get($"setup.failure.{code}", arguments))
{
    public string Code { get; } = code;
}


internal static class SetupFailure
{
    public static string Message(Exception exception) => exception is SetupException setup
        ? setup.Message
        : $"{UiText.Get("setup.operation.failed")}\n\n{UiText.Get("common.cause", $"{exception.GetType().Name} (0x{exception.HResult:X8})")}";
}
