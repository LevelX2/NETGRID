using System.Reflection;
using System.Text.Json;

// Exercise the real setup assembly without showing or operating a window.
var assembly = Assembly.Load("NETGRID.Setup");
var text = assembly.GetType("Netgrid.Windows.UiText", throwOnError: true)!;
var failure = assembly.GetType("Netgrid.SetupHost.SetupException", throwOnError: true)!;
var presenter = assembly.GetType("Netgrid.SetupHost.SetupFailure", throwOnError: true)!;
var settings = assembly.GetType("Netgrid.SetupHost.SetupSettings", throwOnError: true)!;
using var stream = assembly.GetManifestResourceStream("NETGRID.WindowsUiStrings.json")!;
var catalog = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, string>>>(stream)!;
var checks = 0;
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
            foreach (var button in helpButtons)
            {
                Assert(tips.GetToolTip(button) == catalog[language][button.Name], "tooltip_matches_language");
                Assert(button.AccessibleDescription == catalog[language][button.Name], "help_accessible_description");
                Assert(button.TabStop && !string.IsNullOrWhiteSpace(button.AccessibleName), "help_keyboard_accessible");
            }
            T Field<T>(string name) => (T)form.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(form)!;
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
Console.WriteLine($"SETUP_HOST_TESTS_OK checks={checks} languages=de,en,fr windowsShown=0");

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
