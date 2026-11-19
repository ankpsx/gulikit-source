
from pathlib import Path
from datetime import datetime
import hashlib

BASE = Path(r"D:\02")

FILE_SIZE = 1024 * 1024
FRAME_SIZE = 18
CENTER = 2048
MAX_AXIS = 65535

AXIS_OFFSETS = {
    "LX": 0,
    "LY": 2,
    "RX": 4,
    "RY": 6,
}

# 按键编码
ACTIONS = {
    "A": (0x01, 0x00, 0x00, 0, 0),
    "B": (0x02, 0x00, 0x00, 0, 0),
    "X": (0x04, 0x00, 0x00, 0, 0),
    "Y": (0x08, 0x00, 0x00, 0, 0),
    "LB": (0x10, 0x00, 0x00, 0, 0),
    "RB": (0x20, 0x00, 0x00, 0, 0),
    "LT": (0x40, 0x00, 0x00, 4095, 0),
    "RT": (0x80, 0x00, 0x00, 0, 4095),
    "L3": (0x00, 0x02, 0x00, 0, 0),
    "R3": (0x00, 0x01, 0x00, 0, 0),
    "HOME": (0x00, 0x10, 0x00, 0, 0),
    "SELECT": (0x00, 0x08, 0x00, 0, 0),
    "START": (0x00, 0x04, 0x00, 0, 0),
    "UP": (0x00, 0x00, 0x01, 0, 0),
    "DOWN": (0x00, 0x00, 0x05, 0, 0),
    "LEFT": (0x00, 0x00, 0x07, 0, 0),
    "RIGHT": (0x00, 0x00, 0x03, 0, 0),
    "UP_LEFT": (0x00, 0x00, 0x08, 0, 0),
    "UP_RIGHT": (0x00, 0x00, 0x02, 0, 0),
    "DOWN_LEFT": (0x00, 0x00, 0x06, 0, 0),
    "DOWN_RIGHT": (0x00, 0x00, 0x04, 0, 0),
}

# 官方 APG 摇杆方向编码
# 每个方向对应一个或两个轴
STICK_DIRECTIONS = {
    "L_UP": {
        "LY": 1,
    },
    "L_DOWN": {
        "LY": 4095,
    },
    "L_LEFT": {
        "LX": 1,
    },
    "L_RIGHT": {
        "LX": 4095,
    },
    "L_UP_LEFT": {
        "LX": 1,
        "LY": 1,
    },
    "L_UP_RIGHT": {
        "LX": 4095,
        "LY": 1,
    },
    "L_DOWN_LEFT": {
        "LX": 1,
        "LY": 4095,
    },
    "L_DOWN_RIGHT": {
        "LX": 4095,
        "LY": 4095,
    },

    "R_UP": {
        "RY": 1,
    },
    "R_DOWN": {
        "RY": 4095,
    },
    "R_LEFT": {
        "RX": 1,
    },
    "R_RIGHT": {
        "RX": 4095,
    },
    "R_UP_LEFT": {
        "RX": 1,
        "RY": 1,
    },
    "R_UP_RIGHT": {
        "RX": 4095,
        "RY": 1,
    },
    "R_DOWN_LEFT": {
        "RX": 1,
        "RY": 4095,
    },
    "R_DOWN_RIGHT": {
        "RX": 4095,
        "RY": 4095,
    },
}


def ms_to_frames(ms):
    if ms < 0:
        raise ValueError("时间不能为负数")

    # 按已验证的约79帧/秒换算
    return (ms * 79 + 500) // 1000


