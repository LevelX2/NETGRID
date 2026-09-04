namespace Netgrid.Launcher;

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
        menu.Items.Add("NETGRID öffnen", null, (_, _) => OpenGame());
        menu.Items.Add("Maintenance öffnen", null, (_, _) => OpenMaintenance());
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Nach Updates suchen …", null, async (_, _) => await CheckForUpdatesAsync(manual: true));
        _prerelease = new ToolStripMenuItem("Stabile und Vorabversionen") { CheckOnClick = true };
        _prerelease.CheckedChanged += (_, _) => SaveUpdateSetting();
        menu.Items.Add(_prerelease);
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("NETGRID beenden", null, async (_, _) => await CloseAsync());
        _tray = new NotifyIcon
        {
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath) ?? SystemIcons.Application,
            Text = "NETGRID wird gestartet …",
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
            _runtime.FatalFailure += RuntimeOnFatalFailure;
            _runtime.Recovered += (_, _) => Dispatch(() => ShowInfo("NETGRID wurde einmalig neu gestartet."));
            await _runtime.StartAsync();
            _tray.Text = "NETGRID läuft";
            var settings = UpdateSettings.Load(_runtime.DataRoot);
            _prerelease.Checked = settings.AllowPrerelease;
            if (_options.OpenMaintenance) OpenMaintenance();
            else OpenGame();
            _ = CheckForUpdatesAsync(manual: false);
        }
        catch (Exception exception)
        {
            ExitCode = 2;
            _tray.Text = "NETGRID konnte nicht gestartet werden";
            MessageBox.Show(
                $"NETGRID konnte nicht gestartet werden.\n\nUrsache: {exception.Message}",
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
        _tray.Text = "NETGRID wurde angehalten";
        var action = RecoveryDialog.Show(message, _runtime.LogDirectory);
        if (action == RecoveryAction.Retry)
        {
            try
            {
                _tray.Text = "NETGRID wird gestartet …";
                await _runtime.StartAsync();
                _tray.Text = "NETGRID läuft";
                OpenGame();
            }
            catch (Exception exception)
            {
                MessageBox.Show(
                    $"NETGRID konnte nicht erneut gestartet werden.\n\nUrsache: {exception.Message}",
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

    private void SaveUpdateSetting()
    {
        if (_runtime is null) return;
        try
        {
            new UpdateSettings(_prerelease.Checked).Save(_runtime.DataRoot);
        }
        catch (Exception exception)
        {
            MessageBox.Show($"Die Updateeinstellung konnte nicht gespeichert werden.\n\nUrsache: {exception.Message}", "NETGRID", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private async Task CheckForUpdatesAsync(bool manual)
    {
        if (_checkingUpdates || _closing || _runtime is null) return;
        _checkingUpdates = true;
        try
        {
            using var http = UpdateDiscovery.CreateHttpClient();
            var candidate = await UpdateDiscovery.CheckAsync(http, UpdateDiscovery.GitHubReleasesApi, InstalledProduct.Version(_runtime.ProgramRoot), _prerelease.Checked);
            if (candidate is null)
            {
                if (manual) MessageBox.Show("NETGRID ist auf dem neuesten Stand.", "NETGRID Updates", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            var prereleaseWarning = candidate.Prerelease
                ? "\n\nDies ist eine Vorabversion. Ein späteres Downgrade ist nicht zugesichert."
                : string.Empty;
            var answer = MessageBox.Show(
                $"NETGRID {candidate.Version} ist verfügbar.\n\n{candidate.ReleaseNotes}{prereleaseWarning}\n\nJetzt herunterladen und installieren? Laufende NETGRID-Prozesse werden nach einem geprüften Backup beendet.",
                "NETGRID Update",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );
            if (answer != DialogResult.Yes) return;
            var readiness = await _runtime.UpdateReadinessAsync();
            if (!readiness.Allowed)
            {
                MessageBox.Show($"Das Update ist blockiert, solange {readiness.ActiveMatchCount} laufende Partie(n) aktiv sind. Beenden Sie diese zuerst.", "NETGRID Update", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            _tray.Text = "NETGRID Update wird geladen …";
            var staging = Path.Combine(_runtime.DataRoot, "runtime", "updates", "staging");
            var setupPath = await UpdateDiscovery.DownloadVerifiedAsync(http, candidate, staging);
            readiness = await _runtime.UpdateReadinessAsync();
            if (!readiness.Allowed)
            {
                MessageBox.Show("Während des Downloads wurde eine Partie gestartet. Das Update wurde nicht installiert.", "NETGRID Update", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                _tray.Text = "NETGRID läuft";
                return;
            }
            var installedUpdater = Path.Combine(_runtime.ProgramRoot, "NETGRID.Updater.exe");
            if (!File.Exists(installedUpdater)) throw new InvalidOperationException("updater_missing");
            var updater = Path.Combine(staging, "NETGRID.Updater.exe");
            File.Copy(installedUpdater, updater, overwrite: true);
            var start = new System.Diagnostics.ProcessStartInfo(updater) { UseShellExecute = true, Verb = "runas" };
            start.ArgumentList.Add("--apply");
            start.ArgumentList.Add("--parent-pid");
            start.ArgumentList.Add(Environment.ProcessId.ToString());
            start.ArgumentList.Add("--setup");
            start.ArgumentList.Add(setupPath);
            start.ArgumentList.Add("--sha256");
            start.ArgumentList.Add(candidate.SetupSha256);
            start.ArgumentList.Add("--program-root");
            start.ArgumentList.Add(_runtime.ProgramRoot);
            start.ArgumentList.Add("--environment-file");
            start.ArgumentList.Add(_runtime.EnvironmentFile);
            start.ArgumentList.Add("--restart");
            System.Diagnostics.Process.Start(start);
            await CloseAsync();
        }
        catch (Exception exception) when (!manual && exception is HttpRequestException or TaskCanceledException)
        {
            // Offline startup is intentionally silent; NETGRID remains fully usable.
        }
        catch (Exception exception)
        {
            MessageBox.Show($"Das Update konnte nicht vorbereitet werden.\n\nUrsache: {exception.Message}", "NETGRID Update", MessageBoxButtons.OK, MessageBoxIcon.Error);
            if (!_closing) _tray.Text = "NETGRID läuft";
        }
        finally
        {
            _checkingUpdates = false;
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
        _tray.Text = "NETGRID wird beendet …";
        if (_runtime is not null)
        {
            await _runtime.DisposeAsync();
            _runtime = null;
        }
        _tray.Visible = false;
        _tray.Dispose();
        _dispatcher.Dispose();
        ExitThread();
    }
}
