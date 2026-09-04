using System.Text.Json;

namespace Netgrid.Launcher;

internal sealed record UpdateSettings(bool AllowPrerelease)
{
    public static UpdateSettings Load(string dataRoot)
    {
        var path = SettingsPath(dataRoot);
        if (!File.Exists(path)) return new(false);
        try
        {
            return JsonSerializer.Deserialize<UpdateSettings>(File.ReadAllText(path)) ?? new(false);
        }
        catch (JsonException)
        {
            throw new InvalidOperationException("update_settings_invalid");
        }
    }

    public void Save(string dataRoot)
    {
        var path = SettingsPath(dataRoot);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var temporary = $"{path}.{Guid.NewGuid():N}.tmp";
        File.WriteAllText(temporary, JsonSerializer.Serialize(this));
        File.Move(temporary, path, overwrite: true);
    }

    private static string SettingsPath(string dataRoot) => Path.Combine(dataRoot, "runtime", "settings", "update.json");
}
