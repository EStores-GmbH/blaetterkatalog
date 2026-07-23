import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { STANDARD_AKZENT, sichereAkzentfarbe } from '../src/farbe.ts';

describe('sichereAkzentfarbe', () => {
  test('lässt einen gültigen Hex-Wert durch', () => {
    assert.equal(sichereAkzentfarbe('#0057a0'), '#0057a0');
    assert.equal(sichereAkzentfarbe('#ABCDEF'), '#ABCDEF');
  });

  test('fällt bei Unsinn auf den Standard zurück, statt ihn ins CSS zu lassen', () => {
    for (const boese of ['javascript:alert(1)', 'red; background:url(x)', '#abc', '', undefined]) {
      assert.equal(sichereAkzentfarbe(boese), STANDARD_AKZENT);
    }
  });
});
