namespace Netgrid.Launcher;

internal sealed class TrayApplicationContext : ApplicationContext
{
    private readonly LauncherOptions _options;
    private readonly NotifyIcon _tray;
    private readonly Control _dispatcher;
    private LauncherRuntime? _runtime;
    private bool _closing;

    public TrayApplicationContext(LauncherOptions options)
    {
        _options = options;
        _dispatcher = new Control();
        _dispatcher.CreateControl();
        var menu = new ContextMenuStrip();
        menu.Items.Add("NETGRID öffnen", null, (_, _) => OpenGame());
        menu.Items.Add("Maintenance öffnen", null, (_, _) => OpenMaintenance());
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
            if (_options.OpenMaintenance) OpenMaintenance();
            else OpenGame();
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