def parse_group(group):
    buttons = []
    axes = {}

    for part in group.split("+"):
        if not part:
            raise ValueError(f"动作格式错误：{group}")

        name = part.upper()

        # 摇杆方向
        if name in STICK_DIRECTIONS:
            for axis_name, value in STICK_DIRECTIONS[name].items():
                if axis_name in axes:
                    raise ValueError(
                        f"同一动作重复设置轴 {axis_name}：{group}"
                    )
                axes[axis_name] = value

        # 手动轴值
        elif "=" in part:
            if part.count("=") != 1:
                raise ValueError(f"摇杆格式错误：{part}")

            axis_name, value_text = part.split("=", 1)
            axis_name = axis_name.upper()

            if axis_name not in AXIS_OFFSETS:
                raise ValueError(f"未知摇杆轴：{axis_name}")

            if axis_name in axes:
                raise ValueError(f"重复设置摇杆轴：{axis_name}")

            try:
                value = int(value_text)
            except ValueError:
                raise ValueError(f"{axis_name} 数值必须是整数")

            if not 0 <= value <= MAX_AXIS:
                raise ValueError(
                    f"{axis_name} 数值必须在0～{MAX_AXIS}之间"
                )

            axes[axis_name] = value

        # 普通按键
        elif name in ACTIONS:
            if name in buttons:
                raise ValueError(f"重复按键：{name}")
            buttons.append(name)

        else:
            raise ValueError(f"未知动作：{part}")

    if not buttons and not axes:
        raise ValueError("动作不能为空")

    return buttons, axes


def make_frame(buttons, axes, counter):
    frame = bytearray(FRAME_SIZE)

    # 未指定的摇杆轴全部回中
    for name, offset in AXIS_OFFSETS.items():
        value = axes.get(name, CENTER)
        frame[offset:offset + 2] = value.to_bytes(2, "big")

    b12 = 0
    b13 = 0
    b14 = 0
    lt = 0
    rt = 0

    for name in buttons:
        x12, x13, x14, xlt, xrt = ACTIONS[name]

        b12 |= x12
        b13 |= x13
        b14 |= x14

        lt = max(lt, xlt)
        rt = max(rt, xrt)

    frame[8:10] = lt.to_bytes(2, "big")
    frame[10:12] = rt.to_bytes(2, "big")

    frame[12] = b12
    frame[13] = b13
    frame[14] = b14
    frame[15] = 0x02
    frame[16:18] = (counter & 0xFFFF).to_bytes(2, "big")

    return frame


def describe_action(buttons, axes):
    names = list(buttons)

    for direction, mapping in STICK_DIRECTIONS.items():
        if all(axes.get(k) == v for k, v in mapping.items()):
            # 仅当该方向涉及的轴没有其他额外设置时才匹配
            names.append(direction)

    direction_axes = set()
    for mapping in STICK_DIRECTIONS.values():
        direction_axes.update(mapping.keys())

    remaining = {
        k: v for k, v in axes.items()
        if k not in direction_axes
    }

    for name, value in remaining.items():
        names.append(f"{name}={value}")

    return "+".join(names) if names else "空白延时"


