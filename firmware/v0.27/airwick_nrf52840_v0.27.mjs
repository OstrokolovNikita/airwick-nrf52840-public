import {Zcl} from 'zigbee-herdsman';
import * as exposes from 'zigbee-herdsman-converters/lib/exposes';
import * as m from 'zigbee-herdsman-converters/lib/modernExtend';

const e = exposes.presets;
const ea = exposes.access;
const CLUSTER = 'airwickCtrl';
const ENDPOINT = 10;
const ZIGBEE_EPOCH_UNIX = 946684800;
const SCHEDULE_INFO = 'Пн–Пт 07:00–22:00; Сб–Вс 09:00–22:00; каждые 30 мин; длительность задаётся отдельно';

const DAYS = [
    {key: 'mon', label: 'Понедельник'},
    {key: 'tue', label: 'Вторник'},
    {key: 'wed', label: 'Среда'},
    {key: 'thu', label: 'Четверг'},
    {key: 'fri', label: 'Пятница'},
    {key: 'sat', label: 'Суббота'},
    {key: 'sun', label: 'Воскресенье'},
];

const attrs = {
    mode: {name: 'mode', ID: 0x0000, type: Zcl.DataType.ENUM8, write: true, max: 3},
    autoIntervalMin: {name: 'autoIntervalMin', ID: 0x0001, type: Zcl.DataType.UINT16, write: true, max: 1440},
    scheduleDays: {name: 'scheduleDays', ID: 0x0002, type: Zcl.DataType.UINT8, write: true, max: 0x7f},
    scheduleStartMin: {name: 'scheduleStartMin', ID: 0x0003, type: Zcl.DataType.UINT16, write: true, max: 1439},
    scheduleEndMin: {name: 'scheduleEndMin', ID: 0x0004, type: Zcl.DataType.UINT16, write: true, max: 1439},
    scheduleIntervalMin: {name: 'scheduleIntervalMin', ID: 0x0005, type: Zcl.DataType.UINT16, write: true, max: 1440},
    timezoneMin: {name: 'timezoneMin', ID: 0x0006, type: Zcl.DataType.INT16, write: true, min: -720, max: 840},
    sprayCount: {name: 'sprayCount', ID: 0x0007, type: Zcl.DataType.UINT32, max: 0xffffffff},
    lastSprayReason: {name: 'lastSprayReason', ID: 0x0008, type: Zcl.DataType.UINT8, max: 5},
    lastSprayTime: {name: 'lastSprayTime', ID: 0x0009, type: Zcl.DataType.UTC, max: 0xfffffffe},
    nextSprayTime: {name: 'nextSprayTime', ID: 0x000a, type: Zcl.DataType.UTC, max: 0xfffffffe},
    timeValid: {name: 'timeValid', ID: 0x000b, type: Zcl.DataType.BOOLEAN},
    physicalMode: {name: 'physicalMode', ID: 0x000d, type: Zcl.DataType.UINT8, max: 0xff},
    resetCounter: {name: 'resetCounter', ID: 0x000e, type: Zcl.DataType.BOOLEAN, write: true},
    settingsVersion: {name: 'settingsVersion', ID: 0x000f, type: Zcl.DataType.UINT8, max: 0xff},
    syncTime: {name: 'syncTime', ID: 0x0010, type: Zcl.DataType.UINT32, write: true, max: 0xfffffffe},
    batteryMv: {name: 'batteryMv', ID: 0x0011, type: Zcl.DataType.UINT16, max: 0xffff},
    sprayDurationMs: {name: 'sprayDurationMs', ID: 0x0012, type: Zcl.DataType.UINT16, write: true, min: 300, max: 1000},
};

