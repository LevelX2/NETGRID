import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const actions = ["PrepareNetgridLifecycle", "BeginNetgridLifecycle", "VerifyNetgridLifecycle", "CommitNetgridLifecycle", "RollbackNetgridLifecycle"];

export function checkLifecycleBinary(file) {
  const bytes = readFileSync(file);
  if (bytes.readUInt16LE(0) !== 0x5a4d) throw new Error("installer_lifecycle_not_pe");
  const pe = bytes.readUInt32LE(0x3c);
  if (bytes.readUInt32LE(pe) !== 0x4550 || bytes.readUInt16LE(pe + 4) !== 0x8664 || bytes.readUInt16LE(pe + 24) !== 0x20b)
    throw new Error("installer_lifecycle_not_native_x64");
  const sectionCount = bytes.readUInt16LE(pe + 6);
  const sections = pe + 24 + bytes.readUInt16LE(pe + 20);
  function offset(rva) {
    for (let index = 0; index < sectionCount; index++) {
      const section = sections + index * 40;
      const start = bytes.readUInt32LE(section + 12);
      const size = bytes.readUInt32LE(section + 16);
      if (rva >= start && rva < start + size) return bytes.readUInt32LE(section + 20) + rva - start;
    }
    throw new Error("installer_lifecycle_pe_rva_invalid");
  }
  const exports = offset(bytes.readUInt32LE(pe + 24 + 112));
  const count = bytes.readUInt32LE(exports + 24);
  const names = offset(bytes.readUInt32LE(exports + 32));
  const exported = new Set();
  for (let index = 0; index < count; index++) {
    const start = offset(bytes.readUInt32LE(names + index * 4));
    const end = bytes.indexOf(0, start);
    if (end < 0) throw new Error("installer_lifecycle_export_invalid");
    exported.add(bytes.toString("ascii", start, end));
  }
  for (const action of actions)
    if (!exported.has(action)) throw new Error(`installer_lifecycle_export_missing:${action}`);
}

export function checkLifecycleAuthoring(authoring) {
  const selector = authoring.match(/<RegistryValue\b[^>]*\bName="CurrentProductCode"[^>]*>/)?.[0];
  const shortcut = authoring.match(/<Shortcut\b[^>]*\bId="NetgridSetupStartMenuShortcut"[^>]*>/)?.[0];
  const cacheArguments = [...authoring.matchAll(/<(?:SetProperty|CustomAction)\b[^>]*>/g)]
    .map(match => match[0]).find(tag => tag.includes('Value=') &&
      (tag.includes('Id="CacheNetgridSetup"') || tag.includes('Property="CacheNetgridSetup"')));
  if (!selector?.includes('Value="[ProductCode]"') ||
      !shortcut?.includes('Target="[NETGRID_DATA_ROOT]\\config\\updates\\[ProductCode]\\NETGRID-Setup.exe"') ||
      !(cacheArguments?.includes('--product-code "[ProductCode]"') || cacheArguments?.includes('--product-code &quot;[ProductCode]&quot;')))
    throw new Error("installer_lifecycle_setup_cache_identity_unbound");
  for (const action of actions) {
    const definition = authoring.match(new RegExp(`<CustomAction Id="${action}"[^>]+>`))?.[0];
    if (!definition?.includes('BinaryRef="NetgridLifecycleActions"') || !definition.includes(`DllEntry="${action}"`))
      throw new Error(`installer_lifecycle_action_unbound:${action}`);
    const scheduled = authoring.match(new RegExp(`<Custom Action="${action}"[^>]+>`))?.[0];
    if (!scheduled || scheduled.includes('Condition=')) throw new Error(`installer_lifecycle_action_not_unconditional:${action}`);
  }
  if (!authoring.includes('<Property Id="MSIRESTARTMANAGERCONTROL" Value="DisableShutdown"'))
    throw new Error("installer_lifecycle_restart_manager_owner_conflict");
  const upgrade = authoring.match(/<MajorUpgrade\b[^>]*>/)?.[0];
  if (!upgrade?.includes('AllowDowngrades="yes"'))
    throw new Error("installer_lifecycle_rollback_downgrade_invalid");
  // Do not infer executable scheduling from decompiled MajorUpgrade: the
  // observed WiX 7 reconstruction says afterInstallFinalize even when the
  // real table is 6500 < 6501 < 6600. The artifact gate reads that table via
  // check-windows-msi-lifecycle.ps1 before using this structural projection.
  const outerLease = authoring.match(/<Property Id="NETGRID_UPDATE_LEASE"[^>]*>/)?.[0];
  if (!outerLease?.includes('Secure="yes"') || !outerLease.includes('Hidden="yes"'))
    throw new Error("installer_lifecycle_outer_lease_property_invalid");
  for (const action of ["RemoveNetgridFirewall", "DeleteNetgridData"]) {
    const scheduled = authoring.match(new RegExp(`<Custom Action="${action}"[^>]+>`))?.[0];
    if (!scheduled?.includes('NOT UPGRADINGPRODUCTCODE'))
      throw new Error(`installer_lifecycle_nested_cleanup_unsafe:${action}`);
  }
}

export function checkLifecycleSource(authoring) {
  checkLifecycleAuthoring(authoring);
  const upgrade = authoring.match(/<MajorUpgrade\b[^>]*>/)?.[0];
  if (!upgrade?.includes('Schedule="afterInstallExecute"'))
    throw new Error("installer_lifecycle_upgrade_sequence_invalid");
  const verification = authoring.match(/<Custom Action="VerifyNetgridLifecycle"[^>]+>/)?.[0];
  if (!verification?.includes('Before="InstallFinalize"'))
    throw new Error("installer_lifecycle_verification_sequence_invalid");
  const definition = authoring.match(/<CustomAction Id="VerifyNetgridLifecycle"[^>]+>/)?.[0];
  if (!definition?.includes('Execute="deferred"') || !definition.includes('Impersonate="no"') || !definition.includes('Return="check"'))
    throw new Error("installer_lifecycle_verification_execution_invalid");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf("--binary");
  if (index < 0 || !process.argv[index + 1]) throw new Error("installer_lifecycle_binary_required");
  checkLifecycleBinary(path.resolve(process.argv[index + 1]));
  process.stdout.write("INSTALLER_LIFECYCLE_BINARY_OK architecture=x64 exports=5\n");
}
