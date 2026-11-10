import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { CHANGELOG, CURRENT_VERSION } from "./changelog"

describe("changelog", () => {
  it("is newest first, with unique versions and dates that don't go backwards", () => {
    const versions = CHANGELOG.map((r) => r.version)
    assert.equal(new Set(versions).size, versions.length)
    for (let i = 1; i < CHANGELOG.length; i++) {
      assert.ok(CHANGELOG[i - 1]!.date >= CHANGELOG[i]!.date, `${versions[i - 1]} is older than ${versions[i]}`)
    }
  })

  it("matches the version in package.json", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version: string }
    assert.ok(
      pkg.version.startsWith(`${CURRENT_VERSION}.`),
      `package.json ${pkg.version} vs changelog ${CURRENT_VERSION}`
    )
  })
})