for (let slot = 0; slot < 7; slot++) {
    const n = slot + 1;
    const base = 0x0020 + slot * 8;
    attrs[`program${n}Enabled`] = {name: `program${n}Enabled`, ID: base + 0, type: Zcl.DataType.BOOLEAN, write: true};
    attrs[`program${n}Days`] = {name: `program${n}Days`, ID: base + 1, type: Zcl.DataType.UINT8, write: true, max: 0x7f};
    attrs[`program${n}StartMin`] = {name: `program${n}StartMin`, ID: base + 2, type: Zcl.DataType.UINT16, write: true, max: 1439};
    attrs[`program${n}EndMin`] = {name: `program${n}EndMin`, ID: base + 3, type: Zcl.DataType.UINT16, write: true, max: 1439};
    attrs[`program${n}IntervalMin`] = {name: `program${n}IntervalMin`, ID: base + 4, type: Zcl.DataType.UINT16, write: true, max: 1440};
}

const customCluster = m.deviceAddCustomCluster(CLUSTER, {
    name: CLUSTER,
    ID: 0xfc00,
    attributes: attrs,
    commands: {},
    commandsResponse: {},
});

const MODE_NAMES = ['OFF', 'AUTO', 'SCHEDULE', 'PROGRAMMABLE'];
const REASON_NAMES = ['нет', 'Zigbee', 'кнопка', 'AUTO', 'SCHEDULE', 'PROGRAM'];
const LIION_CURVE_X2 = [
    [4200, 200],
    [4180, 196],
    [4160, 192],
    [4140, 188],
    [4120, 184],
    [4100, 180],
    [4080, 176],
    [4060, 171],
    [4040, 166],
    [4020, 160],
    [4000, 154],
    [3980, 148],
    [3960, 142],
    [3940, 135],
    [3920, 128],
    [3900, 120],
    [3880, 112],
    [3860, 104],
    [3840, 96],
    [3820, 88],
    [3800, 80],
    [3780, 72],
    [3760, 64],
    [3740, 56],
    [3720, 48],
    [3700, 40],
    [3680, 32],
    [3660, 25],
    [3640, 19],
    [3620, 14],
    [3600, 10],
    [3580, 7],
    [3560, 5],
    [3540, 3],
    [3520, 2],
    [3500, 1],
    [3400, 0],
];

// Battery % is computed from batteryMv already included in normal custom
// reports: zero extra radio reads/reports and the same curve as the firmware.
function liionPercentFromMv(value) {
    const mv = Number(value);
    if (!Number.isFinite(mv) || mv < 2500 || mv > 4400) return undefined;
    if (mv >= LIION_CURVE_X2[0][0]) return 100;
    for (let i = 1; i < LIION_CURVE_X2.length; i++) {
        const [highMv, highX2] = LIION_CURVE_X2[i - 1];
        const [lowMv, lowX2] = LIION_CURVE_X2[i];
        if (mv >= lowMv) {
            const x2 = lowX2 + Math.floor(((mv - lowMv) * (highX2 - lowX2) +
                Math.floor((highMv - lowMv) / 2)) / (highMv - lowMv));
            return x2 / 2;
        }
    }
    return 0;
}

const lastClockSyncAttempt = new Map();
const CLOCK_SYNC_THROTTLE_MS = 60000;

