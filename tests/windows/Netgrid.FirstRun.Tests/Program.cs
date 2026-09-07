using System.Reflection;
using System.Text.Json;

ApplicationConfiguration.Initialize();
var assembly = Assembly.Load("NETGRID.FirstRun");
var uiText = assembly.GetType("Netgrid.Windows.UiText", true)!;
using var stream = assembly.GetManifestResourceStream("NETGRID.WindowsUiStrings.json")!;
var catalog = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, string>>>(stream)!;
var previewRoot = args.Length == 2 && args[0] == "--render-to" ? Path.GetFullPath(args[1]) : null;
if (previewRoot is not null) Directory.CreateDirectory(previewRoot);
var checks = 0;
checks += InstallationGuardTests.Run(assembly);
Exception? testFailure = null;
var thread = new Thread(() =>
{
    try
    {
        foreach (var language in new[] { "de", "en", "fr" })
        {
            uiText.GetMethod("Use")!.Invoke(null, [language]);
            using var form = (Form)Activator.CreateInstance(assembly.GetType("Netgrid.FirstRun.FirstRunForm", true)!)!;
            T Field<T>(string name) => (T)form.GetType().GetField(name, BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(form)!;
            var password = Field<TextBox>("_password");
            var confirmation = Field<TextBox>("_confirmation");
            var showPassword = Field<Button>("_passwordVisibility");
            var showConfirmation = Field<Button>("_confirmationVisibility");
            var click = typeof(Button).GetMethod("OnClick", BindingFlags.Instance | BindingFlags.NonPublic)!;
            var configurationChecked = form.GetType().GetMethod("ConfigurationChecked", BindingFlags.Instance | BindingFlags.NonPublic)!;
            var begin = Field<Button>("_begin");
            var back = Field<Button>("_back");
            Assert(!begin.Enabled, "choice_waits_for_configuration_check");
            configurationChecked.Invoke(form, [false]);
            Assert(!Field<bool>("_enteringPassword") && ReferenceEquals(form.AcceptButton, begin), "first_step_asks_before_password_entry");
            if (previewRoot is not null) Render("choice", [begin, Field<Button>("_later")]);
            click.Invoke(begin, [EventArgs.Empty]);
            Assert(Field<bool>("_enteringPassword") && ReferenceEquals(form.AcceptButton, Field<Button>("_complete")), "only_explicit_choice_opens_password_step");
            Assert(password.UseSystemPasswordChar && confirmation.UseSystemPasswordChar, "both_passwords_masked_by_default");
            // Synthetic component data only: no runtime, credential file or auth CLI.
            password.Text = "component-only-example";
            confirmation.Text = password.Text;
            click.Invoke(showPassword, [EventArgs.Empty]);
            Assert(!password.UseSystemPasswordChar && confirmation.UseSystemPasswordChar, "visibility_is_independent");
            Assert(showPassword.Text == catalog[language]["first.password.hide"], "hide_action_localized");
            Assert(!showPassword.AccessibleName!.Contains(password.Text, StringComparison.Ordinal), "accessible_name_never_contains_password");
            click.Invoke(showConfirmation, [EventArgs.Empty]);
            Assert(!confirmation.UseSystemPasswordChar, "confirmation_can_be_revealed");
            click.Invoke(showPassword, [EventArgs.Empty]);
            Assert(password.UseSystemPasswordChar && password.Text == "component-only-example", "toggle_keeps_input_unchanged");
            Assert(showPassword.Text == catalog[language]["first.password.show"], "show_action_localized");
            typeof(Form).GetMethod("OnDeactivate", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(form, [EventArgs.Empty]);
            Assert(password.UseSystemPasswordChar && confirmation.UseSystemPasswordChar, "leaving_dialog_remasks_both");
            click.Invoke(showPassword, [EventArgs.Empty]);
            form.GetType().GetMethod("ToggleInputs", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(form, [false]);
            Assert(password.UseSystemPasswordChar && !showPassword.Enabled && !showConfirmation.Enabled, "submission_remasks_and_disables_reveal");
            form.GetType().GetMethod("ToggleInputs", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(form, [true]);
            Assert(showPassword.Enabled && showConfirmation.Enabled, "retry_enables_visibility_controls");
            var laterHelp = Field<Label>("_laterHelp");
            Assert(laterHelp.Text == string.Format(catalog[language]["first.later.help"], catalog[language]["first.title"]), "later_explains_named_start_menu_entry");
            Assert((int)form.GetType().GetProperty("ResultCode")!.GetValue(form)! == 1, "skip_does_not_report_bootstrap_success");
            password.Clear();
            confirmation.Clear();
            password.Text = confirmation.Text = "discarded-component-example";
            click.Invoke(back, [EventArgs.Empty]);
            Assert(!Field<bool>("_enteringPassword") && password.Text.Length == 0 && confirmation.Text.Length == 0, "back_returns_to_choice_and_clears_inputs");
            Assert(password.UseSystemPasswordChar && confirmation.UseSystemPasswordChar, "back_remasks_both_inputs");
            click.Invoke(begin, [EventArgs.Empty]);
            if (previewRoot is not null)
            {
                Field<Label>("_accountMode").Text = catalog[language]["first.account.protected"];
                Render("password", [showPassword, showConfirmation, back, Field<Button>("_complete")]);
            }
            configurationChecked.Invoke(form, [true]);
            Assert(!begin.Enabled && !password.Enabled && Field<Button>("_complete").Enabled, "existing_credential_allows_close_not_bootstrap");
            Assert(Field<Label>("_status").Text == catalog[language]["first.exists"], "existing_credential_explained");
            if (previewRoot is not null) Render("existing", [Field<Button>("_complete")]);
            using var deferred = (Form)Activator.CreateInstance(form.GetType())!;
            var later = (Button)form.GetType().GetField("_later", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(deferred)!;
            configurationChecked.Invoke(deferred, [false]);
            click.Invoke(later, [EventArgs.Empty]);
            Assert((int)form.GetType().GetProperty("ResultCode")!.GetValue(deferred)! == 1, "defer_closes_without_success_or_password");
            Assert(form.GetType().GetField("_runtime", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(deferred) is null, "defer_component_never_loads_runtime");

            void Render(string step, Button[] buttons)
            {
                form.ShowInTaskbar = false;
                form.StartPosition = FormStartPosition.Manual;
                form.Location = new Point(-32000, -32000);
                form.Show();
                Application.DoEvents();
                form.PerformLayout();
                Assert(Field<object?>("_runtime") is null, "view_preview_never_loads_installed_runtime");
                foreach (var button in buttons)
                {
                    Assert(button.Visible, "step_action_is_visible");
                    Assert(form.ClientRectangle.Contains(form.RectangleToClient(button.RectangleToScreen(button.ClientRectangle))), "button_inside_dialog");
                }
                Assert(password.Visible == (step == "password"), "password_fields_only_on_password_step");
                Assert(Field<Button>("_later").Visible == (step == "choice"), "defer_only_before_password_entry");
                Assert(Field<Label>("_laterHelp").Visible == (step == "choice"), "defer_explanation_only_on_choice_step");
                if (step == "password") Assert(back.Right <= Field<Button>("_complete").Left, "back_precedes_completion_visually");
                using var bitmap = new Bitmap(form.Width, form.Height);
                form.DrawToBitmap(bitmap, new Rectangle(Point.Empty, bitmap.Size));
                bitmap.Save(Path.Combine(previewRoot!, $"first-run-{language}-{step}.png"), System.Drawing.Imaging.ImageFormat.Png);
                form.Hide();
            }
        }
    }
    catch (Exception exception) { testFailure = exception; }
});
thread.SetApartmentState(ApartmentState.STA);
thread.Start();
thread.Join();
if (testFailure is not null) throw testFailure;
Console.WriteLine($"FIRST_RUN_UI_TESTS_OK checks={checks} languages=de,en,fr runtimeStarted=false");
void Assert(bool condition, string name)
{
    if (!condition) throw new Exception($"first_run_ui_test_failed:{name}");
    checks++;
}
