using System.Globalization;
using System.Text.Json;

namespace Netgrid.Windows;

internal static class UiText
{
    private const string ResourceName = "NETGRID.WindowsUiStrings.json";
    private static readonly string[] SupportedLanguages = ["de", "en", "fr"];
    private static readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> Catalog = Load();
    private static string _language = Normalize(CultureInfo.CurrentUICulture.TwoLetterISOLanguageName);

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
    private readonly ComboBox _languages = new() { DropDownStyle = ComboBoxStyle.DropDownList, Width = 250 };

    private LanguageDialog()
    {
        Text = "NETGRID Setup";
        Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath!);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MinimizeBox = false;
        MaximizeBox = false;
        AutoScaleMode = AutoScaleMode.Dpi;
        ClientSize = new Size(390, 155);
        var label = new Label { Text = "Sprache / Language / Langue", AutoSize = true, Location = new Point(28, 24) };
        _languages.Items.AddRange(["Deutsch", "English", "Français"]);
        _languages.SelectedIndex = UiText.Language switch { "de" => 0, "fr" => 2, _ => 1 };
        _languages.Location = new Point(28, 54);
        var proceed = new Button { Text = "Weiter / Continue / Continuer", AutoSize = true, Location = new Point(205, 105), DialogResult = DialogResult.OK };
        var cancel = new Button { Text = "Abbrechen / Cancel / Annuler", AutoSize = true, Location = new Point(105, 105), DialogResult = DialogResult.Cancel };
        Controls.AddRange([label, _languages, proceed, cancel]);
        AcceptButton = proceed;
        CancelButton = cancel;
    }

    public static bool SelectLanguage()
    {
        using var dialog = new LanguageDialog();
        if (dialog.ShowDialog() != DialogResult.OK) return false;
        UiText.Use(dialog._languages.SelectedIndex switch { 0 => "de", 2 => "fr", _ => "en" });
        return true;
    }
}