function minutesToTime(value) {
    const v = Number(value);
    if (!Number.isFinite(v) || v < 0 || v > 1439) return '—';
    const h = Math.floor(v / 60);
    const min = v % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function timeToMinutes(value) {
    const s = String(value).trim();
    const match = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (!match) throw new Error('Время нужно вводить как ЧЧ:ММ, например 07:30');
    const h = Number(match[1]);
    const min = Number(match[2]);
    if (h > 23 || min > 59) throw new Error('Некорректное время; допустимо 00:00–23:59');
    return h * 60 + min;
}

function timezoneMinutes(meta) {
    const h = Number(meta?.state?.timezone_hours);
    return Number.isFinite(h) ? Math.round(h * 60) : 180;
}

function formatZigbeeTime(value, tzMinutes) {
    const v = Number(value);
    if (!Number.isFinite(v) || v <= 0 || v >= 0xffffffff) return '—';
    const date = new Date((v + ZIGBEE_EPOCH_UNIX + tzMinutes * 60) * 1000);
    const d = String(date.getUTCDate()).padStart(2, '0');
    const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
    const y = date.getUTCFullYear();
    const h = String(date.getUTCHours()).padStart(2, '0');
    const mi = String(date.getUTCMinutes()).padStart(2, '0');
    return `${d}.${mo}.${y} ${h}:${mi}`;
}

const fzAirwick = {
    cluster: CLUSTER,
    type: ['attributeReport', 'readResponse'],
    convert: (model, msg, publish, options, meta) => {
        const d = msg.data;
        const out = {schedule_info: SCHEDULE_INFO};
        const tz = d.timezoneMin !== undefined ? Number(d.timezoneMin) : timezoneMinutes(meta);
        if (d.mode !== undefined) out.mode = MODE_NAMES[Number(d.mode)] ?? 'UNKNOWN';
        if (d.autoIntervalMin !== undefined) out.auto_interval_min = Number(d.autoIntervalMin);
        if (d.sprayDurationMs !== undefined) out.spray_duration_ms = Number(d.sprayDurationMs);
        if (d.timezoneMin !== undefined) out.timezone_hours = Number(d.timezoneMin) / 60;
        if (d.sprayCount !== undefined) out.spray_count = Number(d.sprayCount);
        if (d.lastSprayReason !== undefined) out.last_spray_reason = REASON_NAMES[Number(d.lastSprayReason)] ?? 'неизвестно';
        if (d.lastSprayTime !== undefined) out.last_spray_time = formatZigbeeTime(d.lastSprayTime, tz);
        if (d.nextSprayTime !== undefined) out.next_spray_time = formatZigbeeTime(d.nextSprayTime, tz);
        if (d.timeValid !== undefined) {
            out.time_valid = d.timeValid ? 'ON' : 'OFF';
            if (!d.timeValid && meta?.device) {
                const key = meta.device.ieeeAddr ?? 'airwick';
                const nowMs = Date.now();
                const lastMs = lastClockSyncAttempt.get(key) ?? 0;
                if (nowMs - lastMs >= CLOCK_SYNC_THROTTLE_MS) {
                    lastClockSyncAttempt.set(key, nowMs);
                    void syncClock(meta.device).catch(() => {});
                }
            }
        }
        if (d.batteryMv !== undefined) {
            const pct = liionPercentFromMv(d.batteryMv);
            if (pct !== undefined) {
                out.battery_v = Number(d.batteryMv) / 1000;
                out.battery = pct;
            }
        }

        for (let slot = 0; slot < 7; slot++) {
            const n = slot + 1;
            const key = DAYS[slot].key;
            if (d[`program${n}Enabled`] !== undefined) out[`program_${key}_enabled`] = d[`program${n}Enabled`] ? 'ON' : 'OFF';
            if (d[`program${n}StartMin`] !== undefined) out[`program_${key}_start`] = minutesToTime(d[`program${n}StartMin`]);
            if (d[`program${n}EndMin`] !== undefined) out[`program_${key}_end`] = minutesToTime(d[`program${n}EndMin`]);
            if (d[`program${n}IntervalMin`] !== undefined) out[`program_${key}_interval_min`] = Number(d[`program${n}IntervalMin`]);
        }
        return out;
    },
};

const programKeys = [];
for (const day of DAYS) {
    programKeys.push(`program_${day.key}_enabled`, `program_${day.key}_start`, `program_${day.key}_end`, `program_${day.key}_interval_min`);
}

const tzAirwick = {
    key: ['auto_interval_min', 'spray_duration_ms', 'timezone_hours', ...programKeys, 'reset_counter'],
    convertSet: async (entity, key, value, meta) => {
        if (key === 'spray_duration_ms') {
            const n = Number(value);
            if (!Number.isInteger(n) || n < 300 || n > 1000) throw new Error('Длительность должна быть 300–1000 мс');
            await entity.write(CLUSTER, {sprayDurationMs: n});
            return {state: {spray_duration_ms: n}};
        }
        if (key === 'auto_interval_min') {
            const n = Number(value);
            await entity.write(CLUSTER, {autoIntervalMin: n});
            return {state: {auto_interval_min: n}};
        }
        if (key === 'timezone_hours') {
            const hours = Number(value);
            await entity.write(CLUSTER, {timezoneMin: Math.round(hours * 60)});
            return {state: {timezone_hours: hours}};
        }
        if (key === 'reset_counter') {
            await entity.write(CLUSTER, {resetCounter: true});
            return {state: {reset_counter: null, spray_count: 0}};
        }

        const match = /^program_(mon|tue|wed|thu|fri|sat|sun)_(enabled|start|end|interval_min)$/.exec(key);
        if (match) {
            const slot = DAYS.findIndex((d) => d.key === match[1]);
            const n = slot + 1;
            const field = match[2];
            if (field === 'enabled') {
                const on = value === 'ON' || value === true || value === 1;
                await entity.write(CLUSTER, {[`program${n}Enabled`]: on});
                return {state: {[key]: on ? 'ON' : 'OFF'}};
            }
            if (field === 'start' || field === 'end') {
                const minutes = timeToMinutes(value);
                const attr = `program${n}${field === 'start' ? 'StartMin' : 'EndMin'}`;
                await entity.write(CLUSTER, {[attr]: minutes});
                return {state: {[key]: minutesToTime(minutes)}};
            }
            if (field === 'interval_min') {
                const minutes = Number(value);
                await entity.write(CLUSTER, {[`program${n}IntervalMin`]: minutes});
                return {state: {[key]: minutes}};
            }
        }
    },
    convertGet: async (entity, key, meta) => {
        if (key === 'spray_duration_ms') return entity.read(CLUSTER, ['sprayDurationMs']);
        if (key === 'auto_interval_min') return entity.read(CLUSTER, ['autoIntervalMin']);
        if (key === 'timezone_hours') return entity.read(CLUSTER, ['timezoneMin']);

        const match = /^program_(mon|tue|wed|thu|fri|sat|sun)_(enabled|start|end|interval_min)$/.exec(key);
        if (match) {
            const slot = DAYS.findIndex((d) => d.key === match[1]);
            const n = slot + 1;
            const field = match[2];
            const attr = field === 'enabled' ? `program${n}Enabled` :
                field === 'start' ? `program${n}StartMin` :
                field === 'end' ? `program${n}EndMin` : `program${n}IntervalMin`;
            return entity.read(CLUSTER, [attr]);
        }
    },
};

const tzSpray = {
    key: ['spray'],
    convertSet: async (entity, key, value, meta) => {
        await entity.command('genOnOff', 'on', {}, {});
        return {state: {spray: null}};
    },
};

const readOnlyGet = {
    key: ['mode', 'spray_count', 'last_spray_reason', 'last_spray_time', 'next_spray_time', 'time_valid', 'battery_v', 'battery'],
    convertGet: async (entity, key, meta) => {
        const map = {
            mode: 'mode', spray_count: 'sprayCount', last_spray_reason: 'lastSprayReason',
            last_spray_time: 'lastSprayTime', next_spray_time: 'nextSprayTime', time_valid: 'timeValid',
            battery_v: 'batteryMv', battery: 'batteryMv',
        };
        return entity.read(CLUSTER, [map[key]]);
    },
};

const standardRaw = [
    customCluster,
    m.forcePowerSource({powerSource: 'Battery'}),
    m.battery({percentage: true, voltage: false}),
    m.onOff(),
];

const standardExtend = standardRaw.map((x) => Array.isArray(x.exposes) ? {...x, exposes: []} : x);

const ui = [
    e.enum('spray', ea.SET, ['РАСПЫЛИТЬ'])
        .withLabel('Распылить')
        .withDescription('Одно нажатие — одно распыление. Элемент не имеет фиксированного состояния.'),
    e.enum('mode', ea.STATE_GET, MODE_NAMES)
        .withLabel('Режим')
        .withDescription('Текущий режим, задаваемый физическим переключателем.'),
    e.numeric('battery_v', ea.STATE_GET)
        .withLabel('Напряжение аккумулятора').withUnit('V').withValueStep(0.001),
    e.numeric('battery', ea.STATE_GET)
        .withLabel('Заряд аккумулятора').withUnit('%').withValueMin(0).withValueMax(100).withValueStep(0.5),
    e.numeric('spray_duration_ms', ea.ALL).withLabel('Длительность распыления')
        .withDescription('Общая для OFF, AUTO, SCHEDULE и PROGRAMMABLE; сохраняется при переключении режимов.')
        .withUnit('мс').withValueMin(300).withValueMax(1000).withValueStep(10),
    e.numeric('auto_interval_min', ea.ALL).withLabel('AUTO: интервал').withUnit('мин').withValueMin(1).withValueMax(1440).withValueStep(1).withCategory('config'),
    e.text('schedule_info', ea.STATE).withLabel('SCHEDULE').withDescription('Встроенное расписание; редактирование не требуется.'),
];

for (const day of DAYS) {
    ui.push(
        e.binary(`program_${day.key}_enabled`, ea.ALL, 'ON', 'OFF').withLabel(`PROGRAM — ${day.label}: включён`).withCategory('config'),
        e.text(`program_${day.key}_start`, ea.ALL).withLabel(`PROGRAM — ${day.label}: начало`).withDescription('ЧЧ:ММ').withCategory('config'),
        e.text(`program_${day.key}_end`, ea.ALL).withLabel(`PROGRAM — ${day.label}: конец`).withDescription('ЧЧ:ММ').withCategory('config'),
        e.numeric(`program_${day.key}_interval_min`, ea.ALL).withLabel(`PROGRAM — ${day.label}: интервал`).withUnit('мин').withValueMin(1).withValueMax(1440).withValueStep(1).withCategory('config'),
    );
}

ui.push(
    e.numeric('timezone_hours', ea.ALL).withLabel('Часовой пояс UTC').withUnit('ч').withValueMin(-12).withValueMax(14).withValueStep(0.5).withCategory('config'),
    e.numeric('spray_count', ea.STATE_GET).withLabel('Счётчик распылений').withValueMin(0),
    e.enum('reset_counter', ea.SET, ['СБРОСИТЬ']).withLabel('Сбросить счётчик').withCategory('config'),
    e.enum('last_spray_reason', ea.STATE_GET, REASON_NAMES).withLabel('Причина последнего распыления').withCategory('diagnostic'),
    e.text('last_spray_time', ea.STATE_GET).withLabel('Последнее распыление').withCategory('diagnostic'),
    e.text('next_spray_time', ea.STATE_GET).withLabel('Следующее распыление').withCategory('diagnostic'),
    e.binary('time_valid', ea.STATE_GET, 'ON', 'OFF').withLabel('Время синхронизировано').withCategory('diagnostic'),
);

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry(operation, attempts = 3, delayMs = 350) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < attempts) await delay(delayMs * attempt);
        }
    }
    throw lastError;
}

