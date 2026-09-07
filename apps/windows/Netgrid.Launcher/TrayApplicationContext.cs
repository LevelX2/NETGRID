namespace Netgrid.Launcher;
using Netgrid.Windows;

internal sealed class TrayApplicationContext : ApplicationContext
{
    private readonly LauncherOptions _options;
    private readonly NotifyIcon _tray;
    private readonly Control _dispatcher;
    private readonly ToolStripMenuItem _prerelease;
    private LauncherRuntime? _runtime;
    private bool _closing;
    private bool _checkingUpdates;

    public TrayApplicationContext(LauncherOptions options)
    {
        _options = options;
        _dispatcher = new Control();
        _dispatcher.CreateControl();
        var menu = new ContextMenuStrip();
        menu.Items.Add(UiText.Get("launcher.open"), null, (_, _) => OpenGame());
        menu.Items.Add(UiText.Get("launcher.maintenance"), null, (_, _) => OpenMaintenance());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(UiText.Get("launcher.updates"), null, async (_, _) => await CheckForUpdatesAsync(manual: true));
        _prerelease = new ToolStripMenuItem(UiText.Get("launcher.prerelease")) { CheckOnClick = true };
        _prerelease.CheckedChanged += (_, _) => SaveUpdateSetting();
        menu.Items.Add(_prerelease);
        menu.Items.Add(UiText.Get("launcher.diagnostics"), null, (_, _) => ExportDiagnostics());
        menu.Items.Add(UiText.Get("launcher.notices"), null, (_, _) => OpenNotices());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(UiText.Get("launcher.exit"), null, async (_, _) => await CloseAsync());
        _tray = new NotifyIcon
        {
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath) ?? SystemIcons.Application,
            Text = UiText.Get("launcher.starting"),
            ContextMenuStrip = menu,
            Visible = true,
        };
        _tray.DoubleClick += (_, _) => OpenGame();
        _ = StartAsync();
    }

    public int ExitCode { get; private set; }

    private async Task StartAsync()
    {
        try
        {
            _runtime = LauncherRuntime.Load(_options);
            _runtime.InstallationStopped += (_, messageKey) => Dispatch(async () =>
            {
                if (_closing) return;
                if (messageKey is not null)
                    MessageBox.Show(UiText.Get(messageKey), "NETGRID", MessageBoxButtons.OK, MessageBoxIcon.Error);
                await CloseAsync();
            });
            _runtime.FatalFailure += RuntimeOnFatalFailure;
            _runtime.Recovered += (_, _) => Dispatch(() => ShowInfo(UiText.Get("launcher.recovered")));
            await _runtime.StartAsync();
            _tray.Text = UiText.Get("launcher.running");
            var settings = UpdateSettings.Load(_runtime.DataRoot);
            _prerelease.Checked = settings.AllowPrerelease;
            if (_options.OpenMaintenance) OpenMaintenance();
            else OpenGame();
            _ = CheckForUpdatesAsync(manual: false);
        }
        catch (Exception)
        {
            ExitCode = 2;
            _tray.Text = UiText.Get("launcher.start.failed");
            MessageBox.Show(
                $"{UiText.Get("launcher.start.failed")}\n\n{UiText.Get("launcher.error.help")}",
                "NETGRID",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            await CloseAsync();
        }
    }

    private void RuntimeOnFatalFailure(object? sender, string message)
    {
        Dispatch(async () => await HandleFatalFailureAsync(message));
    }

    private async Task HandleFatalFailureAsync(string message)
    {
        if (_closing || _runtime is null) return;
        _tray.Text = UiText.Get("launcher.stopped");
        var action = RecoveryDialog.Show(message, _runtime.LogDirectory);
        if (action == RecoveryAction.Retry)
        {
            try
            {
                _tray.Text = UiText.Get("launcher.starting");
                await _runtime.StartAsync();
                _tray.Text = UiText.Get("launcher.running");
                OpenGame();
            }
            catch (Exception)
            {
                MessageBox.Show(
                    $"{UiText.Get("launcher.retry.failed")}\n\n{UiText.Get("launcher.error.help")}",
                    "NETGRID",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
        else if (action == RecoveryAction.Exit)
        {
            await CloseAsync();
        }
    }

    private void OpenGame()
    {
        if (_runtime is not null) Program.OpenUrl(_runtime.WebUrl.ToString());
    }

    private void OpenMaintenance()
    {
        if (_runtime is not null) Program.OpenUrl(new Uri(_runtime.WebUrl, "/maintenance").ToString());
    }

    private void ShowInfo(string message)
    {
        _tray.BalloonTipTitle = "NETGRID";
        _tray.BalloonTipText = message;
        _tray.ShowBalloonTip(4000);
    }

    private void ExportDiagnostics()
    {
        if (_runtime is null) return;
        using var dialog = new SaveFileDialog
        {
            Filter = UiText.Get("diagnostics.filter"),
            FileName = $"NETGRID-diagnostics-{DateTime.Now:yyyyMMdd-HHmmss}.zip",
            AddExtension = true,
            DefaultExt = "zip",
        };
        if (dialog.ShowDialog() != DialogResult.OK) return;
        try
        {
            DiagnosticsExporter.Export(_runtime, dialog.FileName);
            MessageBox.Show(UiText.Get("diagnostics.success"), "NETGRID", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        catch
        {
            MessageBox.Show(UiText.Get("diagnostics.failed"), "NETGRID", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void OpenNotices()
    {
        if (_runtime is null) return;
        var path = Path.Combine(_runtime.ProgramRoot, "legal", "THIRD-PARTY-NOTICES.txt");
        if (File.Exists(path)) System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(path) { UseShellExecute = true });
    }

    private void SaveUpdateSetting()
    {
        if (_runtime is null) return;
        try
        {
            new UpdateSettings(_prerelease.Checked).Save(_runtime.DataRoot);
        }
        catch (Exception)
        {
            MessageBox.Show(UiText.Get("launcher.setting.failed"), "NETGRID", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private async Task CheckForUpdatesAsync(bool manual)
    {
        if (_checkingUpdates || _closing || _runtime is null) return;
        var runtime = _runtime;
        _checkingUpdates = true;
        var stage = UpdateStage.Checking;
        try
        {
            using var http = UpdateDiscovery.CreateHttpClient();
            var candidate = await UpdateDiscovery.CheckAsync(http, UpdateDiscovery.GitHubReleasesApi, InstalledProduct.Version(_runtime.ProgramRoot), _prerelease.Checked);
            if (candidate is null)
            {
                if (manual) MessageBox.Show(UiText.Get("launcher.update.current"), "NETGRID Updates", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            var prereleaseWarning = candidate.Prerelease
                ? UiText.Get("launcher.update.prerelease_warning")
                : string.Empty;
            var answer = MessageBox.Show(
                UiText.Get("launcher.update.available", candidate.Version, candidate.ReleaseNotes, prereleaseWarning),
                "NETGRID Update",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );
            if (answer != DialogResult.Yes) return;
            stage = UpdateStage.Preparing;
            var readiness = await _runtime.UpdateReadinessAsync();
            if (!readiness.Allowed)
            {
                MessageBox.Show(UiText.Get("launcher.update.blocked", readiness.ActiveMatchCount), "NETGRID Update", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            _tray.Text = UiText.Get("launcher.update.loading");
            var staging = Path.Combine(_runtime.DataRoot, "runtime", "updates", "staging");
            stage = UpdateStage.Downloading;
            var setupPath = await UpdateDiscovery.DownloadVerifiedAsync(http, candidate, staging);
            stage = UpdateStage.Preparing;
            if (_closing) return;
            var activeMatches = await UpdateTransfer.RunAsync(runtime, setupPath, candidate.SetupSha256);
            if (activeMatches is > 0)
                MessageBox.Show(UiText.Get("launcher.update.blocked", activeMatches.Value), "NETGRID Update", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            if (runtime.IsTerminallyStopping) await CloseAsync();
            else if (!_closing) _tray.Text = UiText.Get("launcher.running");
        }
        catch (Exception exception)
        {
            var failure = UpdateFailure.Classify(exception, stage, manual);
            try { failure.Record(runtime.LogDirectory); }
            catch (Exception logException) when (logException is IOException or UnauthorizedAccessException)
            {
                // Surface both failures. Never direct the user to a diagnostic
                // file that could not be written or silently discard the cause.
                MessageBox.Show($"{UiText.Get(failure.MessageKey)}\n\n" +
                    UiText.Get("launcher.update.diagnostic_failed", failure.Diagnostic,
                        $"{logException.GetType().Name} (0x{logException.HResult:X8})"),
                    "NETGRID Update", MessageBoxButtons.OK, MessageBoxIcon.Error);
                if (!_closing && !runtime.IsTerminallyStopping) _tray.Text = UiText.Get("launcher.running");
                return;
            }
            if (!failure.Quiet)
                MessageBox.Show(UiText.Get(failure.MessageKey) +
                    (failure.Unavailable ? string.Empty : $"\n\n{UiText.Get("launcher.error.help")}"),
                    "NETGRID Update", MessageBoxButtons.OK, failure.Unavailable ? MessageBoxIcon.Information : MessageBoxIcon.Error);
            if (!_closing && !runtime.IsTerminallyStopping) _tray.Text = UiText.Get("launcher.running");
        }
        finally
        {
            _checkingUpdates = false;
            if (runtime.IsTerminallyStopping && !_closing) await CloseAsync();
        }
    }

    private void Dispatch(Action action)
    {
        if (_dispatcher.IsDisposed) return;
        if (_dispatcher.InvokeRequired) _dispatcher.BeginInvoke(action);
        else action();
    }

    private async Task CloseAsync()
    {
        if (_closing) return;
        _closing = true;
        _tray.Text = UiText.Get("launcher.stopping");
        if (_runtime is not null)
        {
            try { await _runtime.DisposeAsync(); }
            catch (Exception)
            {
                // Keep the runtime owner and its retained handles available
                // for an explicit retry; closing is not proof of child exit.
                ExitCode = 2;
                _closing = false;
                _tray.Text = UiText.Get("launcher.stop.failed");
                MessageBox.Show(UiText.Get("launcher.stop.failure"), "NETGRID", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            _runtime = null;
        }
        _tray.Visible = false;
        _tray.Dispose();
        _dispatcher.Dispose();
        ExitThread();
    }
}
