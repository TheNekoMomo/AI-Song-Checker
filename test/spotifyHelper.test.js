const test = require('node:test');
const assert = require('node:assert/strict');

const { parseSpotifyTrackURL } = require('../src/utils/spotifyHelper');

test('parseSpotifyTrackURL returns valid for a standard Spotify track URL', () => {
  const result = parseSpotifyTrackURL('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');

  assert.equal(result.valid, true);
  assert.equal(result.trackId, '4cOdK2wGLETKBW3PvgPWqT');
});

test('parseSpotifyTrackURL returns invalid for non-Spotify host', () => {
  const result = parseSpotifyTrackURL('https://example.com/track/4cOdK2wGLETKBW3PvgPWqT');

  assert.equal(result.valid, false);
  assert.equal(result.trackId, null);
});

test('parseSpotifyTrackURL returns invalid for malformed URL', () => {
  const result = parseSpotifyTrackURL('not-a-url');

  assert.equal(result.valid, false);
  assert.equal(result.trackId, null);
});