async function syncClock(device) {
    const endpoint = device.getEndpoint(ENDPOINT);
    if (!endpoint) throw new Error(`AirWick endpoint ${ENDPOINT} not found`);
    const now = Math.floor(Date.now() / 1000) - ZIGBEE_EPOCH_UNIX;
    if (now > 0) await endpoint.write(CLUSTER, {syncTime: now});
}

async function configureReliableReporting(endpoint) {
    // ENUM8/BOOLEAN are discrete ZCL types: they MUST NOT carry reportableChange.
    // v0.16 incorrectly sent reportableChange=0 for mode/timeValid, so the device
    // could reject those Configure Reporting records while nextSprayTime still worked.
    await retry(() => endpoint.configureReporting(CLUSTER, [
        {attribute: 'mode', minimumReportInterval: 0, maximumReportInterval: 3600},
    ]));
    await retry(() => endpoint.configureReporting(CLUSTER, [
        {attribute: 'timeValid', minimumReportInterval: 0, maximumReportInterval: 3600},
    ]));

    await retry(() => endpoint.configureReporting(CLUSTER, [
        {attribute: 'batteryMv', minimumReportInterval: 30, maximumReportInterval: 3600, reportableChange: 10},
    ]));

    for (const attribute of ['sprayCount', 'lastSprayReason', 'lastSprayTime', 'nextSprayTime']) {
        await retry(() => endpoint.configureReporting(CLUSTER, [
            {attribute, minimumReportInterval: 0, maximumReportInterval: 3600, reportableChange: 1},
        ]));
    }

    // Do not rely only on modernExtend here: this is the momentary Spray state.
    // Correct discrete reporting makes the UI return from ON to OFF after the configured pulse.
    await retry(() => endpoint.configureReporting('genOnOff', [
        {attribute: 'onOff', minimumReportInterval: 0, maximumReportInterval: 3600},
    ]));
}

