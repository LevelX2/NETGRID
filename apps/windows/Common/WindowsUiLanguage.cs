using Microsoft.Win32;

namespace Netgrid.Windows;

internal static class WindowsUiLanguage
{
    public const string RegistryPath = @"SOFTWARE\LevelX2\NETGRID";
    public const string RegistryValue = "UiLanguage";

    public static bool IsSupported(string value) => value is "de" or "en" or "fr";

    public static string Resolve(object? preference, string windowsLanguage)
    {
        if (preference is null) return IsSupported(windowsLanguage) ? windowsLanguage : "en";
        return preference is string value && IsSupported(value)
            ? value : throw new InvalidOperationException("windows_ui_language_preference_invalid");
    }

    public static object? ReadPreference()
    {
        using var key = Registry.LocalMachine.OpenSubKey(RegistryPath, writable: false);
        return key?.GetValue(RegistryValue);
    }
}