def main():
    print("=" * 65)
    print("GuliKit APG Generator V4.3")
    print("官方摇杆八方向编码版本")
    print("=" * 65)

    print("\n按键：")
    print(" ".join(ACTIONS.keys()))

    print("\n左摇杆方向：")
    print("L_UP L_DOWN L_LEFT L_RIGHT")
    print("L_UP_LEFT L_UP_RIGHT L_DOWN_LEFT L_DOWN_RIGHT")

    print("\n右摇杆方向：")
    print("R_UP R_DOWN R_LEFT R_RIGHT")
    print("R_UP_LEFT R_UP_RIGHT R_DOWN_LEFT R_DOWN_RIGHT")

    print("\n组合示例：")
    print("A+L_UP")
    print("L_UP_LEFT+R_DOWN_RIGHT")
    print("A+B+L_RIGHT+R_UP")

    print("\n手动轴值仍然支持：")
    print("LX=2048 LY=2048 RX=2048 RY=2048")

    raw = input("\n动作序列（不同动作之间用空格分开）：")
    raw = raw.strip().upper()

    if not raw:
        print("没有输入动作。")
        return

    try:
        sequence = []

        for group in raw.split():
            buttons, axes = parse_group(group)
            sequence.append((group, buttons, axes))

        press_ms = int(input("每个动作按下时间（毫秒）："))
        release_ms = int(input("每个动作释放时间（毫秒）："))
        repeat = int(input("整组动作重复次数："))

        if press_ms < 0 or release_ms < 0:
            raise ValueError("时间不能为负数")

        if repeat < 1:
            raise ValueError("重复次数至少为1")

        press_frames = ms_to_frames(press_ms)
        release_frames = ms_to_frames(release_ms)

        if press_frames + release_frames == 0:
            raise ValueError("按下和释放时间不能同时为0")

    except ValueError as error:
        print(f"\n输入错误：{error}")
        return

    total_frames = (
        len(sequence)
        * repeat
        * (press_frames + release_frames)
    )

    valid_size = total_frames * FRAME_SIZE

    if valid_size > FILE_SIZE:
        print("错误：生成数据超过1MiB。")
        return

    frames = bytearray()
    report = []

    counter = 11
    frame_index = 0

    for repeat_index in range(repeat):
        for label, buttons, axes in sequence:

            phases = [
                (True, press_frames),
                (False, release_frames),
            ]

            for pressed, count in phases:
                current_buttons = buttons if pressed else []
                current_axes = axes if pressed else {}

                for _ in range(count):
                    frame = make_frame(
                        current_buttons,
                        current_axes,
                        counter
                    )

                    frames.extend(frame)

                    phase = "按下" if pressed else "释放"
                    action_text = describe_action(
                        buttons,
                        axes
                    )

                    axis_values = " ".join(
                        f"{name}=0x{value:04X}({value})"
                        for name, value in sorted(axes.items())
                    )

                    if not axis_values:
                        axis_values = "所有摇杆回中"

                    report.append(
                        f"帧{frame_index:05d} | "
                        f"动作={label} | "
                        f"{action_text} | "
                        f"{phase} | "
                        f"{axis_values} | "
                        f"{frame.hex(' ').upper()}"
                    )

                    counter = (counter + 14) & 0xFFFF
                    frame_index += 1

    generated = bytes(frames) + b"\xFF" * (
        FILE_SIZE - len(frames)
    )

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    apg_file = BASE / f"GuliKit_V4_3_{timestamp}.apg"
    txt_file = BASE / f"GuliKit_V4_3_{timestamp}_Report.txt"

    apg_file.write_bytes(generated)

    header = [
        "GuliKit APG Generator V4.3",
        "官方摇杆八方向编码版本",
        "=" * 70,
        f"生成时间：{datetime.now()}",
        f"动作序列：{' -> '.join(x[0] for x in sequence)}",
        f"动作组数量：{len(sequence)}",
        f"重复次数：{repeat}",
        f"按下时间：{press_ms}ms，对应{press_frames}帧",
        f"释放时间：{release_ms}ms，对应{release_frames}帧",
        f"有效帧数：{frame_index}",
        f"有效数据：{len(frames)} bytes",
        f"FF填充：{FILE_SIZE - len(frames)} bytes",
        f"文件大小：{len(generated)} bytes",
        f"SHA256：{hashlib.sha256(generated).hexdigest()}",
        "",
        "[官方摇杆编码]",
        "中心值：0x0800（2048）",
        "负方向极值：0x0001（1）",
        "正方向极值：0x0FFF（4095）",
        "LX：字节0-1",
        "LY：字节2-3",
        "RX：字节4-5",
        "RY：字节6-7",
        "",
        "[方向指令]",
    ]

    for name, mapping in STICK_DIRECTIONS.items():
        values = " ".join(
            f"{axis}=0x{value:04X}"
            for axis, value in mapping.items()
        )
        header.append(f"{name}: {values}")

    header.extend([
        "",
        "[逐帧数据]",
    ])

    txt_file.write_text(
        "\n".join(header + report),
        encoding="utf-8-sig"
    )

    print("\n" + "=" * 65)
    print("GuliKit APG Generator V4.3 生成成功")
    print("=" * 65)
    print(f"动作组数量：{len(sequence)}")
    print(f"重复次数：{repeat}")
    print(f"有效帧数：{frame_index}")
    print(f"有效数据：{len(frames):,} bytes")
    print(f"FF填充：{FILE_SIZE - len(frames):,} bytes")
    print(f"APG文件：{apg_file}")
    print(f"TXT报告：{txt_file}")
    print(f"SHA256：{hashlib.sha256(generated).hexdigest()}")
    print("=" * 65)


if __name__ == "__main__":
    main()