async function refreshState(device) {
    const endpoint = device.getEndpoint(ENDPOINT);
    if (!endpoint) throw new Error(`AirWick endpoint ${ENDPOINT} not found`);

    // Keep requests short. The old converter tried to read 36 attributes in one
    // transaction, which is unnecessarily fragile for a sleepy RX-off device.
    const chunks = [
        ['mode', 'autoIntervalMin', 'timezoneMin', 'sprayCount', 'batteryMv', 'sprayDurationMs'],
        ['lastSprayReason', 'lastSprayTime', 'nextSprayTime', 'timeValid'],
    ];
    for (let slot = 1; slot <= 7; slot++) {
        chunks.push([
            `program${slot}Enabled`, `program${slot}StartMin`,
            `program${slot}EndMin`, `program${slot}IntervalMin`,
        ]);
    }

    for (const attributes of chunks) {
        await retry(() => endpoint.read(CLUSTER, attributes));
        await delay(100);
    }
    await retry(() => endpoint.read('genOnOff', ['onOff']));
}

async function configure(device, coordinatorEndpoint) {
    const endpoint = device.getEndpoint(ENDPOINT);
    if (!endpoint) throw new Error(`AirWick endpoint ${ENDPOINT} not found`);

    // Attribute reporting is destination-driven through the Zigbee binding table.
    // v0.16 configured reporting records but did not explicitly bind the custom
    // AirWick cluster. That can leave local selector changes invisible in Z2M even
    // while direct reads and some other reports still work. Bind first, then configure.
    await retry(() => endpoint.bind(CLUSTER, coordinatorEndpoint));
    await retry(() => endpoint.bind('genOnOff', coordinatorEndpoint));
    await retry(() => endpoint.bind('genPowerCfg', coordinatorEndpoint));

    await retry(() => syncClock(device));
    await configureReliableReporting(endpoint);
    await refreshState(device);
}

async function onEvent(type, data, device) {
    if (type === 'start') {
        await delay(800);
        try {
            await retry(() => syncClock(device), 2, 500);
        } catch {
            // While powered, firmware keeps time via uptime and retries time sync itself.
        }
        return;
    }

    if (type === 'deviceAnnounce') {
        // One time write only. A large read burst here competes with ZDO interview
        // and can overwhelm a sleepy end device; full reads belong to configure.
        await delay(1200);
        try {
            await syncClock(device);
        } catch {
            // Non-fatal: firmware keeps its uptime-based clock and retries itself.
        }
    }
}

export default {
    zigbeeModel: ['AirWick_nRF52840'],
    model: 'AirWick_nRF52840',
    vendor: 'DIY',
    description: 'AirWick smart aerosol dispenser nRF52840 v0.27; v0.26 plus persistent 300–1000 ms pulse for all modes',
    extend: standardExtend,
    fromZigbee: [fzAirwick],
    toZigbee: [tzAirwick, tzSpray, readOnlyGet],
    exposes: ui,
    configure,
    onEvent,
};
