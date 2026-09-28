// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import {
  cancelPrint,
  emergencyStop,
  fetchConfigfile,
  firmwareRestart,
  macroScript,
  pausePrint,
  rebootHost,
  resumePrint,
  sendGcode,
  shutdownHost,
  startPrint,
  type PrinterLiveStatus,
} from '@3d-gallery/print-toolkit';
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { loadPlannerSettings, onPlannerSettingsChange } from '../print/fleet-plan.js';
import { bedSurfaceTempKey, DEFAULT_BED_SURFACE } from '../print/plate-slice.js';
import { flattenPresetForSlicer } from '../print/preset-flatten.js';
import { listPresets, onPresetsChange } from '../print/print-storage.js';
import {
  BED_PRESETS,
  COLD_PULL_TEMPS,
  controlStates,
  DEFAULT_MIN_EXTRUDE_TEMP,
  defaultOpenGroups,
  EXTRUDE_MM,
  filamentTemp,
  GROUPS,
  hostPowerViaMoonraker,
  materialPreheats,
  NOZZLE_PRESETS,
  nudge,
  stopNotice,
  Z_STEPS,
  type ControlId,
  type ControlState,
  type GroupId,
  type MaterialPreheat,
} from './control-model.js';
import { FilePicker } from './FilePicker.js';
import { HoldButton } from './HoldButton.js';
import './controls.css';

export interface ControlledPrinter {
  id: string;
  name: string;
  /** Moonraker `host:port`, from the preset's print host. */
  address: string;
}

/**
 * The page runs `run`, reports how it went and polls the printer again at
 * once, so every control's result shows the same way.
 */
export type RunCommand = (label: string, run: () => Promise<void>) => void;

export interface PrinterControlsProps {
  printer: ControlledPrinter;
  /** The latest poll; null while the printer can't be reached. */
  live: PrinterLiveStatus | null;
  onCommand: RunCommand;
}

const WIDE = '(min-width: 720px)';

// printer.cfg only changes with a restart, and configfile is a big reply to ask for twice.
const minExtrudeTemps = new Map<string, number>();

function useMinExtrudeTemp(address: string, ready: boolean): number {
  const [temp, setTemp] = useState(() => minExtrudeTemps.get(address) ?? DEFAULT_MIN_EXTRUDE_TEMP);
  useEffect(() => {
    if (!ready || minExtrudeTemps.has(address)) return;
    let live = true;
    fetchConfigfile(address).then((config) => {
      const value = Number(config['extruder']?.['min_extrude_temp'] ?? DEFAULT_MIN_EXTRUDE_TEMP);
      if (!Number.isFinite(value)) return;
      minExtrudeTemps.set(address, value);
      if (live) setTemp(value);
    }, () => { /* keep Klipper's default until the next ready poll */ });
    return () => { live = false; };
  }, [address, ready]);
  return temp;
}

function useMaterialPreheats(): MaterialPreheat[] {
  const [preheats, setPreheats] = useState<MaterialPreheat[]>([]);
  useEffect(() => {
    let live = true;
    const load = () => listPresets('filament').then((presets) => {
      if (!live) return;
      const flat = presets.map((p) => ({ id: p.id, name: p.name, flat: flattenPresetForSlicer(p) }));
      setPreheats(materialPreheats(flat, loadPlannerSettings().filaments, bedSurfaceTempKey(DEFAULT_BED_SURFACE)));
    }, () => { /* no presets store: no preheat buttons */ });
    load();
    const offPresets = onPresetsChange((kind) => { if (kind === 'filament') load(); });
    const offPlanner = onPlannerSettingsChange(load);
    return () => { live = false; offPresets(); offPlanner(); };
  }, []);
  return preheats;
}

function useOpenGroups(live: PrinterLiveStatus | null) {
  const defaults = defaultOpenGroups(live).join();
  const initial = () => new Set<GroupId>(
    window.matchMedia(WIDE).matches ? GROUPS.map((g) => g.id) : defaultOpenGroups(live),
  );
  const [open, setOpen] = useState(initial);
  // A print starting or ending, or Klipper stopping, changes which controls matter; re-open to suit.
  useEffect(() => setOpen(initial()), [defaults]);
  const toggle = (id: GroupId, isOpen: boolean) => setOpen((prev) => {
    if (prev.has(id) === isOpen) return prev;
    const next = new Set(prev);
    if (isOpen) next.add(id); else next.delete(id);
    return next;
  });
  return [open, toggle] as const;
}

