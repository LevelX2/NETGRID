using System.Reflection;
using System.Text.Json;

ApplicationConfiguration.Initialize();

// Exercise the real setup assembly without showing or operating a window.
var assembly = Assembly.Load("NETGRID.Setup");
var text = assembly.GetType("Netgrid.Windows.UiText", throwOnError: true)!;
var failure = assembly.GetType("Netgrid.SetupHost.SetupException", throwOnError: true)!;
var presenter = assembly.GetType("Netgrid.SetupHost.SetupFailure", throwOnError: true)!;
var settings = assembly.GetType("Netgrid.SetupHost.SetupSettings", throwOnError: true)!;
using var stream = assembly.GetManifestResourceStream("NETGRID.WindowsUiStrings.json")!;
var catalog = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, string>>>(stream)!;
var previewRoot = args.Length == 2 && args[0] == "--render-to" ? Path.GetFullPath(args[1]) : null;
if (previewRoot is not null) Directory.CreateDirectory(previewRoot);
var checks = 0;
var previewWindowsShown = 0;
var languagePolicy = assembly.GetType("Netgrid.Windows.WindowsUiLanguage", throwOnError: true)!;
var resolveLanguage = languagePolicy.GetMethod("Resolve")!;
foreach (var chosen in new[] { "de", "en", "fr" })
{
    Assert((string)resolveLanguage.Invoke(null, [chosen, "en"])! == chosen, "installed_language_overrides_windows_language");
    Assert((string)resolveLanguage.Invoke(null, [null, chosen])! == chosen, "unconfigured_language_uses_windows_language");
}
Assert((string)resolveLanguage.Invoke(null, [null, "es"])! == "en", "unsupported_windows_language_uses_product_default");
foreach (var invalid in new object[] { "", "es", 1031, false })
{
    try { resolveLanguage.Invoke(null, [invalid, "en"]); throw new Exception("invalid_language_preference_accepted"); }
    catch (TargetInvocationException exception) when (exception.InnerException is InvalidOperationException)
    { Assert(exception.InnerException.Message == "windows_ui_language_preference_invalid", "invalid_language_preference_fail_closed"); }
}
foreach (var language in new[] { "de", "en", "fr" })
{
    text.GetMethod("Use")!.Invoke(null, [language]);
    var installer = assembly.GetType("Netgrid.SetupHost.Installer", true)!;
    var readDesktop = installer.GetMethod("ReadDesktopShortcutPreference")!;
    foreach (var value in new[] { "0", "1" })
        Assert((string)readDesktop.Invoke(null, [value])! == value, "update_desktop_preference_preserved");
    foreach (var value in new object?[] { null, "", "2", "-1", "true", 1, false })
    {
        try { readDesktop.Invoke(null, [value]); throw new Exception("update_missing_or_invalid_desktop_preference_accepted"); }
        catch (TargetInvocationException exception) when (exception.InnerException?.GetType() == failure)
        {
            Assert((string)failure.GetProperty("Code")!.GetValue(exception.InnerException)! == "update_desktop_preference_invalid", "update_desktop_preference_fail_closed");
        }
    }
    foreach (var (key, template) in catalog[language].Where(entry => entry.Key.StartsWith("setup.failure.", StringComparison.Ordinal)))
    {
        var code = key["setup.failure.".Length..];
        object[] arguments = code switch
        {
            "msi_failed" => [1603, @"C:\Test\installer.log"],
            "uninstall_failed" => [1603],
            "path_invalid" or "path_too_broad" or "path_drive_invalid" => [catalog[language]["setup.data"]],
            "disk_space_low" => [@"C:\: 1500 / 500 MiB"],
            "disk_space_unknown" => [@"C:\"],
            _ => [],
        };
        var exception = (Exception)Activator.CreateInstance(failure, [code, arguments])!;
        Assert(exception.Message == string.Format(template, arguments), $"localized_error:{language}:{code}");
        Assert((string)failure.GetProperty("Code")!.GetValue(exception)! == code, "diagnostic_code_preserved");
        Assert((string)presenter.GetMethod("Message")!.Invoke(null, [exception])! == exception.Message, "known_error_preserved");
    }
    var expectedPorts = language switch
    {
        "de" => "Web- und Serverport müssen verschieden sein.",
        "en" => "The web and server ports must be different.",
        _ => "Les ports web et serveur doivent être différents.",
    };
    Assert(((Exception)Activator.CreateInstance(failure, ["ports_conflict", Array.Empty<object>()])!).Message == expectedPorts, "specific_translation_not_generic");
    var raw = new InvalidOperationException("sensitive-untranslated-test-message");
    var presented = (string)presenter.GetMethod("Message")!.Invoke(null, [raw])!;
    Assert(!presented.Contains(raw.Message, StringComparison.Ordinal), "raw_exception_not_exposed");
    Assert(presented.Contains(catalog[language]["setup.operation.failed"], StringComparison.Ordinal), "unexpected_error_localized");
    Assert(presented.Contains(nameof(InvalidOperationException), StringComparison.Ordinal) && presented.Contains($"0x{raw.HResult:X8}", StringComparison.Ordinal), "unexpected_error_diagnostic_identity");
    foreach (var path in new[] { "", "relative-folder", @"C:relative", @"\root-relative", @"\\server\share\data", "C:\\bad\0path" })
    {
        try
        {
            settings.GetMethod("ReadRoot")!.Invoke(null, [path, catalog[language]["setup.data"]]);
            throw new Exception("invalid_root_accepted");
        }
        catch (TargetInvocationException exception) when (exception.InnerException?.GetType() == failure)
        {
            Assert((string)failure.GetProperty("Code")!.GetValue(exception.InnerException)! == "path_invalid", "invalid_root_structured");
            Assert(exception.InnerException.Message == string.Format(catalog[language]["setup.failure.path_invalid"], catalog[language]["setup.data"]), "invalid_root_localized");
        }
    }
    Assert((string)settings.GetMethod("ReadRoot")!.Invoke(null, [@"C:\NETGRID Test\..\NETGRID", catalog[language]["setup.data"]])! == @"C:\NETGRID", "absolute_root_normalized");
    var space = assembly.GetType("Netgrid.SetupHost.InstallationSpace", true)!;
    var footprintType = assembly.GetType("Netgrid.SetupHost.InstallationFootprint", true)!;
    var footprint = Activator.CreateInstance(footprintType, [1_000_000L, 100L, 200_000L])!;
    Func<string, long> cluster = _ => 4096;
    var plan = (IReadOnlyDictionary<string, long>)space.GetMethod("Plan")!.Invoke(null,
        [@"P:\NETGRID", @"D:\Data", @"T:\Temp", @"W:\Windows", footprint, 300_000L, cluster])!;
    Assert(plan.Count == 4, "space_distinct_drives");
    Assert(plan[@"P:\"] == 1_000_000L + 100 * 4096, "space_program_payload_and_allocation");
    Assert(plan[@"D:\"] == 300_000L + 200_000 + 512L * 1024 * 1024 + 2 * 4096, "space_data_caches_and_reserve");
    Assert(plan[@"T:\"] == 200_000L + 1_000_000 + 100 * 4096, "space_temporary_reserve");
    Assert(plan[@"W:\"] == 200_000L + 4096, "space_windows_installer_cache");
    var shared = (IReadOnlyDictionary<string, long>)space.GetMethod("Plan")!.Invoke(null,
        [@"C:\NETGRID", @"c:\Data", @"C:\Temp", @"c:\Windows", footprint, 300_000L, cluster])!;
    Assert(shared.Count == 1 && shared[@"C:\"] == plan.Values.Sum(), "space_same_drive_aggregated_case_insensitive");
    Func<string, long> exactFree = root => plan[root];
    var enough = space.GetMethod("Assess")!.Invoke(null, [plan, exactFree])!;
    space.GetMethod("EnsureAvailable")!.Invoke(null, [enough]);
    Assert(true, "space_exact_capacity_passes");
    Func<string, long> tooLittle = root => plan[root] - 1;
    var insufficient = space.GetMethod("Assess")!.Invoke(null, [plan, tooLittle])!;
    try { space.GetMethod("EnsureAvailable")!.Invoke(null, [insufficient]); throw new Exception("space_shortage_accepted"); }
    catch (TargetInvocationException exception) when (exception.InnerException?.GetType() == failure)
    {
        Assert((string)failure.GetProperty("Code")!.GetValue(exception.InnerException)! == "disk_space_low", "space_shortage_structured");
        foreach (var root in plan.Keys) Assert(exception.InnerException.Message.Contains(root, StringComparison.Ordinal), "space_shortage_reports_each_drive");
    }
    Func<string, long> unavailable = _ => -1;
    var unknown = space.GetMethod("Assess")!.Invoke(null, [plan, unavailable])!;
    try { space.GetMethod("EnsureAvailable")!.Invoke(null, [unknown]); throw new Exception("space_unknown_accepted"); }
    catch (TargetInvocationException exception) when (exception.InnerException?.GetType() == failure)
    { Assert((string)failure.GetProperty("Code")!.GetValue(exception.InnerException)! == "disk_space_unknown", "space_unknown_fail_closed"); }
    var overflowing = Activator.CreateInstance(footprintType, [long.MaxValue, 1L, 1L])!;
    try { space.GetMethod("Plan")!.Invoke(null, [@"C:\Program", @"C:\Data", @"C:\Temp", @"C:\Windows", overflowing, 1L, cluster]); throw new Exception("space_overflow_accepted"); }
    catch (TargetInvocationException exception) when (exception.InnerException?.GetType() == failure)
    { Assert((string)failure.GetProperty("Code")!.GetValue(exception.InnerException)! == "disk_space_metadata_invalid", "space_overflow_fail_closed"); }
    Exception? uiFailure = null;
    var uiThread = new Thread(() =>
    {
        try
        {
            using var languageDialog = (Form)Activator.CreateInstance(assembly.GetType("Netgrid.Windows.LanguageDialog", true)!, nonPublic: true)!;
            languageDialog.PerformLayout();
            var languageButtons = Descendants(languageDialog).OfType<Button>().ToArray();
            Assert(languageButtons.Length == 2, "language_dialog_two_actions");
            foreach (var button in languageButtons)
                Assert(button.Parent!.ClientRectangle.Contains(button.Bounds), "language_action_inside_parent");
            Assert(!languageButtons[0].Bounds.IntersectsWith(languageButtons[1].Bounds), "language_actions_do_not_overlap");
            var languageChoice = Descendants(languageDialog).OfType<ComboBox>().Single();
            foreach (var (index, selected) in new[] { (0, "de"), (1, "en"), (2, "fr") })
            {
                languageChoice.SelectedIndex = index;
                Assert(languageButtons.Single(button => button.DialogResult == DialogResult.OK).Text == catalog[selected]["setup.language.continue"], "language_continue_follows_selection");
                Assert(languageButtons.Single(button => button.DialogResult == DialogResult.Cancel).Text == catalog[selected]["setup.language.cancel"], "language_cancel_follows_selection");
            }
            var proceedButton = languageButtons.Single(button => button.DialogResult == DialogResult.OK);
            var cancelButton = languageButtons.Single(button => button.DialogResult == DialogResult.Cancel);
            Assert(ReferenceEquals(languageDialog.AcceptButton, proceedButton), "language_enter_targets_continue");
            Assert(ReferenceEquals(languageDialog.CancelButton, cancelButton), "language_escape_targets_cancel");
            var clickHandler = typeof(Button).GetMethod("OnClick", BindingFlags.Instance | BindingFlags.NonPublic)!;
            // Invoke the real button event without showing a window or injecting input.
            clickHandler.Invoke(proceedButton, [EventArgs.Empty]);
            Assert(languageDialog.DialogResult == DialogResult.OK, "language_continue_returns_ok");
            clickHandler.Invoke(cancelButton, [EventArgs.Empty]);
            Assert(languageDialog.DialogResult == DialogResult.Cancel, "language_cancel_returns_cancel");
            text.GetMethod("Use")!.Invoke(null, [language]);
            Assert(!languageDialog.Visible, "language_test_shows_no_window");
            using var form = (Form)Activator.CreateInstance(assembly.GetType("Netgrid.SetupHost.SetupForm", true)!)!;
            var tips = (ToolTip)form.GetType().GetField("_helpToolTip", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(form)!;
            var helpButtons = Descendants(form).OfType<Button>().Where(button => button.Name.StartsWith("setup.help.", StringComparison.Ordinal)).ToArray();
            Assert(helpButtons.Length == 11, "each_option_has_help");
            var popupHandler = typeof(ToolTip).GetMethod("OnPopup", BindingFlags.Instance | BindingFlags.NonPublic)!;
            var drawHandler = typeof(ToolTip).GetMethod("OnDraw", BindingFlags.Instance | BindingFlags.NonPublic)!;
            var tooltipLayout = assembly.GetType("Netgrid.SetupHost.SetupHelpToolTip", true)!;
            var measureTip = tooltipLayout.GetMethod("Measure")!;
            var textFlags = (TextFormatFlags)tooltipLayout.GetField("TextFlags")!.GetValue(null)!;
            Assert(tips.OwnerDraw && !tips.IsBalloon, "tooltip_uses_wrapped_drawing");
            foreach (var button in helpButtons.Cast<Control>().Append(Descendants(form).OfType<LinkLabel>().Single()))
            {
                var content = tips.GetToolTip(button)!;
                var unwrapped = TextRenderer.MeasureText(content, button.Font);
                var popup = new PopupEventArgs(button, button, false, unwrapped);
                popupHandler.Invoke(tips, [popup]);
                Assert(popup.ToolTipSize.Width <= (int)Math.Ceiling(440 * button.DeviceDpi / 96d), "tooltip_width_is_bounded");
                Assert(popup.ToolTipSize.Height > unwrapped.Height, "tooltip_wraps_into_multiple_lines");
                foreach (var dpi in new[] { 96, 120, 144 })
                foreach (var screenWidth in new[] { 640, 1280, 1920 })
                {
                    using var scaledFont = new Font(button.Font.FontFamily, button.Font.SizeInPoints * dpi / 96f);
                    var size = (Size)measureTip.Invoke(null, [content, scaledFont, dpi, screenWidth])!;
                    var padding = (int)tooltipLayout.GetMethod("Padding")!.Invoke(null, [dpi])!;
                    var measured = TextRenderer.MeasureText(content, scaledFont, new Size(size.Width - 2 * padding, int.MaxValue), textFlags);
                    Assert(size.Width <= screenWidth - 4 * padding, "tooltip_respects_work_area_width");
                    Assert(measured.Width <= size.Width - 2 * padding, "tooltip_line_not_clipped");
                    Assert(measured.Height + 2 * padding == size.Height, "tooltip_all_lines_fit_height");
                }
                if (previewRoot is not null)
                {
                    if (button is LinkLabel) Console.WriteLine($"TOOLTIP_RENDER_FONT {button.Font.Name} {button.Font.SizeInPoints} {button.Font.Style} dpi={button.DeviceDpi}");
                    using var bitmap = new Bitmap(popup.ToolTipSize.Width, popup.ToolTipSize.Height, System.Drawing.Imaging.PixelFormat.Format24bppRgb);
                    using var graphics = Graphics.FromImage(bitmap);
                    graphics.Clear(SystemColors.Info);
                    var draw = new DrawToolTipEventArgs(graphics, button, button, new Rectangle(Point.Empty, popup.ToolTipSize), content, SystemColors.Info, SystemColors.InfoText, button.Font);
                    drawHandler.Invoke(tips, [draw]);
                    var name = button is LinkLabel ? "maintenance" : button.Name["setup.help.".Length..];
                    bitmap.Save(Path.Combine(previewRoot, $"tooltip-{language}-{name}.png"), System.Drawing.Imaging.ImageFormat.Png);
                }
            }
            foreach (var button in helpButtons)
            {
                Assert(tips.GetToolTip(button) == catalog[language][button.Name], "tooltip_matches_language");
                Assert(button.AccessibleDescription == catalog[language][button.Name], "help_accessible_description");
                Assert(button.TabStop && !string.IsNullOrWhiteSpace(button.AccessibleName), "help_keyboard_accessible");
            }
            T Field<T>(string name) => (T)form.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(form)!;
            Assert(Field<RadioButton>("_recommended").Text == (language switch
            {
                "de" => "Voreingestellte Werte verwenden",
                "en" => "Use default settings",
                _ => "Utiliser les valeurs par défaut",
            }), "preset_mode_describes_values_instead_of_recommendation");
            var setPhase = form.GetType().GetMethod("SetInstallationPhase", BindingFlags.Instance | BindingFlags.NonPublic)!;
            var phaseType = assembly.GetType("Netgrid.SetupHost.InstallationPhase", true)!;
            var toggleUi = form.GetType().GetMethod("ToggleUi", BindingFlags.Instance | BindingFlags.NonPublic)!;
            toggleUi.Invoke(form, [false]);
            var progress = Field<ProgressBar>("_progress");
            Assert(progress.Parent!.Enabled && progress.Enabled && Field<Label>("_status").Enabled, "busy_feedback_not_disabled_with_options");
            Assert(!Field<Button>("_install").Enabled && !Field<TextBox>("_programRoot").Enabled, "installation_options_locked");
            foreach (var (phase, key, running) in new[]
            {
                ("Validating", "validate", true), ("Preparing", "prepare", true),
                ("Elevation", "elevation", true), ("Installing", "installing", true),
                ("FirstRun", "first_run", false), ("Completed", "success", false),
            })
            {
                setPhase.Invoke(form, [Enum.Parse(phaseType, phase)]);
                Assert(Field<Label>("_status").Text == catalog[language][$"setup.status.{key}"], "installation_phase_localized");
                Assert(progress.Style == (running ? ProgressBarStyle.Marquee : ProgressBarStyle.Continuous), "progress_matches_actual_phase");
                Assert(progress.MarqueeAnimationSpeed == (running ? 30 : 0), "progress_stops_when_waiting_for_user");
                if (!running) Assert(progress.Value == progress.Maximum, "completed_msi_progress_is_full");
                form.PerformLayout();
                Assert(Field<Label>("_status").Width <= 660, "installation_status_wraps");
                Assert(progress.Parent!.ClientRectangle.Contains(progress.Bounds), "progress_inside_layout");
                if (previewRoot is not null && phase is "Installing" or "FirstRun")
                {
                    // DrawToBitmap alone does not create hidden child handles.
                    // Use the same off-screen window lifecycle as setup previews.
                    form.ShowInTaskbar = false;
                    form.StartPosition = FormStartPosition.Manual;
                    form.Location = new Point(-32000, -32000);
                    form.Show();
                    previewWindowsShown++;
                    Application.DoEvents();
                    Thread.Sleep(1000); // Let the native progress transition settle before capture.
                    Application.DoEvents();
                    form.PerformLayout();
                    using var bitmap = new Bitmap(form.Width, form.Height);
                    form.DrawToBitmap(bitmap, new Rectangle(Point.Empty, bitmap.Size));
                    bitmap.Save(Path.Combine(previewRoot, $"progress-{language}-{phase}.png"), System.Drawing.Imaging.ImageFormat.Png);
                    form.Hide();
                }
            }
            form.GetType().GetMethod("StopProgress", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(form, []);
            Assert(progress.MarqueeAnimationSpeed == 0, "progress_stops_on_failure_or_cancellation");
            toggleUi.Invoke(form, [true]);
            Assert(Field<Button>("_install").Enabled && !Field<TextBox>("_programRoot").Enabled, "retry_restores_recommended_field_state");
            Assert(Field<ComboBox>("_retention").SelectedItem!.ToString() == catalog[language]["setup.retention.recommended"], "retention_labels_use_current_language");
            var local = Field<RadioButton>("_local");
            var lan = Field<RadioButton>("_lan");
            Assert(local.Parent == lan.Parent, "network_radio_owner_preserved");
            lan.Checked = true;
            Assert(!local.Checked && lan.Checked, "network_choice_exclusive");
            local.Checked = true;
            Assert(local.Checked && !lan.Checked, "network_choice_reversible");
            Field<RadioButton>("_custom").Checked = true;
            Assert(!Field<RadioButton>("_recommended").Checked && Field<TextBox>("_programRoot").Enabled, "custom_choice_and_fields");
            Assert(!form.Visible, "help_tests_show_no_window");
        }
        catch (Exception exception) { uiFailure = exception; }
    });
    uiThread.SetApartmentState(ApartmentState.STA);
    uiThread.Start();
    uiThread.Join();
    if (uiFailure is not null) throw uiFailure;
}
Console.WriteLine($"SETUP_HOST_TESTS_OK checks={checks} languages=de,en,fr offscreenPreviewWindows={previewWindowsShown}");

static IEnumerable<Control> Descendants(Control parent)
{
    foreach (Control child in parent.Controls)
    {
        yield return child;
        foreach (var descendant in Descendants(child)) yield return descendant;
    }
}

void Assert(bool condition, string name)
{
    if (!condition) throw new Exception($"setup_test_failed:{name}");
    checks++;
}
