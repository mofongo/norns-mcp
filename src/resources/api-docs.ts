import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const API_REFERENCE = `# norns Lua API Reference

## System

- \`norns.script.load(path)\` - Load a script (path relative to dust/, e.g., "code/awake/awake.lua")
- \`norns.script.clear()\` - Clear the current script
- \`norns.state.name\` - Current script name
- \`norns.state.path\` - Current script path
- \`norns.state.engine\` - Current engine name

## Script Lifecycle Callbacks
- \`init()\` - Called after script loads
- \`cleanup()\` - Called before script unloads
- \`redraw()\` - Called to refresh the screen
- \`key(n, z)\` - Called on key press/release (n=1-3, z=0/1)
- \`enc(n, delta)\` - Called on encoder turn (n=1-3, delta=turn amount)

## Screen
- \`screen.clear()\` - Clear the screen buffer
- \`screen.update()\` - Push buffer to display
- \`screen.level(l)\` - Set brightness (0-15)
- \`screen.move(x, y)\` - Move cursor
- \`screen.line(x, y)\` - Draw line to position
- \`screen.rect(x, y, w, h)\` - Draw rectangle
- \`screen.circle(x, y, r)\` - Draw circle
- \`screen.text(str)\` - Draw text at cursor
- \`screen.text_center(str)\` - Draw centered text
- \`screen.font_face(font)\` - Set font (1-67)
- \`screen.font_size(size)\` - Set font size
- \`screen.fill()\` - Fill last drawn shape
- \`screen.stroke()\` - Stroke last drawn shape
- \`screen.pixel(x, y)\` - Draw single pixel
- \`screen.aa(state)\` - Enable/disable anti-aliasing (0/1)
- \`screen.line_width(w)\` - Set line width
- \`screen.peek(x, y, w, h)\` - Read pixel data from region
- \`_norns.screen_export_png(filename)\` - Export screen to PNG file

Screen is 128x64 pixels. Coordinates: x=0-127, y=0-63. Level 0=off, 15=brightest.

## Parameters
- \`params:add_number(id, name, min, max, default)\` - Add number parameter
- \`params:add_option(id, name, options, default)\` - Add option parameter
- \`params:add_control(id, name, controlspec, formatter)\` - Add control parameter
- \`params:add_taper(id, name, min, max, default, k, units)\` - Add taper parameter
- \`params:add_trigger(id, name)\` - Add trigger parameter
- \`params:add_separator(id, name)\` - Add visual separator
- \`params:add_group(id, name, n)\` - Add parameter group
- \`params:add_binary(id, name, behavior, default)\` - Add binary parameter
- \`params:set(id, value)\` - Set parameter value
- \`params:get(id)\` - Get parameter value
- \`params:string(id)\` - Get parameter display string
- \`params:delta(id, delta)\` - Change parameter by delta
- \`params:set_action(id, fn)\` - Set callback for parameter changes
- \`params.count\` - Total number of parameters
- \`params:lookup_param(index)\` - Get param object by index
- \`params:print()\` - Print all parameters to REPL
- \`params:read(filename)\` - Read parameters from file
- \`params:write(filename)\` - Write parameters to file

## ControlSpec
- \`controlspec.new(min, max, warp, step, default, units)\` - Create new ControlSpec
- \`controlspec.UNIPOLAR\` - 0 to 1
- \`controlspec.BIPOLAR\` - -1 to 1
- \`controlspec.FREQ\` - 20 to 20000 Hz (exponential)
- \`controlspec.WIDEFREQ\` - 0.1 to 20000 Hz
- \`controlspec.AMP\` - 0 to 1 (dB amp)
- \`controlspec.PAN\` - -1 to 1
- \`controlspec.DB\` - -math.huge to 6 dB

## Clock
- \`clock.run(fn, ...)\` - Start a coroutine
- \`clock.sleep(seconds)\` - Sleep in a coroutine
- \`clock.sync(beats)\` - Sync to beat clock
- \`clock.cancel(coroutine_id)\` - Cancel a running coroutine
- \`clock.get_tempo()\` - Get current BPM
- \`clock.get_beats()\` - Get current beat count
- \`clock.set_tempo(bpm)\` - Set tempo (if internal clock source)
- \`clock.transport.start()\` - Start transport
- \`clock.transport.stop()\` - Stop transport

## Metro (Repeating Timers)
- \`metro[n]\` - Access metro n (1-36)
- \`metro[n]:start(time, count, stage)\` - Start metro (time in seconds)
- \`metro[n]:stop()\` - Stop metro
- \`metro[n].event\` - Callback function (receives stage)
- \`metro.init(id, time, count)\` - Initialize a metro

## MIDI
- \`midi.connect(port)\` - Connect to MIDI device
- \`midi_device:note_on(note, vel, ch)\` - Send note on
- \`midi_device:note_off(note, vel, ch)\` - Send note off
- \`midi_device:cc(cc, val, ch)\` - Send CC
- \`midi_device:program_change(val, ch)\` - Send program change
- \`midi_device.event\` - Raw MIDI event callback

## Softcut (Multi-voice Sample Player/Looper)
- \`softcut.enable(voice, state)\` - Enable/disable voice (1-6)
- \`softcut.buffer(voice, buf)\` - Set buffer (1 or 2)
- \`softcut.level(voice, lvl)\` - Set voice level (0.0-1.0)
- \`softcut.pan(voice, pan)\` - Set pan (-1.0 to 1.0)
- \`softcut.play(voice, state)\` - Start/stop playback (0/1)
- \`softcut.rate(voice, rate)\` - Set playback rate (1.0 = normal)
- \`softcut.position(voice, pos)\` - Set position in seconds
- \`softcut.loop_start(voice, pos)\` - Set loop start
- \`softcut.loop_end(voice, pos)\` - Set loop end
- \`softcut.loop(voice, state)\` - Enable/disable loop
- \`softcut.rec(voice, state)\` - Enable/disable recording
- \`softcut.rec_level(voice, lvl)\` - Set record level
- \`softcut.pre_level(voice, lvl)\` - Set pre-record level (overdub)
- \`softcut.level_input_cut(input, voice, lvl)\` - Route input to voice
- \`softcut.fade_time(voice, time)\` - Set crossfade time
- \`softcut.buffer_read_mono(file, start_src, start_dst, dur, ch_src, ch_dst)\` - Load audio file
- \`softcut.buffer_write_mono(file, start, dur, ch)\` - Save buffer to file
- \`softcut.buffer_clear()\` - Clear all buffers
- \`softcut.buffer_clear_region(start, dur)\` - Clear region
- \`softcut.query_position(voice)\` - Query playback position
- \`softcut.phase_quant(voice, quant)\` - Set phase poll quantum
- \`softcut.event_phase(fn)\` - Set phase callback
- \`softcut.poll_start_phase()\` - Start phase polling
- \`softcut.poll_stop_phase()\` - Stop phase polling
- \`softcut.voice_count()\` - Returns 6 (total voices)

Softcut has 2 buffers, ~350 seconds each, sample rate ~48kHz. 6 voices that can independently read/write.

## Audio
- \`audio.level_dac(level)\` - Set output level (0.0-1.0)
- \`audio.level_adc(level)\` - Set input level
- \`audio.level_monitor(level)\` - Set monitor level
- \`audio.level_eng(level)\` - Set engine level
- \`audio.level_cut(level)\` - Set softcut output level
- \`audio.level_tape(level)\` - Set tape level
- \`audio.level_monitor_mono(level)\` - Mono monitor level
- \`audio.level_eng_cut(level)\` - Engine to softcut level

## Engine
- \`engine.list_commands()\` - List available engine commands
- \`engine.name\` - Current engine name
- \`engine.<command>(...)\` - Call engine command (dynamically available after engine loads)

## Tab (Table Utilities)
- \`tab.print(t)\` - Print table contents
- \`tab.sort(t)\` - Sort table
- \`tab.count(t)\` - Count elements
- \`tab.contains(t, val)\` - Check if value exists
- \`tab.invert(t)\` - Invert key/value
- \`tab.key(t, val)\` - Find key for value
- \`tab.lines(str)\` - Split string into lines

## Util
- \`util.round(val, quant)\` - Round to nearest quantum
- \`util.clamp(val, min, max)\` - Clamp value to range
- \`util.linlin(slo, shi, dlo, dhi, val)\` - Linear map
- \`util.linexp(slo, shi, dlo, dhi, val)\` - Linear to exponential map
- \`util.explin(slo, shi, dlo, dhi, val)\` - Exponential to linear map
- \`util.expexp(slo, shi, dlo, dhi, val)\` - Exponential map
- \`util.degs(radians)\` - Radians to degrees
- \`util.rads(degrees)\` - Degrees to radians
- \`util.wrap(val, min, max)\` - Wrap value in range
- \`util.time_format(seconds)\` - Format seconds to H:M:S
- \`util.s_to_hms(seconds)\` - Seconds to {h,m,s} table

## MusicUtil
- \`musicutil.note_num_to_name(num)\` - MIDI note to name
- \`musicutil.note_name_to_num(name)\` - Name to MIDI note
- \`musicutil.freq_to_note_num(freq)\` - Frequency to MIDI note
- \`musicutil.note_num_to_freq(num)\` - MIDI note to frequency
- \`musicutil.generate_scale(root, scale_type, octaves)\` - Generate scale
- \`musicutil.generate_chord(root, chord_type)\` - Generate chord
- \`musicutil.snap_note_to_array(note, array)\` - Snap to nearest note in array
- \`musicutil.SCALES\` - Table of available scale types
- \`musicutil.CHORDS\` - Table of available chord types

## Lattice (Sequencing Framework)
- \`lattice:new{}\` - Create new lattice
- \`lattice:new_pattern{action, division, enabled}\` - Add pattern (division: 1/4, 1/8, etc.)
- \`lattice:start()\` - Start lattice
- \`lattice:stop()\` - Stop lattice
- \`lattice:hard_restart()\` - Restart from beat 1
- \`lattice:destroy()\` - Clean up lattice
- \`pattern:start()\` / \`pattern:stop()\` - Control individual patterns
- \`pattern:set_division(div)\` - Change division
- \`pattern:set_action(fn)\` - Change callback

## OSC
- \`osc.send(dest, path, args)\` - Send OSC message (dest = {"host", port})
- \`osc.event\` - Incoming OSC callback: function(path, args, from)

## Filesystem
- \`norns.state.data\` - Path to current script's data folder
- \`util.file_exists(path)\` - Check if file exists
- \`util.scandir(path)\` - List directory contents
- \`util.make_dir(path)\` - Create directory

## Grid (monome grid)
- \`grid.connect(port)\` - Connect to grid
- \`g:led(x, y, level)\` - Set LED brightness (0-15)
- \`g:all(level)\` - Set all LEDs
- \`g:refresh()\` - Update grid LEDs
- \`g.key\` - Key callback: function(x, y, z)
- \`g.cols\` / \`g.rows\` - Grid dimensions

## Arc (monome arc)
- \`arc.connect(port)\` - Connect to arc
- \`a:led(ring, led, level)\` - Set LED (ring 1-4, led 1-64, level 0-15)
- \`a:all(level)\` - Set all LEDs
- \`a:segment(ring, from, to, level)\` - Set LED segment
- \`a:refresh()\` - Update arc LEDs
- \`a.delta\` - Encoder callback: function(ring, delta)
`;

export function registerApiDocsResource(server: McpServer) {
  server.registerResource("norns_api_reference", "norns://api", {
    description:
      "Comprehensive norns Lua API reference covering screen, params, clock, softcut, " +
      "MIDI, audio, engine, grid, arc, OSC, utilities, and more.",
    mimeType: "text/markdown",
  }, async (uri) => {
    return {
      contents: [{
        uri: uri.toString(),
        mimeType: "text/markdown",
        text: API_REFERENCE,
      }],
    };
  });
}
