# AirWick nRF52840 v0.27

This directory contains the exact firmware package used by the Zigbee2MQTT device-support contribution.

Files:

- `AirWick_nRF52840_v0.27.uf2` — prebuilt firmware
- `AirWick-nRF52840-v0.27-SOURCE.tar.gz` — exact source archive
- `AirWick_nRF52840_v0.27.sha256` — checksum
- `build-verification-v0.27.json` — structural build verification
- `airwick_nrf52840_v0.27.mjs` — matching external converter

UF2 SHA-256:

`a289bffd6409b5af8af976175b58ab323f63b151377a8d6c4c046ab69b8993a6`

Build environment:

- nRF Connect SDK v3.4.0
- Zephyr 4.4.0
- target `promicro_nrf52840/nrf52840/uf2`

See [../../docs/REPRODUCE_V0.27.md](../../docs/REPRODUCE_V0.27.md) for hardware, build and flashing instructions.
