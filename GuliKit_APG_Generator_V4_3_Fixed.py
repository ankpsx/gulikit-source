from pathlib import Path
from datetime import datetime
import hashlib
import json
import math

BASE = Path(r"D:\02")
FILE_SIZE = 1024 * 1024
FRAME_SIZE = 18
FPS = 79
CENTER = 2048
MIN_AXIS = 1
MAX_AXIS = 4095

AXIS_OFFSETS = {
    "LX": 0,
    "LY": 2,
    "RX": 4,
    "RY": 6,
}

BUTTONS = {
    "A": (0x01, 0x02),
    "B": (0x02, 0x01),
    "X": (0x04, 0x08),
    "Y": (0x08, 0x04),
    "LB": (0x10, 0x10),
    "RB": (0x20, 0x20),
    "LT": (0x40, 0x40),
    "RT": (0x80, 0x80),
}

FUNCTION_BUTTONS = {
    "R3": 0x01,
    "L3": 0x02,
    "START": 0x04,
    "SELECT": 0x08,
    "HOME": 0x10,
}

DPAD = {
    frozenset(): 0,
    frozenset({"UP"}): 1,
    frozenset({"DOWN"}): 2,
    frozenset({"LEFT"}): 3,
    frozenset({"RIGHT"}): 4,
    frozenset({"UP", "LEFT"}): 5,
    frozenset({"UP", "RIGHT"}): 6,
    frozenset({"DOWN", "LEFT"}): 7,
    frozenset({"DOWN", "RIGHT"}): 8,
}

STICK_DIRECTIONS = {
    "L_UP": {"LY": 1},
    "L_DOWN": {"LY": 4095},
    "L_LEFT": {"LX": 1},
    "L_RIGHT": {"LX": 4095},
    "L_UP_LEFT": {"LX": 1, "LY": 1},
    "L_UP_RIGHT": {"LX": 4095, "LY": 1},
    "L_DOWN_LEFT": {"LX": 1, "LY": 4095},
    "L_DOWN_RIGHT": {"LX": 4095, "LY": 4095},
    "R_UP": {"RY": 1},
    "R_DOWN": {"RY": 4095},
    "R_LEFT": {"RX": 1},
    "R_RIGHT": {"RX": 4095},
    "R_UP_LEFT": {"RX": 1, "RY": 1},
    "R_UP_RIGHT": {"RX": 4095, "RY": 1},
    "R_DOWN_LEFT": {"RX": 1, "RY": 4095},
    "R_DOWN_RIGHT": {"RX": 4095, "RY": 4095},
}


def ms_to_frames(ms):
    if not isinstance(ms, int) or isinstance(ms, bool) or ms < 0:
        raise ValueError("持续时间必须是非负整数毫秒")
    return math.floor(ms * FPS / 1000 + 0.5)


def next_counter(counter):
    value = counter + 14
    return 11 if value > 65535 else value


def axis_amount(value):
    if value is None or value is False or value == 0 or value == "":
        value = 100
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise ValueError("摇杆百分比必须是数字")
    if not 0 <= value <= 100:
        raise ValueError("摇杆百分比必须在0到100之间")
    return math.floor(value / 100 * 2047)


