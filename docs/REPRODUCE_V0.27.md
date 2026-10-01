# Reproducing AirWick_nRF52840 v0.27

This project converts an off-the-shelf automatic aerosol dispenser into a Zigbee sleepy end device using an nRF52840 ProMicro/nice!nano-compatible board.

## Current firmware

The exact v0.27 firmware package used with the Zigbee2MQTT converter is published as a GitHub pre-release:

- Release: https://github.com/OstrokolovNikita/airwick-nrf52840/releases/tag/v0.27-testing
- Prebuilt UF2: `AirWick_nRF52840_v0.27.uf2`
- Full source archive: `AirWick-nRF52840-v0.27-SOURCE.tar.gz`
- SHA-256 files and build-verification JSON are included in the release.

The v0.27 source/development branch is:

- https://github.com/OstrokolovNikita/airwick-nrf52840/tree/v0.27-duration

v0.27 keeps the same hardware wiring as the previous tested revisions; its functional change is the persistent configurable spray pulse duration (300–1000 ms).

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

Full hardware notes and the wiring diagram:

- Hardware: https://github.com/OstrokolovNikita/airwick-nrf52840/blob/v0.27-duration/docs/HARDWARE.md
- Wiring SVG: https://github.com/OstrokolovNikita/airwick-nrf52840/blob/v0.27-duration/docs/AirWick_nRF52840_wiring.svg

## Build

The verified build environment is:

- nRF Connect SDK v3.4.0
- Zephyr 4.4.0
- board target: `promicro_nrf52840/nrf52840/uf2`

Typical build command:

```bash
west build -b promicro_nrf52840/nrf52840/uf2 . -d build -p always --no-sysbuild
```

The resulting image is:

```text
build/zephyr/zephyr.uf2
```

The v0.27 release also contains the exact source archive and the build-verification output used for the published UF2.

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

The current external converter matching v0.27 is also published in the repository and in the v0.27 release.

## Notes

This is a DIY conversion of a commercial dispenser enclosure and spray mechanism. The electronics, firmware, Zigbee cluster, scheduling logic and integration are custom.
