using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;

internal static class ExistingSetupTests
{
    public static int Run(Assembly assembly)
    {
        var configuration = assembly.GetType("Netgrid.SetupHost.ExistingSetupConfiguration", true)!;
        var registration = assembly.GetType("Netgrid.SetupHost.ExistingSetupRegistration", true)!;
        var formType = assembly.GetType("Netgrid.SetupHost.SetupForm", true)!;
        var failureType = assembly.GetType("Netgrid.SetupHost.SetupException", true)!;
        var parse = configuration.GetMethod("Parse")!;
        var parseRegistration = registration.GetMethod("Parse")!;
        var root = Path.Combine(Path.GetTempPath(), "netgrid-existing-setup-" + Guid.NewGuid().ToString("N"));
        var data = Path.Combine(root, "data");
        var program = Path.Combine(root, "program");
        var environment = Path.Combine(data, "config", "runtime.env");
        var checks = 0;
        using var strings = assembly.GetManifestResourceStream("NETGRID.WindowsUiStrings.json")!;
        var catalog = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, string>>>(strings)!;
        void Assert(bool value, string code) { if (!value) throw new Exception(code); checks++; }
        object Property(object value, string name) => value.GetType().GetProperty(name)!.GetValue(value)!;
        T Field<T>(Form form, string name) => (T)formType.GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(form)!;
        Form Form(object state) => (Form)Activator.CreateInstance(formType, BindingFlags.Instance | BindingFlags.NonPublic, null, [state], null)!;
        void Reject(MethodInfo method, object?[] arguments, string code)
        {
            try { method.Invoke(null, arguments); }
            catch (TargetInvocationException error) when (error.InnerException?.GetType() == failureType)
            {
                Assert((string)Property(error.InnerException, "Code") == code, "existing_setup_failure_code");
                Assert(!error.InnerException.Message.Contains("private-fixture-secret"), "existing_setup_no_secret_in_failure");
                return;
            }
            throw new Exception("invalid_existing_setup_accepted");
        }
        string[] Lines(string host = "127.0.0.1", string profile = "local") =>
        [
            $"NETGRID_DATA_ROOT=\"{data}\"", $"NETGRID_DEPLOYMENT_PROFILE={profile}",
            "PORT=32141", "NETGRID_SERVER_PORT=32142", $"NETGRID_WEB_BASE_URL=http://{host}:32141",
            $"NETGRID_SERVER_BASE_URL=http://{host}:32142", "NETGRID_INITIAL_CLEANUP_RETENTION_DAYS=90",
            "NETGRID_ACCOUNT_ACCESS_MODE=protected", "NETGRID_TOKEN_SALT=private-fixture-secret",
            "NETGRID_MAINTENANCE_AUTH_FILE=must-not-read", "NEXT_PUBLIC_NETGRID_SERVER_URL=http://ignored.example:8787",
        ];
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(environment)!);
            var valid = Lines();
            var parsed = parse.Invoke(null, [valid, data])!;
            Assert((int)Property(parsed, "WebPort") == 32141 && (int)Property(parsed, "ServerPort") == 32142, "custom_ports_loaded");
            Assert((string)Property(parsed, "RetentionDays") == "90" && (string)Property(parsed, "AccountAccessMode") == "protected", "configured_initial_policies_loaded");
            Assert(!parsed.ToString()!.Contains("private-fixture-secret"), "public_projection_excludes_secrets");
            var lan = parse.Invoke(null, [Lines("192.168.44.8", "private_lan"), data])!;
            Assert((string)Property(lan, "LanAddress") == "192.168.44.8", "retained_lan_address_not_adapter_guess");
            for (var index = 0; index < 8; index++)
                Reject(parse, [valid.Where((_, i) => i != index).ToArray(), data], "existing_configuration_invalid");
            Reject(parse, [valid.Append("PORT=3100").ToArray(), data], "existing_configuration_invalid");
            Reject(parse, [valid, Path.Combine(root, "other")], "existing_configuration_invalid");
            foreach (var (index, value) in new (int, string)[]
            {
                (0,"NETGRID_DATA_ROOT=relative"), (1,"NETGRID_DEPLOYMENT_PROFILE=internet"),
                (2,"PORT=0"), (2,"PORT=65536"), (3,"NETGRID_SERVER_PORT=32141"),
                (4,"NETGRID_WEB_BASE_URL=http://127.0.0.1:3100"),
                (4,"NETGRID_WEB_BASE_URL=http://private-fixture-secret@127.0.0.1:32141"),
                (5,"NETGRID_SERVER_BASE_URL=http://127.0.0.1:32142/api"),
                (6,"NETGRID_INITIAL_CLEANUP_RETENTION_DAYS=invalid"), (7,"NETGRID_ACCOUNT_ACCESS_MODE=invite_only"),
            })
            {
                var invalid = valid.ToArray(); invalid[index] = value;
                Reject(parse, [invalid, data], "existing_configuration_invalid");
            }
            Reject(parse, [Lines("8.8.8.8", "private_lan"), data], "existing_configuration_invalid");
            foreach (var arguments in new object?[][]
            {
                [program,data,null,"1"], [null,data,"{00000000-0000-0000-0000-000000000001}","1"],
                [program,null,"{00000000-0000-0000-0000-000000000001}","1"], [program,data,"invalid","1"],
            }) Reject(parseRegistration, arguments, "existing_configuration_invalid");
            var installed = parseRegistration.Invoke(null, [program,data,"{00000000-0000-0000-0000-000000000001}","0"])!;
            var retained = parseRegistration.Invoke(null, [null,data,null,null])!;
            File.WriteAllLines(environment, Lines("192.168.44.8", "private_lan"));
            var hash = SHA256.HashData(File.ReadAllBytes(environment));
            foreach (var language in new[] { "de", "en", "fr" })
            {
                assembly.GetType("Netgrid.Windows.UiText", true)!.GetMethod("Use")!.Invoke(null, [language]);
                void CheckHelp(Form form, string targetName, string labelKey, string descriptionKey)
                {
                    var name = targetName == "_recommended" ? "setup.help.recommended" : "setup.help.custom";
                    var button = (Button)form.Controls.Find(name, true).Single();
                    var target = Field<RadioButton>(form, targetName);
                    var tooltip = Field<ToolTip>(form, "_helpToolTip");
                    var expected = catalog[language][descriptionKey];
                    Assert(button.AccessibleName == string.Format(catalog[language]["setup.help.title"], catalog[language][labelKey]), "mode_help_title_matches_current_context");
                    Assert(button.AccessibleDescription == expected && target.AccessibleDescription == expected, "mode_help_description_matches_current_context");
                    Assert(tooltip.GetToolTip(button) == expected && tooltip.GetToolTip(target) == expected, "mode_tooltip_matches_current_context");
                }
                using (var form = Form(installed))
                {
                    CheckHelp(form, "_recommended", "setup.existing.values", "setup.existing.notice");
                    CheckHelp(form, "_custom", "setup.custom", "setup.existing.notice");
                    Assert(Field<TextBox>(form, "_programRoot").Text == program && Field<TextBox>(form, "_dataRoot").Text == data, "installed_paths_displayed");
                    Assert(Field<NumericUpDown>(form, "_webPort").Value == 32141 && Field<NumericUpDown>(form, "_serverPort").Value == 32142, "installed_ui_ports_displayed");
                    Assert(Field<RadioButton>(form, "_lan").Checked && !Field<RadioButton>(form, "_lan").Enabled, "installed_network_preserved");
                    Assert(!Field<CheckBox>(form, "_desktop").Checked, "installed_desktop_preference_loaded");
                    Field<RadioButton>(form, "_custom").Checked = true;
                    foreach (var field in new[] { "_programRoot", "_dataRoot", "_webPort", "_serverPort", "_retention", "_accountMode" })
                        Assert(!Field<Control>(form, field).Enabled, "installed_values_cannot_be_edited");
                    Assert(!form.Controls.Find("setup.program.browse", true).Single().Enabled &&
                        !form.Controls.Find("setup.data.browse", true).Single().Enabled, "browse_buttons_follow_locked_paths");
                    var settings = formType.GetMethod("ReadSettings", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(form, null)!;
                    Assert((string)Property(settings, "LanAddress") == "192.168.44.8", "read_settings_preserves_configured_lan");
                    Assert((int)Property(settings, "ServerPort") == 32142, "read_settings_preserves_port");
                    Assert(!form.Visible, "existing_setup_test_no_visible_window");
                }
                using (var form = Form(retained))
                {
                    CheckHelp(form, "_recommended", "setup.existing.values", "setup.retained.notice");
                    CheckHelp(form, "_custom", "setup.custom", "setup.retained.notice");
                    Field<RadioButton>(form, "_custom").Checked = true;
                    Assert(Field<TextBox>(form, "_programRoot").Enabled && Field<TextBox>(form, "_dataRoot").Enabled, "retained_data_allows_new_program_or_data_folder");
                    Assert(!Field<NumericUpDown>(form, "_webPort").Enabled, "retained_configuration_not_silently_overridden");
                    Field<TextBox>(form, "_dataRoot").Text = Path.Combine(root, "fresh");
                    Assert((bool)formType.GetMethod("RefreshExistingConfiguration", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(form, null)!, "new_data_folder_allowed");
                    CheckHelp(form, "_recommended", "setup.recommended", "setup.help.recommended");
                    CheckHelp(form, "_custom", "setup.custom", "setup.help.custom");
                    Assert(Field<NumericUpDown>(form, "_webPort").Enabled && Field<NumericUpDown>(form, "_webPort").Value == 3100, "new_configuration_uses_explicit_defaults");
                    Assert(Field<RadioButton>(form, "_local").Checked && Field<RadioButton>(form, "_local").Enabled, "new_configuration_network_editable");
                    Assert(form.Controls.Find("setup.program.browse", true).Single().Enabled &&
                        form.Controls.Find("setup.data.browse", true).Single().Enabled, "new_folder_browse_buttons_available");
                }
            }
            Assert(hash.SequenceEqual(SHA256.HashData(File.ReadAllBytes(environment))), "existing_configuration_unchanged_by_ui");
            File.Delete(environment);
            using (var form = Form(installed))
            {
                Assert(!Field<Button>(form, "_install").Enabled, "missing_installed_configuration_blocks_install");
                Assert(!Field<NumericUpDown>(form, "_webPort").Enabled, "missing_configuration_does_not_offer_replacement_defaults");
            }
        }
        finally
        {
            if (Path.GetDirectoryName(root) != Path.TrimEndingDirectorySeparator(Path.GetTempPath()) ||
                !Path.GetFileName(root).StartsWith("netgrid-existing-setup-", StringComparison.Ordinal))
                throw new Exception("existing_setup_fixture_cleanup_scope_invalid");
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
        return checks;
    }
}