/**
 * Every control for one printer, on its card on the Printers page. Which are
 * shown, greyed out or held to confirm comes from `control-model.ts`; this
 * only lays them out and hands each command to the page.
 */
export function PrinterControls({ printer, live, onCommand }: PrinterControlsProps) {
  const { address } = printer;
  const minExtrude = useMinExtrudeTemp(address, live?.klippyState === 'ready');
  const preheats = useMaterialPreheats();
  const [open, toggle] = useOpenGroups(live);
  const [picking, setPicking] = useState(false);
  // The typed text, kept as typed: a poll re-rendering mid-edit must not overwrite it.
  const [loadTempText, setLoadTempText] = useState<string | null>(null);
  const [pullMaterial, setPullMaterial] = useState(COLD_PULL_TEMPS[1].material);

  const states = controlStates(live, minExtrude);
  const notice = stopNotice(live);
  const typedTemp = Number(loadTempText);
  const temp = loadTempText && Number.isFinite(typedTemp) && typedTemp >= minExtrude ? typedTemp : filamentTemp(live, minExtrude);

  const run = (label: string, fn: () => Promise<void>) => onCommand(label, fn);
  // async, so a script builder's RangeError reaches the page as a failed command.
  const gcode = (label: string, script: () => string) => run(label, async () => sendGcode(address, script()));

  // Set per group as it renders, so a button prints its reason only when it
  // differs from the one its group heading already shows.
  let groupReason = '';

  interface BtnSpec { id: ControlId; label: ComponentChildren; onPress: () => void; cls?: string; aria?: string; key?: string | number }
  const btn = ({ id, label, onPress, cls, aria, key }: BtnSpec) => {
    const s: ControlState = states[id];
    if (!s.visible) return null;
    const why = s.reason && s.reason !== groupReason ? <small class="pc-reason">{s.reason}</small> : null;
    const className = `pc-btn${cls ? ` ${cls}` : ''}`;
    if (s.confirm === 'hold') {
      return (
        <HoldButton key={key} class={className} data-control={id} aria-label={aria} disabled={!s.enabled}
          title={s.reason || undefined} onConfirm={onPress}>
          {label}{why}
        </HoldButton>
      );
    }
    return (
      <button key={key} type="button" class={className} data-control={id} aria-label={aria} disabled={!s.enabled}
        title={s.reason || undefined} onClick={onPress}>
        {label}{why}
      </button>
    );
  };

  const row = (label: string, value: string | undefined, children: ComponentChildren) => (
    <div class="pc-row">
      <span class="pc-row-label">{label}{value !== undefined && <b class="pc-row-value">{value}</b>}</span>
      <div class="pc-row-buttons">{children}</div>
    </div>
  );

  const tune = (control: 'speed' | 'flow' | 'fan', current: number | null) => {
    const label = { speed: 'Speed', flow: 'Flow', fan: 'Fan' }[control];
    const apply = (dir: 1 | -1) => {
      const next = nudge(control, current, dir);
      gcode(`${label} ${next} %`, () => macroScript[control](next));
    };
    return row(label, current === null ? '–' : `${Math.round(current)} %`, <>
      {btn({ id: control, label: '−', cls: 'is-step', aria: `${label} down`, onPress: () => apply(-1) })}
      {btn({ id: control, label: '+', cls: 'is-step', aria: `${label} up`, onPress: () => apply(1) })}
    </>);
  };

  const body: Record<GroupId, () => ComponentChildren> = {
    print: () => (
      <>
        <div class="pc-buttons">
          {btn({ id: 'pause', label: 'Pause', onPress: () => run('Pause', () => pausePrint(address)) })}
          {btn({ id: 'resume', label: 'Resume', onPress: () => run('Resume', () => resumePrint(address)) })}
          {btn({ id: 'cancel', label: 'Cancel print', cls: 'is-danger', onPress: () => run('Cancel print', () => cancelPrint(address)) })}
          {btn({ id: 'pauseNextLayer', label: 'Pause at next layer', onPress: () => gcode('Pause at next layer', macroScript.pauseNextLayer) })}
        </div>
        {states.excludeObject.enabled && live ? (
          <div class="pc-objects">
            <span class="pc-row-label">Objects</span>
            <ul class="pc-object-list">
              {live.objects.map((o) => (
                <li key={o.name} class={`pc-object${o.excluded ? ' is-excluded' : ''}${o.current ? ' is-current' : ''}`}>
                  <span class="pc-object-name">{o.name}</span>
                  {!o.excluded && btn({
                    id: 'excludeObject',
                    label: 'Cancel object',
                    aria: `Cancel object ${o.name}`,
                    cls: 'is-danger',
                    onPress: () => gcode(`Cancel ${o.name}`, () => macroScript.excludeObject(o.name)),
                  })}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div class="pc-buttons">{btn({ id: 'excludeObject', label: 'Cancel an object', onPress: () => undefined })}</div>
        )}
        {row('Z offset', live?.zOffset == null ? '–' : `${live.zOffset.toFixed(3)} mm`, Z_STEPS.map((step) => btn({
          key: step,
          id: 'zOffset',
          label: `${step > 0 ? '+' : '−'}${Math.abs(step)}`,
          aria: `Z offset ${step > 0 ? '+' : '-'}${Math.abs(step)} mm`,
          cls: 'is-step',
          onPress: () => gcode(`Z offset ${step > 0 ? '+' : ''}${step} mm`, () => macroScript.zOffsetAdjust(step)),
        })))}
        {tune('speed', live?.speedPct ?? null)}
        {tune('flow', live?.flowPct ?? null)}
        {tune('fan', live?.fanPct ?? null)}
      </>
    ),
    heat: () => (
      <>
        {row('Nozzle', live?.extruder ? `${Math.round(live.extruder.actual)} → ${Math.round(live.extruder.target)} °C` : undefined,
          NOZZLE_PRESETS.map((c) => btn({
            key: c, id: 'nozzleTemp', label: c ? `${c}°` : 'Off', aria: c ? `Nozzle ${c} °C` : 'Nozzle off', cls: 'is-step',
            onPress: () => gcode(c ? `Nozzle to ${c} °C` : 'Nozzle off', () => macroScript.setNozzle(c)),
          })))}
        {row('Bed', live?.bed ? `${Math.round(live.bed.actual)} → ${Math.round(live.bed.target)} °C` : undefined,
          BED_PRESETS.map((c) => btn({
            key: c, id: 'bedTemp', label: c ? `${c}°` : 'Off', aria: c ? `Bed ${c} °C` : 'Bed off', cls: 'is-step',
            onPress: () => gcode(c ? `Bed to ${c} °C` : 'Bed off', () => macroScript.setBed(c)),
          })))}
        {preheats.length > 0 && row('Preheat', undefined, preheats.map((p) => btn({
          key: p.family,
          id: 'preheat',
          label: <>{p.family} <small class="pc-sub">{p.nozzle}/{p.bed}°</small></>,
          aria: `Preheat ${p.family}`,
          onPress: () => gcode(`Preheat ${p.family}`, () => `${macroScript.setNozzle(p.nozzle)}\n${macroScript.setBed(p.bed)}`),
        })))}
      </>
    ),
    filament: () => (
      <>
        {(states.load.visible || states.unload.visible) && (
          <label class="pc-field">
            Load / unload at
            <input
              type="number"
              inputMode="numeric"
              min={minExtrude}
              max={300}
              step={5}
              value={loadTempText ?? temp}
              onInput={(e) => setLoadTempText(e.currentTarget.value)}
            />
            °C
          </label>
        )}
        <div class="pc-buttons">
          {btn({ id: 'load', label: 'Load', onPress: () => gcode(`Load filament at ${temp} °C`, () => macroScript.loadFilament(temp)) })}
          {btn({ id: 'unload', label: 'Unload', onPress: () => gcode(`Unload filament at ${temp} °C`, () => macroScript.unloadFilament(temp)) })}
          {btn({ id: 'purge', label: 'Purge', onPress: () => gcode('Purge', () => macroScript.purge()) })}
          {btn({ id: 'extrude', label: `Extrude ${EXTRUDE_MM} mm`, onPress: () => gcode(`Extrude ${EXTRUDE_MM} mm`, () => macroScript.extrude(EXTRUDE_MM)) })}
          {btn({ id: 'retract', label: `Retract ${EXTRUDE_MM} mm`, onPress: () => gcode(`Retract ${EXTRUDE_MM} mm`, () => macroScript.retract(EXTRUDE_MM)) })}
        </div>
      </>
    ),
    machine: () => {
      const pull = COLD_PULL_TEMPS.find((t) => t.material === pullMaterial) ?? COLD_PULL_TEMPS[0];
      const lightOn = !!live?.lightOn;
      return (
        <>
          <div class="pc-buttons">
            {btn({ id: 'home', label: 'Home', onPress: () => gcode('Home', macroScript.home) })}
            {btn({ id: 'meshAndSave', label: 'Bed mesh and save', onPress: () => gcode('Bed mesh and save', macroScript.meshAndSave) })}
            {btn({ id: 'clearNozzle', label: 'Clean nozzle', onPress: () => gcode('Clean nozzle', macroScript.clearNozzle) })}
            {btn({ id: 'park', label: 'Park', onPress: () => gcode('Park', macroScript.park) })}
            {btn({ id: 'disableMotors', label: 'Motors off', onPress: () => gcode('Motors off', macroScript.disableMotors) })}
            {btn({
              id: 'light',
              label: lightOn ? 'Light off' : 'Light on',
              onPress: () => gcode(lightOn ? 'Light off' : 'Light on', () => macroScript.light(!lightOn)),
            })}
            {btn({ id: 'restartCamera', label: 'Restart camera', onPress: () => gcode('Restart camera', macroScript.restartCamera) })}
          </div>
          {states.coldPull.visible && row('Cold pull', undefined, <>
            <select
              class="pc-select"
              aria-label="Cold pull material"
              value={pullMaterial}
              disabled={!states.coldPull.enabled}
              onChange={(e) => setPullMaterial(e.currentTarget.value)}
            >
              {COLD_PULL_TEMPS.map((t) => <option key={t.material} value={t.material}>{t.material} {t.hot}/{t.cold}°</option>)}
            </select>
            {btn({
              id: 'coldPull',
              label: 'Start',
              aria: 'Start cold pull',
              onPress: () => gcode(`Cold pull ${pull.material}`, () => macroScript.coldPull({ hot: pull.hot, cold: pull.cold })),
            })}
          </>)}
          <div class="pc-buttons">
            {btn({ id: 'firmwareRestart', label: 'Firmware restart', cls: 'is-danger', onPress: () => run('Firmware restart', () => firmwareRestart(address)) })}
            {btn({
              id: 'reboot',
              label: 'Reboot',
              cls: 'is-danger',
              onPress: () => run('Reboot', () => (live && !hostPowerViaMoonraker(live, 'REBOOT')
                ? sendGcode(address, macroScript.reboot())
                : rebootHost(address))),
            })}
            {btn({
              id: 'powerOff',
              label: 'Power off',
              cls: 'is-danger',
              onPress: () => run('Power off', () => (live && !hostPowerViaMoonraker(live, 'SHUTDOWN')
                ? sendGcode(address, macroScript.powerOff())
                : shutdownHost(address))),
            })}
          </div>
        </>
      );
    },
  };

  return (
    <div class="pc" data-printer={printer.name}>
      {notice && live && <p class="pc-notice" role="status">{notice}</p>}
      <div class="pc-top">
        {btn({ id: 'emergencyStop', label: 'Emergency stop', cls: 'pc-estop', onPress: () => run('Emergency stop', () => emergencyStop(address)) })}
        {states.startPrint.enabled && btn({ id: 'startPrint', label: 'Print a file…', onPress: () => setPicking(true) })}
      </div>
      {live && GROUPS.map((g) => {
        const reasons = new Set(g.controls.map((id) => states[id]).filter((s) => s.visible && !s.enabled).map((s) => s.reason));
        groupReason = reasons.size === 1 ? [...reasons][0] : '';
        const content = body[g.id]();
        return (
          <details
            key={g.id}
            class="pc-group"
            data-group={g.id}
            open={open.has(g.id)}
            onToggle={(e) => toggle(g.id, (e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary class="pc-group-head">
              {g.label}
              {groupReason && groupReason !== notice && <span class="pc-group-reason">{groupReason}</span>}
            </summary>
            <div class="pc-group-body">{content}</div>
          </details>
        );
      })}
      {picking && (
        <FilePicker
          printerName={printer.name}
          address={address}
          onClose={() => setPicking(false)}
          onStart={(file) => {
            setPicking(false);
            run(`Start ${file.path}`, () => startPrint(address, file.path));
          }}
        />
      )}
    </div>
  );
}
