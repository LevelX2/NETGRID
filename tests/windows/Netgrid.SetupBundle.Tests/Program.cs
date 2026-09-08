using System.Buffers.Binary;
using System.Security.Cryptography;
using Netgrid.Windows;

var checks = 0;
var product = new SetupBundle.Metadata(new Version(1, 0, 8204), Guid.Parse("5427B191-C789-4E91-979A-A8087DA0AEE2"), 123456789, 10903);
var stub = new byte[100003];
var msi = new byte[200017];
new Random(173).NextBytes(stub);
new Random(219).NextBytes(msi);
"MZ"u8.CopyTo(stub);
new byte[] { 0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1 }.CopyTo(msi, 0);
var originalStubHash = SHA256.HashData(stub);
var originalMsiHash = SHA256.HashData(msi);
var first = Compose(product);
var second = Compose(product);
Assert(first.SequenceEqual(second), "byte_identical_reconstruction");
Assert(first.Length == stub.Length + msi.Length + SetupBundle.FooterSize, "exact_bundle_size");
Assert(first.AsSpan(0, stub.Length).SequenceEqual(stub), "stub_unchanged");
Assert(first.AsSpan(stub.Length, msi.Length).SequenceEqual(msi), "msi_unchanged");
using (var input = new MemoryStream(first, writable: false))
using (var output = new MemoryStream())
{
    var read = SetupBundle.ReadVerified(input);
    Assert(read.Product == product, "metadata_roundtrip");
    Assert(read.StubBytes == stub.Length && read.MsiBytes == msi.Length, "length_roundtrip");
    Assert(read.StubSha256 == Convert.ToHexString(originalStubHash).ToLowerInvariant(), "stub_hash");
    Assert(read.MsiSha256 == Convert.ToHexString(originalMsiHash).ToLowerInvariant(), "msi_hash");
    Assert(SetupBundle.ExtractVerified(input, output) == read, "extract_same_identity");
    Assert(output.ToArray().SequenceEqual(msi), "only_msi_extracted");
}
Assert(SHA256.HashData(stub).SequenceEqual(originalStubHash) && SHA256.HashData(msi).SequenceEqual(originalMsiHash), "source_bytes_preserved");
foreach (var index in new[] { 1, 63, stub.Length - 1, stub.Length, stub.Length + 8, first.Length - SetupBundle.FooterSize - 1, first.Length - 1 })
{
    var bad = (byte[])first.Clone();
    bad[index] ^= 0x80;
    RejectRead(bad, "corrupt_byte_" + index);
}
foreach (var count in new[] { 0, 1, 183, 184, first.Length - 1 }) RejectRead(first[..count], "truncated_" + count);
RejectRead([.. first, 0], "trailing_byte");
RejectRead([0, .. first], "prefixed_byte");
foreach (var (offset, value) in new (int, long)[] { (24, -1), (24, 63), (24, long.MaxValue), (32, 0), (32, 7), (32, long.MaxValue), (40, 0), (48, -1) })
{
    var bad = (byte[])first.Clone();
    BinaryPrimitives.WriteInt64LittleEndian(bad.AsSpan(bad.Length - SetupBundle.FooterSize + offset), value);
    RehashFooter(bad);
    RejectRead(bad, $"invalid_long_{offset}_{value}");
}
foreach (var (offset, value) in new[] { (16, 2), (20, 183), (56, -1), (56, 256), (60, 256), (64, 65536), (68, 1) })
{
    var bad = (byte[])first.Clone();
    BinaryPrimitives.WriteInt32LittleEndian(bad.AsSpan(bad.Length - SetupBundle.FooterSize + offset), value);
    RehashFooter(bad);
    RejectRead(bad, $"invalid_int_{offset}_{value}");
}
{
    var bad = (byte[])first.Clone();
    bad.AsSpan(bad.Length - SetupBundle.FooterSize + 72, 16).Clear();
    RehashFooter(bad);
    RejectRead(bad, "empty_product_code");
}
foreach (var invalid in new[] {
    product with { ProductVersion = new Version(1, 0) },
    product with { ProductVersion = new Version(1, 0, 1, 0) },
    product with { ProductVersion = new Version(256, 0, 1) },
    product with { ProductCode = Guid.Empty },
    product with { PayloadBytes = 0 },
    product with { PayloadFileCount = 0 }
}) Reject(() => Compose(invalid), "writer_metadata");
using (var input = new MemoryStream(first))
{
    Reject(() => SetupBundle.ExtractVerified(input, input), "extract_input_as_output");
    using var nonempty = new MemoryStream(new byte[12]);
    Reject(() => SetupBundle.ExtractVerified(input, nonempty), "extract_nonempty_output");
    using var readonlyOutput = new MemoryStream([], writable: false);
    Reject(() => SetupBundle.ExtractVerified(input, readonlyOutput), "extract_readonly_output");
}
using (var sourceStub = new MemoryStream(stub))
using (var sourceMsi = new MemoryStream(msi))
{
    Reject(() => SetupBundle.Write(sourceStub, sourceMsi, sourceStub, product), "write_input_as_output");
    using var target = new MemoryStream();
    Reject(() => SetupBundle.Write(sourceStub, sourceStub, target, product), "same_inputs");
}
Console.WriteLine($"SETUP_BUNDLE_TESTS_OK checks={checks} installationStarted=false");

byte[] Compose(SetupBundle.Metadata metadata)
{
    using var sourceStub = new MemoryStream(stub, writable: false);
    using var sourceMsi = new MemoryStream(msi, writable: false);
    using var output = new MemoryStream();
    SetupBundle.Write(sourceStub, sourceMsi, output, metadata);
    return output.ToArray();
}
void RejectRead(byte[] bytes, string label)
{
    using var input = new MemoryStream(bytes, writable: false);
    using var output = new MemoryStream();
    Reject(() => SetupBundle.ExtractVerified(input, output), label);
    Assert(output.Length == 0, label + "_no_unverified_output");
}
void Reject(Action action, string label)
{
    try { action(); }
    catch (InvalidOperationException exception) when (exception.Message.StartsWith("setup_bundle_", StringComparison.Ordinal)) { checks++; return; }
    throw new Exception("accepted_invalid_bundle:" + label);
}
void Assert(bool value, string label)
{
    if (!value) throw new Exception(label);
    checks++;
}
void RehashFooter(byte[] bundle)
{
    var footer = bundle.AsSpan(bundle.Length - SetupBundle.FooterSize);
    SHA256.HashData(footer[..152], footer[152..]);
}
