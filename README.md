# AirWick nRF52840

Public reproduction package for the DIY AirWick aerosol-dispenser Zigbee conversion used by the Zigbee2MQTT contribution.

The enclosure and spray mechanism are commercial. The nRF52840 electronics, firmware, Zigbee custom cluster, scheduling logic and integration are custom.

## Reproduce the device

See [docs/REPRODUCE_V0.27.md](docs/REPRODUCE_V0.27.md).

Wiring diagram: [docs/AirWick_nRF52840_wiring.svg](docs/AirWick_nRF52840_wiring.svg).

## Firmware v0.27

The exact firmware package used by the submitted Zigbee2MQTT converter is in [firmware/v0.27](firmware/v0.27):

- `AirWick_nRF52840_v0.27.uf2` — prebuilt firmware
- `AirWick-nRF52840-v0.27-SOURCE.tar.gz` — exact source archive
- `AirWick_nRF52840_v0.27.sha256` — checksum
- `build-verification-v0.27.json` — build verification
- `airwick_nrf52840_v0.27.mjs` — matching external converter

UF2 SHA-256:

`a289bffd6409b5af8af976175b58ab323f63b151377a8d6c4c046ab69b8993a6`

## Zigbee identity

- Model ID: `AirWick_nRF52840`
- Manufacturer: `DIY`
- Endpoint: `10`
- Custom cluster: `0xFC00`