def parse_action(source):
    parts = source.strip().upper().split("+")
    if not parts or any(not p for p in parts):
        raise ValueError(f"动作格式错误：{source}")

    buttons = set()
    dpad = set()
    axes = {}

    for part in parts:
        if part in BUTTONS or part in FUNCTION_BUTTONS:
            if part in buttons:
                raise ValueError(f"重复按键：{part}")
            buttons.add(part)

        elif part in {"UP", "DOWN", "LEFT", "RIGHT"}:
            if part in dpad:
                raise ValueError(f"重复方向键：{part}")
            dpad.add(part)

        elif part in STICK_DIRECTIONS:
            for axis, value in STICK_DIRECTIONS[part].items():
                if axis in axes:
                    raise ValueError(f"重复设置摇杆轴：{axis}")
                axes[axis] = value

        elif "=" in part:
            if part.count("=") != 1:
                raise ValueError(f"摇杆格式错误：{part}")
            axis, value_text = part.split("=", 1)
            if axis not in AXIS_OFFSETS:
                raise ValueError(f"未知摇杆轴：{axis}")
            if axis in axes:
                raise ValueError(f"重复设置摇杆轴：{axis}")
            try:
                value = int(value_text)
            except ValueError:
                raise ValueError(f"{axis}必须是整数")
            if not 0 <= value <= 65535:
                raise ValueError(f"{axis}必须在0到65535之间")
            axes[axis] = value

        else:
            raise ValueError(f"未知动作：{part}")

    # 只允许：单方向、相邻斜向；禁止相反方向和三个以上方向。
    if len(dpad) > 2:
        raise ValueError("方向键最多只能同时按两个相邻方向")

    if dpad in ({"UP", "DOWN"}, {"LEFT", "RIGHT"}):
        raise ValueError("相反方向不能同时按下")

    if not buttons and not dpad and not axes:
        raise ValueError("动作不能为空")

    return {
        "buttons": buttons,
        "dpad": dpad,
        "axes": axes,
    }


def parse_sequence(raw):
    """
    输入格式：
    A+B,300 B,300 B+X,200 X,300

    每个动作使用 空格 分隔。
    每段格式为 动作,持续毫秒。
    """
    sequence = []

    for item in raw.split():
        if "," not in item:
            raise ValueError(
                f"动作缺少持续时间：{item}。格式示例：A+B,300"
            )

        action_text, duration_text = item.rsplit(",", 1)

        try:
            duration = int(duration_text)
        except ValueError:
            raise ValueError(f"持续时间不是整数：{duration_text}")

        frames = ms_to_frames(duration)
        state = parse_action(action_text)

        sequence.append({
            "label": action_text.upper(),
            "duration_ms": duration,
            "frames": frames,
            **state,
        })

    if not sequence:
        raise ValueError("动作序列不能为空")

    return sequence


def make_frame(state, layout, counter):
    frame = bytearray(FRAME_SIZE)

    axes = state["axes"]
    for name, offset in AXIS_OFFSETS.items():
        value = axes.get(name, CENTER)
        frame[offset:offset + 2] = value.to_bytes(2, "big")

    b12 = 0
    b13 = 0
    lt = 0
    rt = 0

    layout_index = 0 if layout == "NON_PC" else 1

    for name in state["buttons"]:
        if name in BUTTONS:
            b12 |= BUTTONS[name][layout_index]
            if name == "LT":
                lt = 4095
            elif name == "RT":
                rt = 4095
        else:
            b13 |= FUNCTION_BUTTONS[name]

    dpad_code = DPAD[frozenset(state["dpad"])]

    frame[8:10] = lt.to_bytes(2, "big")
    frame[10:12] = rt.to_bytes(2, "big")
    frame[12] = b12
    frame[13] = b13
    frame[14] = dpad_code
    frame[15] = 0x02
    frame[16:18] = counter.to_bytes(2, "big")

    return frame


def state_description(state):
    names = sorted(state["buttons"])
    names.extend(sorted(state["dpad"]))

    for axis, value in sorted(state["axes"].items()):
        names.append(f"{axis}={value}")

    return "+".join(names) if names else "空白延时"


def validate_sequence(sequence):
    total = sum(item["frames"] for item in sequence)
    if total * FRAME_SIZE > FILE_SIZE:
        raise ValueError("动作总帧数超过1MiB文件容量")
    if total == 0:
        raise ValueError("所有动作持续时间均为0，无法生成有效帧")
    return total


