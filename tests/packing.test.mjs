import assert from "node:assert/strict";
import test from "node:test";
import { packKey } from "../src/lib/packing.ts";

test("packKey joins the task and supply line with a double colon", () => {
  assert.equal(packKey("cooks-assistant", "Egg"), "cooks-assistant::Egg");
  assert.equal(packKey("train-Mining", "Bronze pickaxe"), "train-Mining::Bronze pickaxe");
});

test("packKey keeps the line verbatim, including colons and empty parts", () => {
  assert.equal(packKey("q", "Food, if you want it"), "q::Food, if you want it");
  assert.equal(packKey("q", "a::b"), "q::a::b");
  assert.equal(packKey("", ""), "::");
});
