#!/usr/bin/env bash
# Ensures a STABLE self-signed code-signing identity exists in a dedicated
# keychain. Signing the app with a stable identity (instead of ad-hoc) keeps the
# code Authority constant across rebuilds, so macOS does NOT reset the Screen
# Recording / Camera / Microphone / Accessibility grants every time the app is
# rebuilt.
#
# The cert is self-signed and left UNTRUSTED — codesign can still sign with it
# (no admin/sudo needed); only Gatekeeper's first-launch check is affected, which
# the user clears once with right-click → Open. Idempotent: a no-op if present.
set -e

CN="Nacho Local Signing"
KC="nacho-build.keychain"
KCPW="nacho-build"

if security find-identity -p codesigning "$KC" 2>/dev/null | grep -q "$CN"; then
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cat > "$TMP/cfg" <<EOF
[req]
distinguished_name = dn
x509_extensions = v3
prompt = no
[dn]
CN = $CN
[v3]
basicConstraints = critical, CA:false
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, codeSigning
EOF

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$TMP/key.pem" -out "$TMP/cert.pem" -days 3650 -config "$TMP/cfg"
openssl pkcs12 -export -inkey "$TMP/key.pem" -in "$TMP/cert.pem" \
  -out "$TMP/id.p12" -passout "pass:$KCPW" -name "$CN"

security create-keychain -p "$KCPW" "$KC" 2>/dev/null || true
security set-keychain-settings "$KC"
security unlock-keychain -p "$KCPW" "$KC"
security import "$TMP/id.p12" -k "$KC" -P "$KCPW" -T /usr/bin/codesign -A
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KCPW" "$KC" >/dev/null 2>&1 || true
EXISTING=$(security list-keychains -d user | sed 's/[" ]//g' | tr '\n' ' ')
security list-keychains -d user -s "$KC" $EXISTING

echo "[ensure-signing-identity] created '$CN' in $KC"