def run_tests():
    tests = 0

    def check(condition, message):
        nonlocal tests
        tests += 1
        if not condition:
            raise AssertionError(message)

    check(ms_to_frames(1000) == 79, "FPS")
    check(ms_to_frames(500) == 40, "四舍五入")
    check(next_counter(11) == 25, "计数器递增")
    check(next_counter(65530) == 11, "计数器溢出")
    check(axis_amount(0) == 2047, "零值回退100")
    check(axis_amount(50) == 1023, "百分比取整")
    check(axis_amount(100) == 2047, "百分比满值")

    check(DPAD[frozenset({"UP", "LEFT"})] == 5, "左上方向")
    check(DPAD[frozenset({"UP", "RIGHT"})] == 6, "右上方向")
    check(DPAD[frozenset({"DOWN", "LEFT"})] == 7, "左下方向")
    check(DPAD[frozenset({"DOWN", "RIGHT"})] == 8, "右下方向")

    # D-pad parser regression tests: four singles and four adjacent diagonals.
    check(parse_action("UP")["dpad"] == {"UP"}, "解析上方向")
    check(parse_action("DOWN")["dpad"] == {"DOWN"}, "解析下方向")
    check(parse_action("LEFT")["dpad"] == {"LEFT"}, "解析左方向")
    check(parse_action("RIGHT")["dpad"] == {"RIGHT"}, "解析右方向")
    check(parse_action("UP+LEFT")["dpad"] == {"UP", "LEFT"}, "解析左上")
    check(parse_action("UP+RIGHT")["dpad"] == {"UP", "RIGHT"}, "解析右上")
    check(parse_action("DOWN+LEFT")["dpad"] == {"DOWN", "LEFT"}, "解析左下")
    check(parse_action("DOWN+RIGHT")["dpad"] == {"DOWN", "RIGHT"}, "解析右下")

    for invalid_dpad in ("UP+DOWN", "LEFT+RIGHT", "UP+DOWN+LEFT"):
        try:
            parse_action(invalid_dpad)
        except ValueError:
            check(True, f"拒绝非法方向组合 {invalid_dpad}")
        else:
            check(False, f"错误地接受非法方向组合 {invalid_dpad}")

    non_pc = make_frame(
        {"buttons": {"A"}, "dpad": set(), "axes": {}},
        "NON_PC", 11
    )
    pc = make_frame(
        {"buttons": {"A"}, "dpad": set(), "axes": {}},
        "PC", 11
    )
    check(non_pc[12] == 0x01, "Non-PC A")
    check(pc[12] == 0x02, "PC A")

    check(non_pc[0:2] == b"\x08\x00", "LX中心")
    check(non_pc[2:4] == b"\x08\x00", "LY中心")
    check(non_pc[15] == 2, "固定字节")
    check(non_pc[16:18] == b"\x00\x0b", "计数器大端")

    lt = make_frame(
        {"buttons": {"LT"}, "dpad": set(), "axes": {}},
        "NON_PC", 11
    )
    check(lt[8:10] == b"\x0f\xff", "LT模拟值")

    rt = make_frame(
        {"buttons": {"RT"}, "dpad": set(), "axes": {}},
        "NON_PC", 11
    )
    check(rt[10:12] == b"\x0f\xff", "RT模拟值")

    return tests


