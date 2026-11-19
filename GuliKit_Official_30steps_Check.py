
from pathlib import Path
import struct

SOURCE = Path(r"D:\02\Official_30steps.apg")
REPORT = Path(r"D:\02\Official_30steps_Check_Report.txt")

FILE_SIZE = 1024 * 1024
FRAME_SIZE = 18
FPS = 79

# NON_PC button mapping
BUTTONS = {
    "A": 0x01, "B": 0x02, "X": 0x04, "Y": 0x08,
    "LB": 0x10, "RB": 0x20, "LT": 0x40, "RT": 0x80
}
FUNCTIONS = {
    "R3": 0x01, "L3": 0x02, "START": 0x04,
    "SELECT": 0x08, "HOME": 0x10
}
DPAD = {
    "": 0, "UP": 1, "DOWN": 2, "LEFT": 3, "RIGHT": 4,
    "UP+LEFT": 5, "UP+RIGHT": 6,
    "DOWN+LEFT": 7, "DOWN+RIGHT": 8
}

def blank():
    return {
        "buttons": set(), "functions": set(), "dpad": "",
        "left": set(), "right": set()
    }

def action(buttons=(), functions=(), dpad="", left=(), right=()):
    return {
        "buttons": set(buttons),
        "functions": set(functions),
        "dpad": dpad,
        "left": set(left),
        "right": set(right)
    }

# The 30 actions entered in the official editor.
steps = [
    ("01 A", 100, action(buttons=["A"])),
    ("02 Blank", 100, blank()),
    ("03 B", 200, action(buttons=["B"])),
    ("04 Blank", 200, blank()),
    ("05 ABXY", 500, action(buttons=["A","B","X","Y"])),
    ("06 LB RB LT RT", 500, action(buttons=["LB","RB","LT","RT"])),
    ("07 L3 R3 HOME SELECT START", 500,
     action(functions=["L3","R3","HOME","SELECT","START"])),
    ("08 All buttons", 500,
     action(buttons=["A","B","X","Y","LB","RB","LT","RT"],
            functions=["L3","R3","HOME","SELECT","START"])),
    ("09 Blank", 500, blank()),
    ("10 Dpad UP", 300, action(dpad="UP")),
    ("11 Dpad DOWN", 300, action(dpad="DOWN")),
    ("12 Dpad LEFT", 300, action(dpad="LEFT")),
    ("13 Dpad RIGHT", 300, action(dpad="RIGHT")),
    ("14 Dpad UP LEFT", 300, action(dpad="UP+LEFT")),
    ("15 Dpad UP RIGHT", 300, action(dpad="UP+RIGHT")),
    ("16 Dpad DOWN LEFT", 300, action(dpad="DOWN+LEFT")),
    ("17 Dpad DOWN RIGHT", 300, action(dpad="DOWN+RIGHT")),
    ("18 Blank", 300, blank()),
    ("19 Left stick LEFT", 300, action(left=["LEFT"])),
    ("20 Left stick LEFT UP", 300, action(left=["LEFT","UP"])),
    ("21 Right stick RIGHT", 300, action(right=["RIGHT"])),
    ("22 Right stick RIGHT DOWN", 300, action(right=["RIGHT","DOWN"])),
    ("23 Left LEFT + Right RIGHT", 500,
     action(left=["LEFT"], right=["RIGHT"])),
    ("24 L3 + Left LEFT UP", 500,
     action(functions=["L3"], left=["LEFT","UP"])),
    ("25 R3 + Right RIGHT DOWN", 500,
     action(functions=["R3"], right=["RIGHT","DOWN"])),
    ("26 Blank", 1000, blank()),
    ("27 A + Dpad UP LEFT + Right RIGHT", 1000,
     action(buttons=["A"], dpad="UP+LEFT", right=["RIGHT"])),
    ("28 B + Dpad DOWN RIGHT + Left LEFT", 1000,
     action(buttons=["B"], dpad="DOWN+RIGHT", left=["LEFT"])),
    ("29 Left RIGHT + Right UP", 500,
     action(left=["RIGHT"], right=["UP"])),
    ("30 Blank", 2000, blank()),
]

def axis_value(directions, axis):
    value = 2048
    if axis == "x":
        if "LEFT" in directions:
            value = 1
        if "RIGHT" in directions:
            value = 4095
    else:
        if "UP" in directions:
            value = 1
        if "DOWN" in directions:
            value = 4095
    return value

def encode(state):
    b = bytearray(18)

    for name in state["buttons"]:
        b[12] |= BUTTONS[name]

    for name in state["functions"]:
        b[13] |= FUNCTIONS[name]

    b[8:10] = (4095 if "LT" in state["buttons"] else 0).to_bytes(2, "big")
    b[10:12] = (4095 if "RT" in state["buttons"] else 0).to_bytes(2, "big")

    values = [
        axis_value(state["left"], "x"),
        axis_value(state["left"], "y"),
        axis_value(state["right"], "x"),
        axis_value(state["right"], "y")
    ]

    for i, value in enumerate(values):
        b[i*2:i*2+2] = value.to_bytes(2, "big")

    b[14] = DPAD[state["dpad"]]
    b[15] = 0x02
    return bytes(b)

