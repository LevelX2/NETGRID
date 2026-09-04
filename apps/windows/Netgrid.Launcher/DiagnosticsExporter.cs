using System.IO.Compression;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Netgrid.Launcher;

internal static partial class DiagnosticsExporter
{
    public static void Export(LauncherRuntime runtime, string outputPath)
    {
        var destination = Path.GetFullPath(outputPath);
        if (!destination.EndsWith(".zip", StringComparison.OrdinalIgnoreCase)) destination += ".zip";
        Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
        var scratch = Path.Combine(Path.GetTempPath(), $"netgrid-diagnostics-{Guid.NewGuid():N}");
        Directory.CreateDirectory(scratch);
        try
        {
            var environment = File.ReadAllText(runtime.EnvironmentFile);
            var secrets = SecretValues(environment);
            File.WriteAllText(Path.Combine(scratch, "runtime.env.redacted"), Redact(environment, secrets));
            File.WriteAllText(Path.Combine(scratch, "diagnostics.json"), JsonSerializer.Serialize(new
            {
                schemaVersion = "netgrid-windows-diagnostics-v1",
                productVersion = InstalledProduct.Version(runtime.ProgramRoot),
                operatingSystem = Environment.OSVersion.VersionString,
                architecture = System.Runtime.InteropServices.RuntimeInformation.OSArchitecture.ToString(),
                uiCulture = System.Globalization.CultureInfo.CurrentUICulture.Name,
                generatedAt = DateTimeOffset.UtcNow,
                containsDatabase = false,
                containsCredentials = false,
                uploaded = false,
            }, new JsonSerializerOptions { WriteIndented = true }));
            if (Directory.Exists(runtime.LogDirectory))
            {
                var allowed = Directory.EnumerateFiles(runtime.LogDirectory, "*.log*")
                    .Where(path => Path.GetFileName(path).StartsWith("launcher-", StringComparison.OrdinalIgnoreCase) || Path.GetFileName(path).StartsWith("updater-", StringComparison.OrdinalIgnoreCase));
                foreach (var log in allowed)
                {
                    if ((File.GetAttributes(log) & FileAttributes.ReparsePoint) != 0) continue;
                    var content = File.ReadAllText(log);
                    if (content.Length > 1_000_000) content = content[^1_000_000..];
                    File.WriteAllText(Path.Combine(scratch, Path.GetFileName(log)), Redact(content, secrets));
                }
            }
            var temporary = $"{destination}.{Guid.NewGuid():N}.tmp";
            ZipFile.CreateFromDirectory(scratch, temporary, CompressionLevel.Optimal, includeBaseDirectory: false);
            File.Move(temporary, destination, overwrite: true);
        }
        finally
        {
            Directory.Delete(scratch, recursive: true);
        }
    }

    private static IReadOnlyList<string> SecretValues(string environment) => environment.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
        .Select(line => line.Split('=', 2))
        .Where(parts => parts.Length == 2 && SecretName().IsMatch(parts[0]))
        .Select(parts => parts[1].Trim().Trim('"'))
        .Where(value => value.Length > 0)
        .ToArray();

    private static string Redact(string value, IReadOnlyList<string> secrets)
    {
        var redacted = SecretAssignment().Replace(value, "$1=<redacted>");
        foreach (var secret in secrets) redacted = redacted.Replace(secret, "<redacted>", StringComparison.Ordinal);
        return redacted;
    }

    [GeneratedRegex(@"(?im)^([^=]*(?:TOKEN|SECRET|PASSWORD|AUTH|SESSION)[^=]*)=.*$")]
    private static partial Regex SecretAssignment();
    [GeneratedRegex("TOKEN|SECRET|PASSWORD|AUTH|SESSION", RegexOptions.IgnoreCase)]
    private static partial Regex SecretName();
}
