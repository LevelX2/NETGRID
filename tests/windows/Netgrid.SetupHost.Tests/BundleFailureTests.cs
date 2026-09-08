using System.Reflection;

internal static class BundleFailureTests
{
    public static int Run(Assembly assembly)
    {
        var reader = assembly.GetType("Netgrid.SetupHost.MsiPayload", true)!
            .GetMethod("Read", BindingFlags.NonPublic | BindingFlags.Static)!;
        var text = assembly.GetType("Netgrid.Windows.UiText", true)!;
        var failure = assembly.GetType("Netgrid.SetupHost.SetupException", true)!;
        var checks = 0;
        foreach (var language in new[] { "de", "en", "fr" })
        {
            text.GetMethod("Use")!.Invoke(null, [language]);
            foreach (var bytes in new[] { Array.Empty<byte>(), new byte[184] })
            {
                using var stream = new MemoryStream(bytes, writable: false);
                try { reader.Invoke(null, [stream]); }
                catch (TargetInvocationException error) when (error.InnerException?.GetType() == failure)
                {
                    var translated = error.InnerException;
                    if ((string)failure.GetProperty("Code")!.GetValue(translated)! != "payload_hash_mismatch" ||
                        translated.Message.Contains("setup_bundle_", StringComparison.Ordinal) ||
                        translated.Message.Contains("footer_", StringComparison.Ordinal))
                        throw new Exception("bundle_failure_not_localized");
                    checks++;
                    continue;
                }
                throw new Exception("invalid_bundle_not_rejected_by_setup");
            }
        }
        return checks;
    }
}