def main():
    print("=" * 65)
    print("GuliKit APG Generator V4.3 Fixed")
    print("=" * 65)

    print("\n先运行内置规则测试...")
    test_count = run_tests()
    print(f"内置测试：{test_count} 项全部通过")

    print("\nABXY布局：")
    print("1 = NON_PC")
    print("2 = PC")

    layout_input = input("请选择布局（1/2）：").strip()
    if layout_input not in {"1", "2"}:
        print("布局输入错误。")
        return

    layout = "NON_PC" if layout_input == "1" else "PC"

    print("\n输入动作序列，动作之间用空格分隔。")
    print("示例：A+B,300 B,300 B+X,200 X,300")
    print("实体方向组合示例：UP+LEFT,500")
    print("摇杆方向示例：L_UP_LEFT,500")
    print("手动轴值示例：LX=1000+LY=2000,500")

    raw = input("\n动作序列：").strip()

    try:
        sequence = parse_sequence(raw)
        repeat = int(input("整组动作重复次数："))
        if repeat < 1:
            raise ValueError("重复次数至少为1")

        total_frames = validate_sequence(sequence) * repeat
        if total_frames * FRAME_SIZE > FILE_SIZE:
            raise ValueError("重复后总数据超过1MiB")

    except ValueError as error:
        print(f"\n输入错误：{error}")
        return

    frames = bytearray()
    report = []

    counter = 11
    frame_index = 0

    previous = {
        "buttons": set(),
        "dpad": set(),
        "axes": {},
    }

    for repeat_index in range(repeat):
        for item in sequence:
            current = {
                "buttons": set(item["buttons"]),
                "dpad": set(item["dpad"]),
                "axes": dict(item["axes"]),
            }

            # 当前动作是完整状态：未指定的按键释放，未指定的轴回中。
            for _ in range(item["frames"]):
                frame = make_frame(current, layout, counter)
                frames.extend(frame)

                report.append(
                    f"帧{frame_index:05d} | "
                    f"重复={repeat_index + 1} | "
                    f"动作={item['label']} | "
                    f"持续={item['duration_ms']}ms | "
                    f"状态={state_description(current)} | "
                    f"{frame.hex(' ').upper()}"
                )

                counter = next_counter(counter)
                frame_index += 1

            previous = current

    # 动作结束后补一帧完全释放状态。
    release_state = {
        "buttons": set(),
        "dpad": set(),
        "axes": {},
    }

    release_frame = make_frame(release_state, layout, counter)
    frames.extend(release_frame)
    report.append(
        f"帧{frame_index:05d} | 最终释放 | "
        f"所有按键释放、摇杆回中 | "
        f"{release_frame.hex(' ').upper()}"
    )
    frame_index += 1

    if len(frames) > FILE_SIZE:
        print("错误：最终释放帧导致文件超过1MiB。")
        return

    generated = bytes(frames) + b"\xFF" * (FILE_SIZE - len(frames))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    apg_file = BASE / f"GuliKit_APG_V4_3_Fixed_{timestamp}.apg"
    txt_file = BASE / f"GuliKit_APG_V4_3_Fixed_{timestamp}_Report.txt"

    apg_file.write_bytes(generated)

    header = [
        "GuliKit APG Generator V4.3 Fixed",
        "=" * 65,
        f"生成时间：{datetime.now()}",
        f"ABXY布局：{layout}",
        f"动作组数量：{len(sequence)}",
        f"重复次数：{repeat}",
        f"有效帧数（含最终释放）：{frame_index}",
        f"有效数据：{len(frames)} bytes",
        f"FF填充：{FILE_SIZE - len(frames)} bytes",
        f"文件大小：{len(generated)} bytes",
        f"SHA256：{hashlib.sha256(generated).hexdigest()}",
        "",
        "[动作列表]",
    ]

    for index, item in enumerate(sequence, 1):
        header.append(
            f"{index}. {item['label']} | "
            f"{item['duration_ms']}ms | "
            f"{item['frames']}帧"
        )

    header.extend(["", "[逐帧数据]"])

    txt_file.write_text(
        "\n".join(header + report),
        encoding="utf-8-sig"
    )

    print("\n" + "=" * 65)
    print("生成完成")
    print("=" * 65)
    print(f"布局：{layout}")
    print(f"动作组：{len(sequence)}")
    print(f"重复次数：{repeat}")
    print(f"有效帧：{frame_index}")
    print(f"APG：{apg_file}")
    print(f"报告：{txt_file}")
    print(f"SHA256：{hashlib.sha256(generated).hexdigest()}")
    print("=" * 65)


if __name__ == "__main__":
    main()