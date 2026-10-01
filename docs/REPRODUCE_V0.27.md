# Reproducing AirWick_nRF52840 v0.27

This project converts an off-the-shelf automatic aerosol dispenser into a Zigbee sleepy end device using an nRF52840 ProMicro/nice!nano-compatible board.

The enclosure and spray mechanism are commercial. The electronics, firmware, Zigbee cluster, scheduling logic and integration are custom.

## Files

The exact v0.27 package used with the Zigbee2MQTT contribution is published in this repository:

- [Prebuilt UF2](../firmware/v0.27/AirWick_nRF52840_v0.27.uf2)
- [Exact source archive](../firmware/v0.27/AirWick-nRF52840-v0.27-SOURCE.tar.gz)
- [SHA-256](../firmware/v0.27/AirWick_nRF52840_v0.27.sha256)
- [Build verification](../firmware/v0.27/build-verification-v0.27.json)
- [Matching external converter](../firmware/v0.27/airwick_nrf52840_v0.27.mjs)
- [Wiring diagram](AirWick_nRF52840_wiring.svg)

UF2 SHA-256:

`a289bffd6409b5af8af976175b58ab323f63b151377a8d6c4c046ab69b8993a6`

## Hardware

Main parts:

- nRF52840 ProMicro/nice!nano-compatible board with UF2 bootloader
- original dispenser motor/mechanism
- 1S Li-ion battery
- AO3400/A09T N-MOSFET
- ~100 ohm MOSFET gate resistor
- flyback diode across the motor
- 2 x 1 Mohm battery divider + 100 nF ADC capacitor
- original spray button
- original 4-position mode selector
- selector resistor ladder: approximately 22 kohm, 100 kohm and 330 kohm, plus 100 kohm pulldown

Board labels used by the firmware:

- `017` — MOSFET gate / motor control
- `002` — local spray button to GND
- `029` — battery-voltage ADC
- `020` — selector ladder power
- `031` — selector ADC
- `B+`, `B-`, `GND` — battery/common connections

Motor low-side switching:

```text
017 ---- ~100R ---- Gate AO3400
GND ---------------- Source AO3400
Motor(-) ------------ Drain AO3400
Motor(+) ------------ motor supply
```

The flyback diode is connected across the motor with the cathode/stripe to `Motor(+)` and the anode to `Motor(-)` / MOSFET drain.

See the [wiring diagram](AirWick_nRF52840_wiring.svg) for the complete connection layout.

## Build

Verified build environment:

- nRF Connect SDK v3.4.0
- Zephyr 4.4.0
- board target: `promicro_nrf52840/nrf52840/uf2`
- Zigbee role: End Device

Extract `AirWick-nRF52840-v0.27-SOURCE.tar.gz`, enter the application directory and build with:

```bash
west build -b promicro_nrf52840/nrf52840/uf2 . -d build -p always --no-sysbuild
```

The resulting firmware image is:

```text
build/zephyr/zephyr.uf2
```

## Flashing

For a ProMicro/nice!nano-compatible UF2 bootloader:

1. Connect the board over USB.
2. Enter the UF2 bootloader (commonly by double-reset; exact behavior depends on the bootloader).
3. Wait for the USB mass-storage volume.
4. Copy `AirWick_nRF52840_v0.27.uf2` to that volume.
5. The board reboots into the application.

Do not erase Zigbee/NVS state unless a full factory reset is actually required.

## Zigbee identity

- Model ID: `AirWick_nRF52840`
- Manufacturer: `DIY`
- Endpoint: `10`
- Custom cluster: `0xFC00`

v0.27 adds a persistent configurable spray pulse duration of 300–1000 ms while keeping the same device identity and wiring.
