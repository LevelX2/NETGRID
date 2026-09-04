using System.Diagnostics;

namespace Netgrid.Launcher;

internal enum RecoveryAction
{
    StayStopped,
    Retry,
    Exit,
}

internal sealed class RecoveryDialog : Form
{
    private RecoveryDialog(string message, string logDirectory)
    {
        Text = "NETGRID";
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath) ?? SystemIcons.Application;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MinimizeBox = false;
        MaximizeBox = false;
        ClientSize = new Size(520, 180);
        AutoScaleMode = AutoScaleMode.Dpi;

        var explanation = new Label
        {
            AutoSize = false,
            Text = message,
            Location = new Point(24, 24),
            Size = new Size(472, 72),
        };
        var retry = new Button
        {
            Text = "Wiederholen",
            Location = new Point(176, 120),
            Size = new Size(100, 32),
            DialogResult = DialogResult.Retry,
        };
        var diagnostics = new Button
        {
            Text = "Diagnose öffnen",
            Location = new Point(284, 120),
            Size = new Size(112, 32),
        };
        diagnostics.Click += (_, _) =>
            Process.Start(new ProcessStartInfo("explorer.exe", $"\"{logDirectory}\"") { UseShellExecute = true });
        var exit = new Button
        {
            Text = "Beenden",
            Location = new Point(404, 120),
            Size = new Size(92, 32),
            DialogResult = DialogResult.Abort,
        };
        Controls.AddRange([explanation, retry, diagnostics, exit]);
        AcceptButton = retry;
        CancelButton = exit;
    }

    public static RecoveryAction Show(string message, string logDirectory)
    {
        using var dialog = new RecoveryDialog(message, logDirectory);
        return dialog.ShowDialog() switch
        {
            DialogResult.Retry => RecoveryAction.Retry,
            DialogResult.Abort => RecoveryAction.Exit,
            _ => RecoveryAction.StayStopped,
        };
    }
}
