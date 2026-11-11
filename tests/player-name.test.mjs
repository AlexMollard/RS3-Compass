import assert from "node:assert/strict";
import test from "node:test";
import {
  playerKey,
  publicProfileId,
  samePlayerName,
} from "../src/lib/playerName.ts";

test("publicProfileId keeps the stored rs3:<lowercase name> format", () => {
  assert.equal(publicProfileId(" Some_Name "), "rs3:some name");
  assert.equal(publicProfileId("Iron  Name"), "rs3:iron name");
  assert.equal(publicProfileId("Zezima"), "rs3:zezima");
});

test("playerKey normalises then lowercases, and throws on invalid names", () => {
  assert.equal(playerKey("Iron__Name"), "iron name");
  assert.equal(playerKey("iron name"), playerKey("IRON NAME"));
  for (const value of ["", "   ", "Thirteen char", "bad!", undefined, 7]) {
    assert.throws(() => playerKey(value));
    assert.throws(() => publicProfileId(value));
  }
});

test("playerKey matches the English-locale lowercase it replaced", () => {
  for (const name of ["İzmir", "ΑΣ", "ÀÉÎ Õü", "Straße", "Ǆemal"]) {
    assert.equal(playerKey(name), playerKey(name).toLocaleLowerCase("en"));
    assert.equal(playerKey(name), name.toLocaleLowerCase("en"));
  }
});

test("samePlayerName ignores case and spacing and never throws", () => {
  assert.equal(samePlayerName("Iron_Name", " iron name "), true);
  assert.equal(samePlayerName("Iron Name", "Iron Game"), false);
  assert.equal(samePlayerName("bad!", "bad!"), false);
  assert.equal(samePlayerName("", ""), false);
});
