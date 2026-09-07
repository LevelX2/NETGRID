using System.Globalization;
using System.Text.Json;

namespace Netgrid.Windows;

internal static class UiText
{
    private const string ResourceName = "NETGRID.WindowsUiStrings.json";
    private static readonly string[] SupportedLanguages = ["de", "en", "fr"];
    private static readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> Catalog = Load();
    private static string _language = WindowsUiLanguage.Resolve(WindowsUiLanguage.ReadPreference(), CultureInfo.CurrentUICulture.TwoLetterISOLanguageName);

    public static string Language => _language;
    public static IReadOnlyList<string> Languages => SupportedLanguages;

    public static void Use(string language) => _language = Normalize(language);

    public static string Get(string key, params object[] arguments)
    {
        if (!Catalog[_language].TryGetValue(key, out var value)) throw new InvalidOperationException($"ui_string_missing:{_language}:{key}");
        return arguments.Length == 0 ? value : string.Format(CultureInfo.CurrentCulture, value, arguments);
    }

    public static object Audit => new
    {
        schemaVersion = "netgrid-windows-ui-localization-v1",
        selectedLanguage = Language,
        languages = Languages,
        fallbackLanguage = "en",
        keyCount = Catalog["en"].Count,
        complete = Languages.All(language => Catalog[language].Keys.Order().SequenceEqual(Catalog["en"].Keys.Order())),
    };

    private static string Normalize(string language) => SupportedLanguages.Contains(language, StringComparer.OrdinalIgnoreCase) ? language.ToLowerInvariant() : "en";

    private static IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> Load()
    {
        using var stream = typeof(UiText).Assembly.GetManifestResourceStream(ResourceName) ?? throw new InvalidOperationException("ui_catalog_missing");
        return JsonSerializer.Deserialize<Dictionary<string, IReadOnlyDictionary<string, string>>>(stream) ?? throw new InvalidOperationException("ui_catalog_invalid");
    }
}

internal sealed class LanguageDialog : Form
{
    private readonly ComboBox _languages = new() { DropDownStyle = ComboBoxStyle.DropDownList, Dock = DockStyle.Top };

    internal LanguageDialog()
    {
        SuspendLayout();
        Text = "NETGRID Setup";
        Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath!);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MinimizeBox = false;
        MaximizeBox = false;
        AutoScaleMode = AutoScaleMode.Dpi;
        ClientSize = new Size(390, 180);
        var layout = new TableLayoutPanel
        {
            Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 3, Padding = new Padding(24),
        };
        layout.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
        layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
        var label = new Label { Text = "Sprache / Language / Langue", AutoSize = true, Margin = new Padding(3, 0, 3, 10) };
        var proceed = new Button { AutoSize = true, MinimumSize = new Size(100, 32), DialogResult = DialogResult.OK };
        var cancel = new Button { AutoSize = true, MinimumSize = new Size(100, 32), DialogResult = DialogResult.Cancel };
        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Bottom, AutoSize = true, WrapContents = false,
            FlowDirection = FlowDirection.RightToLeft, Margin = new Padding(0, 16, 0, 0),
        };
        actions.Controls.AddRange([proceed, cancel]);
        _languages.SelectedIndexChanged += (_, _) =>
        {
            UiText.Use(_languages.SelectedIndex switch { 0 => "de", 2 => "fr", _ => "en" });
            proceed.Text = UiText.Get("setup.language.continue");
            cancel.Text = UiText.Get("setup.language.cancel");
        };
        _languages.Items.AddRange(["Deutsch", "English", "Français"]);
        _languages.SelectedIndex = UiText.Language switch { "de" => 0, "fr" => 2, _ => 1 };
        layout.Controls.Add(label, 0, 0);
        layout.Controls.Add(_languages, 0, 1);
        layout.Controls.Add(actions, 0, 2);
        Controls.Add(layout);
        AcceptButton = proceed;
        CancelButton = cancel;
        AutoScaleDimensions = new SizeF(96, 96);
        ResumeLayout(performLayout: true);
    }

    public static bool SelectLanguage()
    {
        using var dialog = new LanguageDialog();
        if (dialog.ShowDialog() != DialogResult.OK) return false;
        UiText.Use(dialog._languages.SelectedIndex switch { 0 => "de", 2 => "fr", _ => "en" });
        return true;
    }
}
