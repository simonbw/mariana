import classNames from "classnames";
import React, { useState } from "react";
import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import Game from "../../core/Game";
import { ControllerButton } from "../../core/io/Gamepad";
import { KeyCode } from "../../core/io/Keys";
import { Persistence } from "../config/Persistence";
import { getCurrentGraphicsQuality } from "../controllers/GraphicsQualityController";
import { getVolumeController } from "../controllers/VolumeController";
import { Credits } from "./Credits";
import "./PauseMenu.css";
import { ReactEntity } from "./ReactEntity";

// Shows the menu when paused, invisible otherwise
export default class PauseMenu extends BaseEntity implements Entity {
  persistenceLevel = Persistence.Game;
  pausable = false;
  reactEntity: ReactEntity<unknown>;

  constructor() {
    super();

    this.reactEntity = this.addChild(
      new ReactEntity(() => <PauseMenuView game={this.game!} />)
    );
  }

  onAdd(game: Game) {
    this.reactEntity.autoRender = game.paused;
  }

  onPause() {
    this.reactEntity.autoRender = true;
  }

  onUnpause() {
    this.reactEntity.autoRender = false;
    this.reactEntity.reactRender();
  }

  onKeyDown(key: KeyCode) {
    switch (key) {
      case "KeyP":
      case "Escape":
        this.game?.togglePause();
        break;
    }
  }

  // Rerender immediately on these specific events for responsiveness of menu
  handlers = {
    graphicsQualityChanged: () => {
      this.reactEntity.reactRender();
    },
    mute: () => {
      this.reactEntity.reactRender();
    },
    unMute: () => {
      this.reactEntity.reactRender();
    },
    toggleMute: () => {
      this.reactEntity.reactRender();
    },
    setVolume: () => {
      this.reactEntity.reactRender();
    },
  };

  onButtonDown(button: ControllerButton) {
    if (button === ControllerButton.START) {
      this.game?.togglePause();
    }
  }
}

interface Props {
  game: Game;
}

function PauseMenuView({ game }: Props) {
  const graphicsQuality = getCurrentGraphicsQuality(game);
  const muted = getVolumeController(game).muted;

  const [creditsOpen, setCreditsOpen] = useState(false);

  if (creditsOpen) {
    return <Credits />;
  } else {
    return (
      <div className={classNames("PauseMenu", { paused: game.paused })}>
        <div className="TopLeft">
          <div
            className="GraphicsButton button"
            onClick={() => game.dispatch({ type: "toggleGraphicsQuality" })}
          >
            Graphics: {graphicsQuality}
          </div>
          <div
            className="MuteButton button"
            onClick={() => game.dispatch({ type: "toggleMute" })}
          >
            {muted ? "Unmute" : "Mute"}
          </div>
          <div className="button" onClick={() => setCreditsOpen(!creditsOpen)}>
            Credits
          </div>
        </div>
        <h1>Paused</h1>
        <h2>Press {game.io.usingGamepad ? "START" : "P"} to unpause</h2>
      </div>
    );
  }
}
