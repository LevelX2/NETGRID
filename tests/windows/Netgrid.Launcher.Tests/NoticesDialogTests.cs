using System.Reflection;

internal static class NoticesDialogTests
{
    public static int Run(Assembly assembly)
    {
        var type = assembly.GetType("Netgrid.Launcher.NoticesDialog", true)!;
        var read = type.GetMethod("ReadContent", BindingFlags.Static | BindingFlags.NonPublic)!;
        var root = Path.Combine(Path.GetTempPath(), "netgrid-notices-" + Guid.NewGuid().ToString("N"));
        var path = Path.Combine(root, "THIRD-PARTY-NOTICES.txt");
        var checks = 0;
        void Assert(bool value, string code) { if (!value) throw new Exception(code); checks++; }
        try
        {
            Directory.CreateDirectory(root);
            const string expected = "NETGRID fixture notice\r\nLicense line";
            File.WriteAllText(path, expected);
            Assert((string)read.Invoke(null, [path])! == expected, "notices_exact_content");
            foreach (var language in new[] { "de", "en", "fr" })
            {
                assembly.GetType("Netgrid.Windows.UiText", true)!.GetMethod("Use")!.Invoke(null, [language]);
                using var form = (Form)Activator.CreateInstance(type, BindingFlags.Instance | BindingFlags.NonPublic, null, [path], null)!;
                var content = (RichTextBox)type.GetField("_content", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(form)!;
                Assert(content.ReadOnly && content.Text == expected, "notices_read_only_exact_content");
                Assert(content.ScrollBars == RichTextBoxScrollBars.Both && !content.WordWrap, "notices_scrollable_without_reflow");
                Assert(!string.IsNullOrWhiteSpace(form.Text) && !string.IsNullOrWhiteSpace(content.AccessibleName), "notices_localized_accessibility");
                Assert(!form.Visible, "notices_test_window_not_visible");
            }
            try
            {
                read.Invoke(null, [Path.Combine(root, "missing.txt")]);
                throw new Exception("missing_notices_accepted");
            }
            catch (TargetInvocationException exception) when (exception.InnerException is FileNotFoundException)
            {
                Assert(true, "missing_notices_rejected");
            }
        }
        finally
        {
            var fullRoot = Path.GetFullPath(root);
            if (Path.GetDirectoryName(fullRoot) != Path.TrimEndingDirectorySeparator(Path.GetFullPath(Path.GetTempPath())) ||
                !Path.GetFileName(fullRoot).StartsWith("netgrid-notices-", StringComparison.Ordinal))
                throw new Exception("notices_fixture_cleanup_scope_invalid");
            if (Directory.Exists(fullRoot)) Directory.Delete(fullRoot, recursive: true);
        }
        return checks;
    }
}
