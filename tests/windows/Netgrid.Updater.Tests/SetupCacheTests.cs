using System.ComponentModel;
using System.Security.Cryptography;
using Microsoft.Win32;
using Netgrid.Windows;

internal static class SetupCacheTests
{
    public static int Run(string scratch)
    {
        var checks = 0;
        var data = Path.Combine(scratch, "cache-data");
        Directory.CreateDirectory(Path.Combine(data, "config"));
        var program = Path.Combine(scratch, "program");
        var a = "{47062817-1ECC-4283-B95D-AF23557B9771}";
        var b = "{3552C5AD-00F5-47D3-A332-BEC6CA280ED7}";
        var sourceA = Path.Combine(scratch, "setup-a.exe");
        var sourceB = Path.Combine(scratch, "setup-b.exe");
        File.WriteAllText(sourceA, "immutable-setup-a");
        File.WriteAllText(sourceB, "immutable-setup-b");
        var hashA = Digest(sourceA);
        var hashB = Digest(sourceB);
        var keyName = @"Software\NETGRID-SetupCache-Test-" + Guid.NewGuid().ToString("N");
        try
        {
            using var machine = Registry.CurrentUser.CreateSubKey(keyName, writable: true);
            using var product = machine.CreateSubKey(InstalledSetupCache.RegistryPath, writable: true);
            product.SetValue("InstallDirectory", program);
            product.SetValue("RuntimeDataRoot", data);
            product.SetValue("CurrentProductCode", a);
            InstalledSetupCache.Store(data, a, sourceA, hashA);
            Selected(a, hashA);
            InstalledSetupCache.Store(data, b, sourceB, hashB);
            Selected(a, hashA); // Failed/incomplete B has not switched the MSI selector.
            product.SetValue("CurrentProductCode", b);
            Selected(b, hashB);
            product.SetValue("CurrentProductCode", a); // Registry rollback selects A unchanged.
            Selected(a, hashA);
            var cachedA = InstalledSetupCache.PathFor(data, a);
            var stamp = File.GetLastWriteTimeUtc(cachedA);
            InstalledSetupCache.Store(data, a, sourceA, hashA);
            Check(File.GetLastWriteTimeUtc(cachedA) == stamp, "repair_rewrote_cache");
            Reject(() => InstalledSetupCache.Store(data, a, sourceB, hashB), "setup_cache_product_identity_conflict");
            Check(Digest(cachedA) == hashA, "conflict_overwrote_old_setup");
            Reject(() => InstalledSetupCache.Store(data, b, sourceA, hashB), "setup_cache_hash_mismatch");
            using (var held = InstalledSetupCache.OpenRegistered(machine, program, data))
            {
                Denied(() => File.WriteAllText(cachedA, "replace"));
                Denied(() => File.Delete(cachedA));
                Denied(() => Directory.Move(Path.GetDirectoryName(cachedA)!, Path.GetDirectoryName(cachedA)! + "-moved"));
                Check(held.Sha256 == hashA, "locked_identity_changed");
            }
            foreach (var invalid in new[] { "", "../other", a.ToLowerInvariant(), Guid.Empty.ToString("B") })
                Reject(() => InstalledSetupCache.PathFor(data, invalid), "setup_cache_product_code_invalid");
            Reject(() => { using var wrong = InstalledSetupCache.OpenRegistered(machine, program + "-wrong", data); }, "setup_cache_registered_identity_invalid");
            Reject(() => { using var wrong = InstalledSetupCache.OpenRegistered(machine, program, data + "-wrong"); }, "setup_cache_registered_identity_invalid");
            File.WriteAllText(Path.Combine(data, "config", "updates", "NETGRID-Setup.exe"), "old-flat-slot");
            File.WriteAllText(Path.Combine(data, "config", "updates", "NETGRID-Setup.pending.exe"), "old-pending-slot");
            product.SetValue("CurrentProductCode", "{8C89EFBC-5725-44A1-B8D2-849D1F0E74C0}");
            var missingRejected = false;
            try { using var missing = InstalledSetupCache.OpenRegistered(machine, program, data); }
            catch (Win32Exception) { missingRejected = true; }
            Check(missingRejected, "missing_product_selected_unbound_setup");
            product.DeleteValue("CurrentProductCode");
            Reject(() => { using var missing = InstalledSetupCache.OpenRegistered(machine, program, data); }, "setup_cache_registered_identity_invalid");
            product.SetValue("CurrentProductCode", a, RegistryValueKind.ExpandString);
            Reject(() => { using var expanded = InstalledSetupCache.OpenRegistered(machine, program, data); }, "setup_cache_registered_identity_invalid");

            void Selected(string code, string hash)
            {
                using var selected = InstalledSetupCache.OpenRegistered(machine, program, data);
                Check(selected.Path == InstalledSetupCache.PathFor(data, code) && selected.Sha256 == hash, "wrong_product_cache_selected");
            }
        }
        finally { Registry.CurrentUser.DeleteSubKeyTree(keyName, throwOnMissingSubKey: false); }
        return checks;

        void Check(bool condition, string code) { if (!condition) throw new InvalidOperationException(code); checks++; }
        void Reject(Action action, string code)
        {
            try { action(); }
            catch (InvalidOperationException error) when (error.Message == code) { checks++; return; }
            throw new InvalidOperationException("expected_rejection_missing:" + code);
        }
        void Denied(Action action)
        {
            try { action(); }
            catch (IOException) { checks++; return; }
            catch (UnauthorizedAccessException) { checks++; return; }
            throw new InvalidOperationException("cache_lock_not_enforced");
        }
    }
    private static string Digest(string path) => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(path))).ToLowerInvariant();
}
