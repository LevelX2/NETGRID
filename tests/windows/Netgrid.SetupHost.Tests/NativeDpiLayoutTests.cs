using System.Reflection;

internal static class NativeDpiLayoutTests
{
    internal static int Run(Assembly assembly)
    {
        Exception? failure = null;
        var checks = 0;
        var thread = new Thread(() =>
        {
            try
            {
                // Route UI callback failures into the test, never a modal
                // "continue after error" dialog in an unattended gate.
                Application.SetUnhandledExceptionMode(UnhandledExceptionMode.ThrowException);
                var strings = assembly.GetType("Netgrid.Windows.UiText", true)!;
                foreach (var language in new[] { "de", "en", "fr" })
                {
                    strings.GetMethod("Use")!.Invoke(null, [language]);
                    foreach (var (name, width) in new[] { ("Netgrid.Windows.LanguageDialog", 390), ("Netgrid.SetupHost.UninstallForm", 620) })
                    {
                        using var dialog = (Form)Activator.CreateInstance(assembly.GetType(name, true)!, nonPublic: true)!;
                        dialog.ShowInTaskbar = false;
                        dialog.StartPosition = FormStartPosition.Manual;
                        dialog.Location = new Point(-32000, -32000);
                        dialog.Show();
                        Application.DoEvents();
                        Check(Math.Abs(dialog.ClientSize.Width - (int)Math.Round(width * dialog.DeviceDpi / 96d)) <= 1, $"dialog_initial_scale:{name}");
                        dialog.Hide();
                    }
                    using var form = (Form)Activator.CreateInstance(assembly.GetType("Netgrid.SetupHost.SetupForm", true)!)!;
                    form.ShowInTaskbar = false;
                    form.StartPosition = FormStartPosition.Manual;
                    form.Location = new Point(-32000, -32000);
                    form.Show();
                    Application.DoEvents();
                    T Field<T>(string name) => (T)form.GetType().GetField(name, BindingFlags.NonPublic | BindingFlags.Instance)!.GetValue(form)!;
                    var dpi = form.DeviceDpi;
                    var port = Field<NumericUpDown>("_webPort");
                    var expectedPortWidth = (int)Math.Round(90 * dpi / 96d);
                    Console.WriteLine($"NATIVE_DPI_LAYOUT language={language} dpi={dpi} portWidth={port.Width} expectedPortWidth={expectedPortWidth}");
                    Check(Math.Abs(port.Width - expectedPortWidth) <= 1, "initial_control_scale");
                    var workingArea = Screen.FromControl(form).WorkingArea;
                    Check(form.Width <= workingArea.Width && form.Height <= workingArea.Height,
                        $"form_fits_work_area:{form.Size}:{workingArea.Size}");
                    foreach (var combo in new[] { Field<ComboBox>("_retention"), Field<ComboBox>("_accountMode") })
                    foreach (var item in combo.Items)
                    {
                        var textWidth = TextRenderer.MeasureText(item.ToString(), combo.Font).Width;
                        var required = textWidth + (int)Math.Ceiling(24 * dpi / 96d);
                        Check(combo.Width >= required, $"selected_text_fits:{language}:dpi={dpi}:width={combo.Width}:required={required}");
                        Check(combo.Parent!.ClientRectangle.Contains(combo.Bounds), "choice_inside_table");
                    }
                    var lastOption = Field<CheckBox>("_launch");
                    Control optionsRoot = lastOption;
                    while (optionsRoot.Parent != form) optionsRoot = optionsRoot.Parent!;
                    var scroll = (ScrollableControl)optionsRoot;
                    scroll.AutoScrollPosition = new Point(0, int.MaxValue);
                    Application.DoEvents();
                    foreach (Control option in lastOption.Parent!.Controls)
                    {
                        var bounds = scroll.RectangleToClient(option.RectangleToScreen(option.ClientRectangle));
                        Check(scroll.ClientRectangle.Contains(bounds), $"last_options_visible:bounds={bounds}:viewport={scroll.ClientRectangle}:scroll={scroll.AutoScrollPosition}:row={option.Parent!.Bounds}");
                    }
                    form.Hide();
                }
            }
            catch (Exception exception) { failure = exception; }
        });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();
        if (failure is not null) throw failure;
        return checks;

        void Check(bool condition, string name)
        {
            if (!condition) throw new Exception($"native_dpi_layout_failed:{name}");
            checks++;
        }
    }
}