def counter_at(index):
    value = 11
    for _ in range(index):
        value += 14
        if value > 65535:
            value = 11
    return value

def main():
    if not SOURCE.exists():
        print("ERROR: APG file not found:", SOURCE)
        return

    data = SOURCE.read_bytes()
    lines = []
    errors = []

    lines.append("GuliKit Official 30 Actions APG Check")
    lines.append("=" * 60)
    lines.append(f"File: {SOURCE}")
    lines.append(f"File size: {len(data):,} bytes")
    lines.append("Expected size: 1,048,576 bytes")

    if len(data) != FILE_SIZE:
        errors.append("File size is not 1 MiB.")

    expected_frames = []
    action_ranges = []
    frame_cursor = 0

    for name, ms, state in steps:
        count = round(ms * FPS / 1000)
        frame = encode(state)
        start = frame_cursor
        for _ in range(count):
            expected_frames.append(frame)
        frame_cursor += count
        action_ranges.append((name, ms, start, frame_cursor - 1, count))

    # Final release frame
    expected_frames.append(encode(blank()))

    actual_frames = []
    for offset in range(0, len(data), FRAME_SIZE):
        chunk = data[offset:offset + FRAME_SIZE]
        if len(chunk) < FRAME_SIZE:
            break
        if chunk == b"\xFF" * FRAME_SIZE:
            break
        actual_frames.append(chunk)

    lines.append(f"Expected active frames: {len(expected_frames)}")
    lines.append(f"Actual active frames:   {len(actual_frames)}")
    lines.append(f"Expected data bytes:    {len(expected_frames)*18:,}")
    lines.append("")

    if len(actual_frames) != len(expected_frames):
        errors.append(
            f"Frame count mismatch: expected {len(expected_frames)}, "
            f"actual {len(actual_frames)}"
        )

    compare_count = min(len(actual_frames), len(expected_frames))
    different_frames = 0
    different_bytes = 0
    first_differences = []

    for i in range(compare_count):
        actual = actual_frames[i]
        expected = expected_frames[i]

        # Counter bytes are checked separately.
        byte_diffs = [
            j for j in range(18)
            if j not in (16, 17) and actual[j] != expected[j]
        ]

        expected_counter = counter_at(i)
        actual_counter = int.from_bytes(actual[16:18], "big")

        if actual[15] != 0x02:
            errors.append(f"Frame {i}: Byte15 is not 02")

        if actual_counter != expected_counter:
            errors.append(
                f"Frame {i}: counter {actual_counter}, "
                f"expected {expected_counter}"
            )

        if byte_diffs:
            different_frames += 1
            different_bytes += len(byte_diffs)
            if len(first_differences) < 30:
                first_differences.append(
                    f"Frame {i}: byte positions {byte_diffs}; "
                    f"actual={actual.hex(' ').upper()}; "
                    f"expected={expected.hex(' ').upper()}"
                )

    lines.append("30 ACTION FRAME RANGES")
    lines.append("-" * 60)
    for name, ms, start, end, count in action_ranges:
        lines.append(
            f"{name}: {ms} ms, {count} frames, "
            f"frame {start}-{end}"
        )

    lines.append("")
    lines.append("BYTE COMPARISON")
    lines.append("-" * 60)
    lines.append(f"Compared frames: {compare_count}")
    lines.append(f"Different frames: {different_frames}")
    lines.append(f"Different data bytes: {different_bytes}")

    if first_differences:
        lines.append("")
        lines.append("First differences:")
        lines.extend(first_differences)

    # Check FF padding after active frames.
    padding_start = len(expected_frames) * FRAME_SIZE
    padding = data[padding_start:]
    bad_padding = sum(value != 0xFF for value in padding)

    lines.append("")
    lines.append("FF PADDING")
    lines.append("-" * 60)
    lines.append(f"Padding starts at byte: {padding_start}")
    lines.append(f"Padding bytes: {len(padding):,}")
    lines.append(f"Non-FF padding bytes: {bad_padding}")

    if bad_padding:
        errors.append(f"Found {bad_padding} non-FF padding bytes.")

    lines.append("")
    lines.append("RESULT")
    lines.append("-" * 60)

    if not errors and different_frames == 0 and different_bytes == 0:
        lines.append("PASS")
    else:
        lines.append("CHECK REQUIRED")
        lines.append("")
        lines.append("Issues:")
        lines.extend(errors)

    REPORT.write_text("\n".join(lines), encoding="utf-8")

    print("Check completed.")
    print("Expected frames:", len(expected_frames))
    print("Actual frames:", len(actual_frames))
    print("Different frames:", different_frames)
    print("Different bytes:", different_bytes)
    print("Non-FF padding bytes:", bad_padding)
    print("Report:", REPORT)

    if errors or different_frames or different_bytes:
        print("Status: CHECK REQUIRED")
    else:
        print("Status: PASS")

if __name__ == "__main__":
    main()
