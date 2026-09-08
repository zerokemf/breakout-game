# Procedural arcade audio

No audio downloads or third-party samples are required. `../../js/audio.js` synthesizes original tones using the browser Web Audio API.

Call `AudioManager.unlock()` directly from a trusted user gesture before playback. Unsupported or blocked audio gracefully remains silent. Constructor settings and `setVolumes(music, sfx)` use independent values from **0 to 1**; zero is silent. Defaults are music 0.25 and effects 0.65.

Supported `play(name)` cues:

- `paddle_hit`
- `wall_hit`
- `brick_hit`
- `brick_break`
- `steel_hit`
- `powerup_spawn`
- `powerup_pickup`
- `lose_life`
- `level_clear`
- `game_over`
- `high_score`

Music is a quiet, original looping sine-wave arpeggio, scheduled only after unlock. `suspend()` silences active voices and stops music scheduling; `resume()` restarts an already unlocked audio manager. Call suspend on pause and document visibility loss. The manager never creates an audio context in its constructor or auto-unlocks on load. Voices are bounded and disconnected when finished.
