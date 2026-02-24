import { Action, ActionPanel, Color, Icon, Keyboard, List } from "@raycast/api";
import React from "react";
import { QuickSettingsForm } from "./components/QuickSettingsForm";
import { SetAbsoluteVolumeForm } from "./components/SetAbsoluteVolumeForm";
import {
  adjustTargetGain,
  launchVoicemeeterFromSettings,
  undoLastChange,
} from "./lib/controller";
import { notifyAction } from "./lib/feedback";
import { isFavorite, sortWithFavoritesFirst } from "./lib/favorites";
import { filterVisible, isHidden } from "./lib/hidden";
import { useEffectiveSettings } from "./lib/use-settings";
import { useFavorites } from "./lib/use-favorites";
import { useHidden } from "./lib/use-hidden";
import { MAX_GAIN_DB, MIN_GAIN_DB } from "./lib/target";
import { useVoicemeeterState } from "./lib/use-vm-state";
import { VoicemeeterTarget } from "./lib/types";

function groupTargets(
  targets: VoicemeeterTarget[],
  kind: "strip" | "bus",
): VoicemeeterTarget[] {
  return targets.filter((target) => target.kind === kind);
}

export default function Command() {
  const { state, isLoading, undoCount, refresh, applyCacheUpdate } =
    useVoicemeeterState();
  const { settings, refreshSettings } = useEffectiveSettings();
  const { favorites, toggleFavorite } = useFavorites();
  const { hidden, toggleHidden } = useHidden();

  async function refreshEverything() {
    await Promise.all([refresh(), refreshSettings()]);
  }

  async function handleStep(target: VoicemeeterTarget, delta: number) {
    const result = await adjustTargetGain(target, delta);
    await notifyAction(result);
    if (result.ok) {
      const nextGain = Math.max(
        MIN_GAIN_DB,
        Math.min(MAX_GAIN_DB, Math.round((target.gain + delta) * 100) / 100),
      );
      await applyCacheUpdate({ targetId: target.id, gain: nextGain });
    } else {
      await refresh();
    }
  }

  async function handleUndo() {
    const result = await undoLastChange();
    await notifyAction(result);
    await refresh();
  }

  async function handleLaunch() {
    const result = await launchVoicemeeterFromSettings();
    await notifyAction(result);
    await refreshEverything();
  }

  const strips = filterVisible(
    sortWithFavoritesFirst(groupTargets(state.targets, "strip"), favorites),
    hidden,
  );
  const buses = filterVisible(
    sortWithFavoritesFirst(groupTargets(state.targets, "bus"), favorites),
    hidden,
  );
  const hiddenTargets = state.targets.filter((t) => isHidden(t, hidden));

  const primaryIncrease = settings.volumePrimaryAction === "increase";
  const enterShortcut: Keyboard.Shortcut = { modifiers: [], key: "enter" };
  const ctrlEnterShortcut: Keyboard.Shortcut = {
    modifiers: ["ctrl"],
    key: "enter",
  };
  const increaseShortcut = primaryIncrease ? enterShortcut : ctrlEnterShortcut;
  const decreaseShortcut = primaryIncrease ? ctrlEnterShortcut : enterShortcut;

  function renderVolumeActions(target: VoicemeeterTarget) {
    return (
      <>
        <Action
          title={`Increase By ${settings.increaseStep} dB`}
          shortcut={increaseShortcut}
          onAction={() => handleStep(target, settings.increaseStep)}
        />
        <Action
          title={`Decrease By ${settings.decreaseStep} dB`}
          shortcut={decreaseShortcut}
          onAction={() => handleStep(target, -settings.decreaseStep)}
        />
        <Action.Push
          title="Set Absolute Volume"
          target={
            <SetAbsoluteVolumeForm target={target} onSaved={applyCacheUpdate} />
          }
        />
      </>
    );
  }

  return (
    <List
      isLoading={isLoading}
      navigationTitle="Volume"
      searchBarPlaceholder="Filter strips and buses..."
    >
      <List.Section title="Connection">
        <List.Item
          title={state.connected ? "Connected" : "Disconnected"}
          subtitle={
            state.connected
              ? `${state.capabilities.edition} detected`
              : (state.error ?? "Voicemeeter unavailable")
          }
          icon={{
            source: state.connected ? Icon.CheckCircle : Icon.CircleDisabled,
            tintColor: state.connected ? Color.Green : Color.Orange,
          }}
          accessories={[
            {
              text: `${state.capabilities.stripCount + state.capabilities.busCount} targets`,
            },
          ]}
          actions={
            <ActionPanel>
              <Action title="Refresh" onAction={refreshEverything} />
              <Action title="Launch Voicemeeter" onAction={handleLaunch} />
              <Action.Push
                title="Quick Settings"
                target={<QuickSettingsForm onSaved={refreshEverything} />}
                icon={Icon.Gear}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      {settings.sectionOrder === "strips-first" ? (
        <>
          <List.Section title="Strips">
            {strips.map((target) => (
              <List.Item
                key={target.id}
                title={target.name}
                subtitle={`${target.mute ? "Muted" : "Unmuted"} • ${target.gain.toFixed(2)} dB`}
                accessories={[
                  ...(isFavorite(target, favorites)
                    ? [
                        {
                          icon: { source: Icon.Star, tintColor: Color.Yellow },
                          tooltip: "Favorite",
                        },
                      ]
                    : []),
                  {
                    icon: {
                      source: Icon.Circle,
                      tintColor: target.mute ? Color.Red : Color.Green,
                    },
                    tooltip: target.mute ? "Muted" : "Unmuted",
                  },
                ]}
                actions={
                  <ActionPanel>
                    {renderVolumeActions(target)}
                    <Action
                      title={
                        isFavorite(target, favorites)
                          ? "Remove from Favorites"
                          : "Add to Favorites"
                      }
                      onAction={() => toggleFavorite(target)}
                      icon={Icon.Star}
                    />
                    <Action
                      title="Hide"
                      onAction={() => toggleHidden(target)}
                      icon={Icon.EyeDisabled}
                    />
                    <Action
                      title={`Undo Last Change (${undoCount})`}
                      onAction={handleUndo}
                    />
                    <Action title="Refresh" onAction={refreshEverything} />
                    <Action.Push
                      title="Quick Settings"
                      target={<QuickSettingsForm onSaved={refreshEverything} />}
                      icon={Icon.Gear}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
          <List.Section title="Buses">
            {buses.map((target) => (
              <List.Item
                key={target.id}
                title={target.name}
                subtitle={`${target.mute ? "Muted" : "Unmuted"} • ${target.gain.toFixed(2)} dB`}
                accessories={[
                  ...(isFavorite(target, favorites)
                    ? [
                        {
                          icon: { source: Icon.Star, tintColor: Color.Yellow },
                          tooltip: "Favorite",
                        },
                      ]
                    : []),
                  {
                    icon: {
                      source: Icon.Circle,
                      tintColor: target.mute ? Color.Red : Color.Green,
                    },
                    tooltip: target.mute ? "Muted" : "Unmuted",
                  },
                ]}
                actions={
                  <ActionPanel>
                    {renderVolumeActions(target)}
                    <Action
                      title={
                        isFavorite(target, favorites)
                          ? "Remove from Favorites"
                          : "Add to Favorites"
                      }
                      onAction={() => toggleFavorite(target)}
                      icon={Icon.Star}
                    />
                    <Action
                      title="Hide"
                      onAction={() => toggleHidden(target)}
                      icon={Icon.EyeDisabled}
                    />
                    <Action
                      title={`Undo Last Change (${undoCount})`}
                      onAction={handleUndo}
                    />
                    <Action title="Refresh" onAction={refreshEverything} />
                    <Action.Push
                      title="Quick Settings"
                      target={<QuickSettingsForm onSaved={refreshEverything} />}
                      icon={Icon.Gear}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        </>
      ) : (
        <>
          <List.Section title="Buses">
            {buses.map((target) => (
              <List.Item
                key={target.id}
                title={target.name}
                subtitle={`${target.mute ? "Muted" : "Unmuted"} • ${target.gain.toFixed(2)} dB`}
                accessories={[
                  ...(isFavorite(target, favorites)
                    ? [
                        {
                          icon: { source: Icon.Star, tintColor: Color.Yellow },
                          tooltip: "Favorite",
                        },
                      ]
                    : []),
                  {
                    icon: {
                      source: Icon.Circle,
                      tintColor: target.mute ? Color.Red : Color.Green,
                    },
                    tooltip: target.mute ? "Muted" : "Unmuted",
                  },
                ]}
                actions={
                  <ActionPanel>
                    {renderVolumeActions(target)}
                    <Action
                      title={
                        isFavorite(target, favorites)
                          ? "Remove from Favorites"
                          : "Add to Favorites"
                      }
                      onAction={() => toggleFavorite(target)}
                      icon={Icon.Star}
                    />
                    <Action
                      title="Hide"
                      onAction={() => toggleHidden(target)}
                      icon={Icon.EyeDisabled}
                    />
                    <Action
                      title={`Undo Last Change (${undoCount})`}
                      onAction={handleUndo}
                    />
                    <Action title="Refresh" onAction={refreshEverything} />
                    <Action.Push
                      title="Quick Settings"
                      target={<QuickSettingsForm onSaved={refreshEverything} />}
                      icon={Icon.Gear}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
          <List.Section title="Strips">
            {strips.map((target) => (
              <List.Item
                key={target.id}
                title={target.name}
                subtitle={`${target.mute ? "Muted" : "Unmuted"} • ${target.gain.toFixed(2)} dB`}
                accessories={[
                  ...(isFavorite(target, favorites)
                    ? [
                        {
                          icon: { source: Icon.Star, tintColor: Color.Yellow },
                          tooltip: "Favorite",
                        },
                      ]
                    : []),
                  {
                    icon: {
                      source: Icon.Circle,
                      tintColor: target.mute ? Color.Red : Color.Green,
                    },
                    tooltip: target.mute ? "Muted" : "Unmuted",
                  },
                ]}
                actions={
                  <ActionPanel>
                    {renderVolumeActions(target)}
                    <Action
                      title={
                        isFavorite(target, favorites)
                          ? "Remove from Favorites"
                          : "Add to Favorites"
                      }
                      onAction={() => toggleFavorite(target)}
                      icon={Icon.Star}
                    />
                    <Action
                      title="Hide"
                      onAction={() => toggleHidden(target)}
                      icon={Icon.EyeDisabled}
                    />
                    <Action
                      title={`Undo Last Change (${undoCount})`}
                      onAction={handleUndo}
                    />
                    <Action title="Refresh" onAction={refreshEverything} />
                    <Action.Push
                      title="Quick Settings"
                      target={<QuickSettingsForm onSaved={refreshEverything} />}
                      icon={Icon.Gear}
                    />
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        </>
      )}

      {hiddenTargets.length > 0 ? (
        <List.Section title="Hidden">
          {hiddenTargets.map((target) => (
            <List.Item
              key={target.id}
              title={target.name}
              subtitle={`${target.kind} • Gain ${target.gain.toFixed(2)} dB`}
              icon={Icon.EyeDisabled}
              actions={
                <ActionPanel>
                  <Action
                    title="Show"
                    onAction={() => toggleHidden(target)}
                    icon={Icon.Eye}
                  />
                  <Action title="Refresh" onAction={refreshEverything} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : null}
    </List>
  );
}
